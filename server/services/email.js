import nodemailer from "nodemailer";

const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function getTransporter() {
  if (!smtpReady) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendMail(message) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP is not configured. Email skipped:", message.subject);
    return { skipped: true };
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    ...message
  });
}

export async function sendPortalInviteEmail({ to, name, setPasswordUrl, packageName }) {
  return sendMail({
    to,
    subject: "Your DataCircles CRM portal is ready",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h2 style="margin:0 0 12px">Welcome${name ? `, ${name}` : ""}</h2>
        <p>Your payment${packageName ? ` for <strong>${packageName}</strong>` : ""} is complete. Please set your password to access your client portal.</p>
        <p><a href="${setPasswordUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:11px 16px;border-radius:10px;text-decoration:none;font-weight:700">Set password</a></p>
        <p style="font-size:13px;color:#6b7280">This secure link expires in 48 hours.</p>
      </div>
    `
  });
}

export async function sendForgotPasswordOtpEmail({ to, name, otp }) {
  return sendMail({
    to,
    subject: "Your DataCircles password reset OTP",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h2 style="margin:0 0 12px">Password reset request</h2>
        <p>Hello${name ? ` ${name}` : ""}, use this OTP to reset your CRM password:</p>
        <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:18px 0;color:#2563eb">${otp}</p>
        <p style="font-size:13px;color:#6b7280">This OTP expires in 10 minutes. Ignore this email if you did not request it.</p>
      </div>
    `
  });
}
