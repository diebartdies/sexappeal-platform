require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('--- Testing SMTP Connectivity ---');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_EMAIL);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('✓ Transporter is ready');

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: 'carlonid@hotmail.com',
      subject: 'SexAppeal SMTP Test',
      text: 'This is a test email from the SexAppeal Platform.'
    };

    console.log('Sending email...');
    const info = await transporter.sendMail(message);
    console.log('✓ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ SMTP Error:', err);
  }
}

testEmail();
