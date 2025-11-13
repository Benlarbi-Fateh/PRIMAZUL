const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Générer un code à 6 chiffres
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Template HTML pour l'email
const getEmailTemplate = (code, userName, type = 'registration') => {
  const title = type === 'registration' 
    ? 'Bienvenue ! Vérifiez votre compte' 
    : 'Code de connexion sécurisée';
  
  const message = type === 'registration'
    ? 'Merci de vous être inscrit ! Pour activer votre compte, veuillez utiliser le code ci-dessous :'
    : 'Vous tentez de vous connecter. Utilisez le code ci-dessous pour continuer :';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 50px 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 50px 40px;
        }
        .greeting {
          font-size: 24px;
          color: #2d3748;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .message {
          font-size: 16px;
          color: #4a5568;
          line-height: 1.8;
          margin-bottom: 40px;
        }
        .code-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          padding: 40px;
          text-align: center;
          margin: 40px 0;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        .code-label {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .code {
          font-size: 56px;
          font-weight: 900;
          color: white;
          letter-spacing: 12px;
          font-family: 'Courier New', monospace;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .expiry {
          background: #fff5f5;
          border-left: 4px solid #fc8181;
          padding: 20px;
          margin: 30px 0;
          border-radius: 8px;
        }
        .expiry-text {
          color: #c53030;
          font-size: 16px;
          font-weight: 600;
        }
        .warning {
          background: #fffbeb;
          border-left: 4px solid #f6ad55;
          padding: 25px;
          margin: 30px 0;
          border-radius: 8px;
        }
        .warning-title {
          font-size: 18px;
          color: #c05621;
          font-weight: 700;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        .warning ul {
          list-style: none;
          padding: 0;
        }
        .warning li {
          color: #744210;
          font-size: 15px;
          margin-bottom: 10px;
          padding-left: 25px;
          position: relative;
        }
        .warning li:before {
          content: "•";
          position: absolute;
          left: 0;
          font-size: 20px;
          color: #f6ad55;
        }
        .footer {
          background: #f7fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          color: #718096;
          font-size: 14px;
          line-height: 1.6;
        }
        .footer-brand {
          color: #667eea;
          font-weight: 700;
          font-size: 16px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 ${title}</h1>
          <p>Sécurité renforcée pour votre compte</p>
        </div>
        
        <div class="content">
          <p class="greeting">Bonjour ${userName} ! 👋</p>
          <p class="message">${message}</p>
          
          <div class="code-box">
            <div class="code-label">Votre code de vérification</div>
            <div class="code">${code}</div>
          </div>
          
          <div class="expiry">
            <p class="expiry-text">⏰ Ce code expire dans 10 minutes</p>
          </div>
          
          <div class="warning">
            <div class="warning-title">⚠️ Consignes de sécurité</div>
            <ul>
              <li>Ne partagez JAMAIS ce code avec qui que ce soit</li>
              <li>Notre équipe ne vous demandera JAMAIS ce code</li>
              <li>Si vous n'avez pas demandé ce code, ignorez cet email</li>
              <li>En cas de doute, contactez notre support immédiatement</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          <p class="footer-brand">© 2024 PRIMAZUL Chat - Votre messagerie sécurisée</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Envoyer le code de vérification
const sendVerificationEmail = async (email, userName, code, type = 'registration') => {
  try {
    const subject = type === 'registration' 
      ? '🔐 Code de vérification - Activation de votre compte'
      : '🔐 Code de connexion sécurisée';

    const mailOptions = {
      from: `"PRIMAZUL Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: getEmailTemplate(code, userName, type)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Impossible d\'envoyer l\'email de vérification');
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail
};