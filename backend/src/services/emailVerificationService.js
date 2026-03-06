const crypto = require("crypto");
const nodemailer = require("nodemailer");
const config = require("../config");
const AppError = require("../utils/AppError");

/**
 * In-memory store for OTPs.
 * Key: email (lower-case), Value: { otp, expiresAt }
 *
 * For production you'd swap this for a Redis / MongoDB TTL collection,
 * but for development this is perfectly fine.
 */
const otpStore = new Map();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Build a Nodemailer transporter.
 *
 * Supports two modes:
 *  1. Real SMTP — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 *  2. Ethereal (dev default) — auto-creates a free test account and logs
 *     the preview URL so you can view the email in the browser.
 */
let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (config.smtp && config.smtp.host) {
    // Real SMTP configured via .env
    _transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  } else {
    // Fallback: Ethereal – real emails you can view at https://ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    console.log("──────────────────────────────────────────────────");
    console.log("📧 Using Ethereal test email account");
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log("   Preview sent emails at https://ethereal.email");
    console.log("──────────────────────────────────────────────────");
    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return _transporter;
}

/**
 * Generate a cryptographically-secure numeric OTP.
 */
function generateOTP() {
  const digits = "0123456789";
  let otp = "";
  const bytes = crypto.randomBytes(OTP_LENGTH);
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

/**
 * Send a verification OTP to the given email address.
 */
exports.sendVerificationEmail = async (email) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

  // Store (overwrite any previous OTP for this email)
  otpStore.set(email.toLowerCase(), { otp, expiresAt });

  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp?.from || '"Cloud Library" <noreply@cloudlibrary.dev>',
    to: email,
    subject: "Your verification code — Cloud Library",
    text: `Your verification code is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #6B8F71;">Cloud Library</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                    text-align: center; padding: 24px; background: #f5f5f5; 
                    border-radius: 12px; margin: 16px 0; color: #333;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 14px;">
          This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request
          this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  // In dev mode with Ethereal, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Email preview: ${previewUrl}`);
  }

  return {
    message: "Verification email sent",
    previewUrl: previewUrl || undefined,
  };
};

/**
 * Verify that the OTP is correct and still valid.
 */
exports.verifyOTP = (email, otp) => {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) {
    throw new AppError(
      "No verification code found for this email. Please request a new one.",
      400,
    );
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    throw new AppError(
      "Verification code has expired. Please request a new one.",
      400,
    );
  }
  if (entry.otp !== otp) {
    throw new AppError("Please enter a correct OTP", 400);
  }

  // OTP is valid — remove it so it can't be reused
  otpStore.delete(email.toLowerCase());
  return true;
};
