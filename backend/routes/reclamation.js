const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message vide" });

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: "Nouvelle réclamation utilisateur",
      text: message,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Erreur lors de l'envoi du mail :", err);
    res.status(500).json({ error: "Impossible d'envoyer le mail" });
  }
});

module.exports = router;
