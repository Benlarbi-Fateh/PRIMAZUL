const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendWelcomeEmail(to, username) {
  try {
    await transporter.sendMail({
      from: `"Primazul 🌊" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Bienvenue sur Primazul 🌟",
      html: `
        <h2>Bienvenue ${username} !</h2>
        <p>Merci de vous être inscrit sur <b>Primazul</b>.</p>
        <p>Nous sommes ravis de vous accueillir 🫶</p>
        <p>À très bientôt,<br>L'équipe Primazul</p>
      `
    });
    console.log(`✅ Email envoyé à ${to}`);
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du mail :', error);
  }
}

module.exports = { sendWelcomeEmail };
