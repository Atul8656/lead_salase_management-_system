import smtplib
import ssl
import anyio
from email.message import EmailMessage
from core.config import settings

def _send_email_sync(subject: str, recipients: list[str], html_content: str):
    user = (settings.SMTP_USER or "").strip()
    password = (settings.SMTP_PASS or "").strip()
    host = (settings.SMTP_HOST or "smtp.gmail.com").strip()
    
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = ", ".join(recipients)
    msg.add_alternative(html_content, subtype="html")

    # List of ports to try (default to 587 then 465)
    ports_to_try = [587, 465]
    if settings.SMTP_PORT in ports_to_try:
        ports_to_try.remove(settings.SMTP_PORT)
        ports_to_try.insert(0, settings.SMTP_PORT)

    last_error = None
    for port in ports_to_try:
        try:
            print(f"DEBUG: Attempting to send email via {host}:{port}")
            if port == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(host, port, context=context, timeout=15) as server:
                    server.login(user, password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(host, port, timeout=15) as server:
                    server.starttls(context=ssl.create_default_context())
                    server.login(user, password)
                    server.send_message(msg)
            print(f"DEBUG: Email sent successfully via port {port}")
            return True
        except Exception as e:
            last_error = e
            print(f"DEBUG: Failed to send via port {port}: {str(e)}")
            continue
    
    raise last_error

async def send_otp_email(email_to: str, otp: str):
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
    await anyio.to_thread.run_sync(_send_email_sync, "Your OTP Verification Code", [email_to], html)

async def send_credentials_email(email_to: str, password: str):
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
    await anyio.to_thread.run_sync(_send_email_sync, "Your Account Credentials", [email_to], html)

async def send_forgot_password_otp_email(email_to: str, otp: str):
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
    await anyio.to_thread.run_sync(_send_email_sync, "Password Reset Request", [email_to], html)
