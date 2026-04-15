import time
import os
import smtplib
import ssl
import secrets
from collections import defaultdict, deque
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from db.connection import get_db
from services import user_service
from schemas.user_schema import Token, UserRegisterIn, UserRegisteredOut
from datetime import timedelta
from core.config import settings
from core.security import hash_password
from models.user import User, UserRole

router = APIRouter()
_FAILED_LOGIN_LIMIT = 5
_FAILED_LOGIN_WINDOW_SECONDS = 900
_failed_login_attempts: dict[str, deque[float]] = defaultdict(deque)
_OTP_TTL_SECONDS = 300
_otp_store: dict[str, tuple[str, float]] = {}
_OTP_RESEND_COOLDOWN_SECONDS = 30
_OTP_MAX_ATTEMPTS = 5
_OTP_BLOCK_SECONDS = 600
_otp_last_sent_at: dict[str, float] = {}
_otp_invalid_attempts: dict[str, int] = {}
_otp_blocked_until: dict[str, float] = {}
_FORGOT_OTP_TTL_SECONDS = 300
_FORGOT_OTP_RESEND_COOLDOWN_SECONDS = 30
_FORGOT_OTP_MAX_ATTEMPTS = 5
_FORGOT_OTP_BLOCK_SECONDS = 600
_forgot_otp_store: dict[str, tuple[str, float]] = {}
_forgot_otp_last_sent_at: dict[str, float] = {}
_forgot_otp_invalid_attempts: dict[str, int] = {}
_forgot_otp_blocked_until: dict[str, float] = {}


def _get_email_config() -> tuple[str, int, str, str]:
    host = (settings.SMTP_HOST or "").strip()
    port = int(settings.SMTP_PORT or 0)
    user = (settings.SMTP_USER or "").strip()
    password = (settings.SMTP_PASS or "").strip()
    if password.lower() in {"your_app_password_here", "app_password_here"}:
        password = ""
    if not (host and port and user and password):
        raise HTTPException(status_code=500, detail="Email service not configured")
    return host, port, user, password


class SendOtpIn(BaseModel):
    email: EmailStr


class VerifyOtpIn(BaseModel):
    email: EmailStr
    otp: str
    full_name: str


class ForgotPasswordSendOtpIn(BaseModel):
    email: EmailStr


class ForgotPasswordResetIn(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


def _get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _is_rate_limited(client_ip: str) -> bool:
    now = time.time()
    attempts = _failed_login_attempts[client_ip]
    while attempts and (now - attempts[0]) > _FAILED_LOGIN_WINDOW_SECONDS:
        attempts.popleft()
    return len(attempts) >= _FAILED_LOGIN_LIMIT


def _record_failed_attempt(client_ip: str) -> None:
    now = time.time()
    attempts = _failed_login_attempts[client_ip]
    attempts.append(now)
    while attempts and (now - attempts[0]) > _FAILED_LOGIN_WINDOW_SECONDS:
        attempts.popleft()


def _cleanup_expired_otp(now_ts: float) -> None:
    expired_emails = [
        em for em, (_otp, ts) in _otp_store.items() if (now_ts - ts) > _OTP_TTL_SECONDS
    ]
    for em in expired_emails:
        _otp_store.pop(em, None)

    blocked_emails = [em for em, until_ts in _otp_blocked_until.items() if until_ts <= now_ts]
    for em in blocked_emails:
        _otp_blocked_until.pop(em, None)
        _otp_invalid_attempts.pop(em, None)

    expired_forgot = [
        em for em, (_otp, ts) in _forgot_otp_store.items() if (now_ts - ts) > _FORGOT_OTP_TTL_SECONDS
    ]
    for em in expired_forgot:
        _forgot_otp_store.pop(em, None)

    unblocked_forgot = [em for em, until_ts in _forgot_otp_blocked_until.items() if until_ts <= now_ts]
    for em in unblocked_forgot:
        _forgot_otp_blocked_until.pop(em, None)
        _forgot_otp_invalid_attempts.pop(em, None)


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _generate_random_password(length: int = 12) -> str:
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"
    # Ensure at least one uppercase and one digit for existing password policy
    base = [secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), secrets.choice("0123456789")]
    for _ in range(max(length - 2, 0)):
        base.append(secrets.choice(alphabet))
    secrets.SystemRandom().shuffle(base)
    return "".join(base)


