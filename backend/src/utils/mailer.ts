import nodemailer from 'nodemailer';

export async function sendOTPEmail(to: string, otp: string) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass || user === 'your-gmail@gmail.com') {
    throw new Error('SMTP credentials not configured in .env. Please set SMTP_USER and SMTP_PASS.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"CodeForge Security" <security@codeforge.local>',
    to,
    subject: 'Your Password Reset OTP',
    text: `Your CodeForge password reset OTP is: ${otp}. It will expire in 15 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Your OTP is:</p>
        <h1 style="background: #f4f4f5; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h1>
        <p>It will expire in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  console.log('OTP Email sent to %s (MessageId: %s)', to, info.messageId);
}
