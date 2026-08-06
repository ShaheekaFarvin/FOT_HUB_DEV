const nodemailer = require('nodemailer');

// ── Email sending strategy ────────────────────────────────────────────
// 1. If real SMTP credentials are set in .env → send a real email.
// 2. Otherwise (no setup needed) → just print the OTP clearly in the
//    backend console / terminal. This lets you develop and test the
//    entire OTP flow without configuring any email provider.
//
// To switch to real emails later, just fill in SMTP_USER / SMTP_PASS
// in backend/.env (see README) — no code changes needed.

const hasRealSmtp = () =>
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  !process.env.SMTP_USER.includes('your-email') &&
  !process.env.SMTP_PASS.includes('your-app-password');

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const buildHtml = (otp, action) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8f9fa;padding:20px;border-radius:12px;">
    <div style="background:linear-gradient(135deg,#0d1b2a,#1a2f4a);border-radius:12px;padding:32px;text-align:center;margin-bottom:20px;">
      <div style="background:#c9a84c;width:56px;height:56px;border-radius:14px;display:inline-block;padding:8px;margin-bottom:16px;">
        <span style="font-weight:900;font-size:14px;color:#0d1b2a;">FOT RJT</span>
      </div>
      <h1 style="color:#fff;font-size:22px;margin:0 0 4px;">FOT Student Hub</h1>
      <p style="color:rgba(201,168,76,0.85);font-size:13px;margin:0;">Rajarata University of Sri Lanka</p>
    </div>
    <div style="background:#fff;border-radius:12px;padding:28px;text-align:center;border:1px solid #e5e7eb;">
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">
        Use this OTP to <strong>${action}</strong>.<br/>
        It expires in <strong>10 minutes</strong>.
      </p>
      <div style="background:#f0f4ff;border:2px dashed #c9a84c;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="color:#6b7280;font-size:12px;margin:0 0 8px;letter-spacing:0.05em;text-transform:uppercase;font-weight:600;">Your OTP Code</p>
        <p style="color:#0d1b2a;font-size:38px;font-weight:900;letter-spacing:10px;margin:0;">${otp}</p>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin:0;">If you did not request this, please ignore this email.</p>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:11px;margin:16px 0 0;">Faculty of Technology · Mihintale, Sri Lanka</p>
  </div>`;

const sendOtpEmail = async (to, otp, purpose = 'login') => {
  const action = purpose === 'register' ? 'complete your registration'
    : purpose === 'reset' ? 'reset your password'
    : 'sign in';

  if (hasRealSmtp()) {
    // ── Real email mode ──
    await getTransporter().sendMail({
      from: `"FOT Student Hub" <${process.env.SMTP_USER}>`,
      to,
      subject: `FOT Student Hub — Your OTP: ${otp}`,
      html: buildHtml(otp, action),
    });
    console.log(`📧 Real email sent to ${to}`);
  } else {
    // ── Dev mode: no SMTP configured, just print to console ──
    console.log('\n' + '═'.repeat(50));
    console.log(`🔑  OTP for ${to}`);
    console.log(`    Code: ${otp}`);
    console.log(`    Purpose: ${purpose}`);
    console.log('    (No SMTP configured — this is dev mode. See backend/.env)');
    console.log('═'.repeat(50) + '\n');
  }
};

module.exports = { sendOtpEmail };
