const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTP = async (to, otp) => {
  await transporter.sendMail({
    from: `"WorkTrust Lite" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your MFA Verification Code',
    text: `Your verification code is: ${otp}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6fffa; padding: 32px 24px; border-radius: 12px; max-width: 420px; margin: 0 auto; border: 1px solid #e0f2f1;">
        <h2 style="color: #059669; text-align: center; margin-bottom: 12px;">WorkTrust Lite</h2>
        <p style="color: #222; font-size: 16px; text-align: center; margin-bottom: 24px;">Your <b>Multi-Factor Authentication (MFA)</b> code is:</p>
        <div style="background: #e0f2f1; color: #059669; font-size: 2rem; font-weight: bold; letter-spacing: 0.2em; padding: 16px 0; border-radius: 8px; text-align: center; margin-bottom: 24px; border: 1px solid #b2f5ea;">
          ${otp}
        </div>
        <p style="color: #444; font-size: 15px; text-align: center; margin-bottom: 16px;">Enter this code in the login screen to complete your sign in.<br/>This code will expire in 5 minutes.</p>
        <p style="color: #888; font-size: 13px; text-align: center; margin-top: 32px;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
};

exports.sendMail = async (to, subject, text, html) => {
  await transporter.sendMail({
    from: `"WorkTrust Lite" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
};