def _send_otp_email(email_to: str, otp: str) -> None:
    host, port, user, password = _get_email_config()

    msg = EmailMessage()
    msg["Subject"] = "Your OTP for registration"
    msg["From"] = user
    msg["To"] = email_to
    msg.set_content(
        "Your OTP is: "
        f"{otp}\n\n"
        "This OTP will expire in 5 minutes.\n"
        "If you did not request this, please ignore this email."
    )

    context = ssl.create_default_context()
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.starttls(context=context)
                server.login(user, password)
                server.send_message(msg)
    except Exception as e:
        print(f"DEBUG: _send_otp_email error: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to send OTP email")


def _send_credentials_email(email_to: str, generated_password: str) -> None:
    host, port, user, password = _get_email_config()

    msg = EmailMessage()
    msg["Subject"] = "Your account credentials"
    msg["From"] = user
    msg["To"] = email_to
    msg.set_content(
        "Your account has been created successfully.\n\n"
        f"Email: {email_to}\n"
        f"Password: {generated_password}\n\n"
        "Please login and change your password."
    )

    context = ssl.create_default_context()
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.starttls(context=context)
                server.login(user, password)
                server.send_message(msg)
    except Exception as e:
        print(f"DEBUG: _send_credentials_email error: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to send credentials email")


def _send_forgot_password_otp_email(email_to: str, otp: str) -> None:
    host, port, user, password = _get_email_config()

    msg = EmailMessage()
    msg["Subject"] = "Your OTP for password reset"
    msg["From"] = user
    msg["To"] = email_to
    msg.set_content(
        "Your password reset OTP is: "
        f"{otp}\n\n"
        "This OTP will expire in 5 minutes.\n"
        "If you did not request this, please ignore this email."
    )

    context = ssl.create_default_context()
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.starttls(context=context)
                server.login(user, password)
                server.send_message(msg)
    except Exception as e:
        print(f"DEBUG: _send_forgot_password_otp_email error: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to send OTP email")


@router.post("/register", response_model=UserRegisteredOut)
def register(user: UserRegisterIn, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="OTP verification required")


@router.post("/login", response_model=Token)
def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    client_ip = _get_client_ip(request)
    if _is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Try later.",
        )

    u = user_service.authenticate_user(db, form_data.username, form_data.password)
    if not u:
        _record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _failed_login_attempts.pop(client_ip, None)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = user_service.create_access_token(
        data={"sub": u.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/send-otp")
def send_otp(body: SendOtpIn):
    now_ts = time.time()
    _cleanup_expired_otp(now_ts)
    email = body.email.lower().strip()

    last_sent_at = _otp_last_sent_at.get(email)
    if last_sent_at and (now_ts - last_sent_at) < _OTP_RESEND_COOLDOWN_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting OTP again",
        )

    otp = _generate_otp()
    _otp_store[email] = (otp, now_ts)
    _otp_last_sent_at[email] = now_ts
    _send_otp_email(body.email, otp)
    return {"message": "OTP sent successfully"}


@router.post("/verify-otp")
def verify_otp(body: VerifyOtpIn, db: Session = Depends(get_db)):
    now_ts = time.time()
    _cleanup_expired_otp(now_ts)

    email = body.email.lower().strip()
    full_name = (body.full_name or "").strip()
    provided_otp = (body.otp or "").strip()
    blocked_until = _otp_blocked_until.get(email, 0)
    if blocked_until > now_ts:
        raise HTTPException(status_code=429, detail="Too many invalid attempts. Try later.")

    otp_data = _otp_store.get(email)

    if not otp_data:
        _otp_invalid_attempts[email] = _otp_invalid_attempts.get(email, 0) + 1
        if _otp_invalid_attempts[email] >= _OTP_MAX_ATTEMPTS:
            _otp_blocked_until[email] = now_ts + _OTP_BLOCK_SECONDS
            raise HTTPException(status_code=429, detail="Too many invalid attempts. Try later.")
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    saved_otp, created_ts = otp_data
    if (now_ts - created_ts) > _OTP_TTL_SECONDS or not secrets.compare_digest(saved_otp, provided_otp):
        _otp_invalid_attempts[email] = _otp_invalid_attempts.get(email, 0) + 1
        if _otp_invalid_attempts[email] >= _OTP_MAX_ATTEMPTS:
            _otp_blocked_until[email] = now_ts + _OTP_BLOCK_SECONDS
            raise HTTPException(status_code=429, detail="Too many invalid attempts. Try later.")
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required")

    if user_service.get_user_by_email(db, email):
        _otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail="Email already registered")

    random_password = _generate_random_password()
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(random_password),
        role=UserRole.SALES_AGENT,
    )

    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as e:
        db.rollback()
        print(f"DEBUG: verify_otp DB error: {str(e)}")
        raise HTTPException(status_code=500, detail="Something went wrong")
    except Exception as e:
        db.rollback()
        print(f"DEBUG: verify_otp generic error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Something went wrong")


    finally:
        _otp_store.pop(email, None)
        _otp_invalid_attempts.pop(email, None)
        _otp_blocked_until.pop(email, None)

    _send_credentials_email(email, random_password)
    return {"message": "OTP verified and user created"}


