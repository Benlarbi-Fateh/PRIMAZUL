require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('='.repeat(50));
console.log('TEST DE CONFIGURATION EMAIL PRIMAZUL');
console.log('='.repeat(50));

console.log('\n📧 Configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Défini (masqué)' : '❌ NON DÉFINI');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const testEmail = async () => {
  try {
    console.log('\n📤 Envoi de l\'email de test...');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '✅ Test PRIMAZUL - Configuration OK',
      html: `
        <h1 style="color: #4F46E5;">✅ Configuration Gmail Réussie !</h1>
        <p>Si vous recevez cet email, votre configuration Nodemailer fonctionne parfaitement.</p>
        <p><strong>Vous pouvez maintenant envoyer des codes de vérification.</strong></p>
      `
    });

    console.log('\n✅ EMAIL ENVOYÉ AVEC SUCCÈS !');
    console.log('Message ID:', info.messageId);
    console.log('\n👉 Vérifiez votre boîte mail:', process.env.EMAIL_USER);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.log('\n❌ ERREUR LORS DE L\'ENVOI:');
    console.error(error);
    console.log('\n💡 Vérifiez:');
    console.log('1. Avez-vous créé un "Mot de passe d\'application" Gmail ?');
    console.log('2. La validation en 2 étapes est-elle activée ?');
    console.log('3. Le fichier .env contient-il les bonnes informations ?');
    console.log('='.repeat(50));
  }
};

testEmail();