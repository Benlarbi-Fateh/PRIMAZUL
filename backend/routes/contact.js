const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, message, rating } = req.body;

  // 🔐 configuration du transporteur
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tonemail@gmail.com",       // ton adresse Gmail
      pass: "tonMotDePasseOuAppPassword" // mot de passe ou "app password" Google
    },
  });

  // 📧 contenu du mail
  const mailOptions = {
    from: email,
    to: "tonemail@gmail.com",
    subject: `Nouveau message d’un utilisateur (${name})`,
    text: `
Nom : ${name}
Email : ${email}
Note : ${rating} étoiles
Message :
${message}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message envoyé avec succès !" });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l’envoi de l’email." });
  }
});

module.exports = router;