@router.post("/forgot-password/send-otp")
def forgot_password_send_otp(body: ForgotPasswordSendOtpIn, db: Session = Depends(get_db)):
    now_ts = time.time()
    _cleanup_expired_otp(now_ts)
    email = body.email.lower().strip()

    last_sent_at = _forgot_otp_last_sent_at.get(email)
    if last_sent_at and (now_ts - last_sent_at) < _FORGOT_OTP_RESEND_COOLDOWN_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting OTP again",
        )

    user = user_service.get_user_by_email(db, email)
    if user:
        otp = _generate_otp()
        _forgot_otp_store[email] = (otp, now_ts)
        _forgot_otp_invalid_attempts.pop(email, None)
        _forgot_otp_blocked_until.pop(email, None)
        _send_forgot_password_otp_email(email, otp)

    _forgot_otp_last_sent_at[email] = now_ts
    return {"message": "If the email is registered, OTP has been sent"}


@router.post("/forgot-password/reset")
def forgot_password_reset(body: ForgotPasswordResetIn, db: Session = Depends(get_db)):
    now_ts = time.time()
    _cleanup_expired_otp(now_ts)

    email = body.email.lower().strip()
    provided_otp = (body.otp or "").strip()
    new_password = (body.new_password or "").strip()

    blocked_until = _forgot_otp_blocked_until.get(email, 0)
    if blocked_until > now_ts:
        raise HTTPException(status_code=429, detail="Too many invalid attempts. Try later.")

    user = user_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp_data = _forgot_otp_store.get(email)
    if not otp_data:
        _forgot_otp_invalid_attempts[email] = _forgot_otp_invalid_attempts.get(email, 0) + 1
        if _forgot_otp_invalid_attempts[email] >= _FORGOT_OTP_MAX_ATTEMPTS:
            _forgot_otp_blocked_until[email] = now_ts + _FORGOT_OTP_BLOCK_SECONDS
            raise HTTPException(status_code=429, detail="Too many invalid attempts. Try later.")
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    saved_otp, created_ts = otp_data
    if (now_ts - created_ts) > _FORGOT_OTP_TTL_SECONDS or not secrets.compare_digest(saved_otp, provided_otp):
        _forgot_otp_invalid_attempts[email] = _forgot_otp_invalid_attempts.get(email, 0) + 1
        if _forgot_otp_invalid_attempts[email] >= _FORGOT_OTP_MAX_ATTEMPTS:
            _forgot_otp_blocked_until[email] = now_ts + _FORGOT_OTP_BLOCK_SECONDS
            raise HTTPException(status_code=429, detail="Too many invalid attempts. Try later.")
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user_service.validate_password_policy(new_password)
    user.hashed_password = hash_password(new_password)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Something went wrong")
    finally:
        _forgot_otp_store.pop(email, None)
        _forgot_otp_invalid_attempts.pop(email, None)
        _forgot_otp_blocked_until.pop(email, None)

    return {"message": "Password reset successful"}
