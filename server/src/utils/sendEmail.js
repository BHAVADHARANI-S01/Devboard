const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from:    `"DevBoard" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your DevBoard account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="margin: 0 0 8px 0;">Welcome to DevBoard, ${name}!</h2>
        <p style="color: #666; margin: 0 0 24px 0;">Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background: #378ADD; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 13px; margin: 24px 0 0 0;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail };