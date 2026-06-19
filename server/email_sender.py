import os
import smtplib
from email.message import EmailMessage


SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
MAIL_FROM = os.getenv("MAIL_FROM", SMTP_USER)


def send_email(to_email: str, subject: str, html: str) -> None:
    if not SMTP_USER or not SMTP_PASS:
        raise RuntimeError("SMTP_USER and SMTP_PASS are required.")

    message = EmailMessage()
    message["From"] = MAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content("Please open this email in an HTML-compatible client.")
    message.add_alternative(html, subtype="html")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(message)


def send_otp_email(to_email: str, otp: str, name: str = "") -> None:
    greeting = f"Hello {name}," if name else "Hello,"
    send_email(
        to_email,
        "Your DataCircles password reset OTP",
        f"""
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
          <h2>Password reset request</h2>
          <p>{greeting} use this OTP to reset your CRM password:</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:6px;color:#2563eb">{otp}</p>
          <p style="font-size:13px;color:#6b7280">This OTP expires in 10 minutes.</p>
        </div>
        """,
    )


def send_portal_invite(to_email: str, set_password_url: str, name: str = "") -> None:
    greeting = f"Welcome {name}," if name else "Welcome,"
    send_email(
        to_email,
        "Your DataCircles CRM portal is ready",
        f"""
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
          <h2>{greeting}</h2>
          <p>Your payment is complete. Set your password to access the client portal.</p>
          <p>
            <a href="{set_password_url}" style="background:#2563eb;color:#fff;padding:11px 16px;border-radius:10px;text-decoration:none;font-weight:700">
              Set password
            </a>
          </p>
          <p style="font-size:13px;color:#6b7280">This secure link expires in 48 hours.</p>
        </div>
        """,
    )


if __name__ == "__main__":
    send_otp_email(
        os.getenv("TEST_EMAIL", SMTP_USER),
        os.getenv("TEST_OTP", "123456"),
        os.getenv("TEST_NAME", "DataCircles User"),
    )
