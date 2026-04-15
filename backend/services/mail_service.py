import resend
from core.config import settings

# Initialize Resend with API Key
resend.api_key = settings.RESEND_API_KEY

async def send_otp_email(email_to: str, otp: str):
    """
    Sends a registration OTP email via Resend API.
    """
    try:
        params = {
            "from": "onboarding@resend.dev",
            "to": [email_to],
            "subject": "OTP Verification Code",
            "html": f"""
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
            """,
        }
        resend.Emails.send(params)
        print(f"DEBUG: Resend - OTP email sent to {email_to}")
    except Exception as e:
        print(f"ERROR: Resend failure for OTP: {str(e)}")
        # We don't raise to prevent crashing, but it will be logged

async def send_credentials_email(email_to: str, password: str):
    """
    Sends account credentials via Resend API.
    """
    try:
        params = {
            "from": "onboarding@resend.dev",
            "to": [email_to],
            "subject": "Your Account Credentials",
            "html": f"""
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
            """,
        }
        resend.Emails.send(params)
        print(f"DEBUG: Resend - Credentials email sent to {email_to}")
    except Exception as e:
        print(f"ERROR: Resend failure for credentials: {str(e)}")

async def send_forgot_password_otp_email(email_to: str, otp: str):
    """
    Sends password reset OTP via Resend API.
    """
    try:
        params = {
            "from": "onboarding@resend.dev",
            "to": [email_to],
            "subject": "Password Reset Request",
            "html": f"""
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
            """,
        }
        resend.Emails.send(params)
        print(f"DEBUG: Resend - Reset OTP email sent to {email_to}")
    except Exception as e:
        print(f"ERROR: Resend failure for reset OTP: {str(e)}")
