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
  });
};
