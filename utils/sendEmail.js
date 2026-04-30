const nodemailer = require('nodemailer');

const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return (
    user && pass &&
    user !== 'your_gmail@gmail.com' &&
    pass !== 'your_16_char_app_password' &&
    user.includes('@')
  );
};

const sendEmail = async (options) => {
  if (!isEmailConfigured()) {
    console.log(`📧 [Email skipped — credentials not configured] To: ${options.email} | Subject: ${options.subject}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Timeout settings so a bad credential never hangs the server
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    const mailOptions = {
      from: `"EventSphere 🎪" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.htmlMessage || `<p>${options.message}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  Email sent to ${options.email} — MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.warn(`⚠️  sendEmail failed (${options.email}): ${err.message}`);
    // Never rethrow — email failure must never block any API response
  }
};

module.exports = sendEmail;
