from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from core.config import settings

def get_mail_config():
    # Detect if we should use SSL or STARTTLS based on port
    use_ssl = settings.SMTP_PORT == 465
    use_starttls = settings.SMTP_PORT == 587
    
    return ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER,
        MAIL_PASSWORD=settings.SMTP_PASS,
        MAIL_FROM=settings.SMTP_USER,
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_HOST,
        MAIL_STARTTLS=use_starttls,
        MAIL_SSL_TLS=use_ssl,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )

async def send_otp_email(email_to: EmailStr, otp: str):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">Verification Code</h2>
            <p style="font-size: 16px; color: #555;">Hello,</p>
            <p style="font-size: 16px; color: #555;">Use the following OTP to complete your verification process. This OTP is valid for 10 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #4A90E2; letter-spacing: 5px; border: 2px dashed #4A90E2; padding: 10px 20px; border-radius: 5px;">{otp}</span>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">If you did not request this code, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">Lead & Sales Management System</p>
        </div>
    </body>
    </html>
    """
    message = MessageSchema(
        subject="Your OTP Verification Code",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )
    fm = FastMail(get_mail_config())
    await fm.send_message(message)

async def send_credentials_email(email_to: EmailStr, password: str):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">Account Credentials</h2>
            <p style="font-size: 16px; color: #555;">Hello,</p>
            <p style="font-size: 16px; color: #555;">Your account has been created successfully. Here are your login credentials:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> {email_to}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> {password}</p>
            </div>
            <p style="font-size: 14px; color: #e67e22; font-weight: bold;">Important: Please change your password after logging in for the first time.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">Lead & Sales Management System</p>
        </div>
    </body>
    </html>
    """
    message = MessageSchema(
        subject="Your Account Credentials",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )
    fm = FastMail(get_mail_config())
    await fm.send_message(message)

async def send_forgot_password_otp_email(email_to: EmailStr, otp: str):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">Password Reset Code</h2>
            <p style="font-size: 16px; color: #555;">Hello,</p>
            <p style="font-size: 16px; color: #555;">Use the following OTP to reset your password. This OTP is valid for 10 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; border: 2px dashed #e74c3c; padding: 10px 20px; border-radius: 5px;">{otp}</span>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">Lead & Sales Management System</p>
        </div>
    </body>
    </html>
    """
    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )
    fm = FastMail(get_mail_config())
    await fm.send_message(message)
