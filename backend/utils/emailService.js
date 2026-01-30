const Mailjet = require("node-mailjet");

// ❌ NE PAS faire ça (s'exécute avant dotenv)
// const mailjet = new Mailjet({ ... });

// ✅ Initialisation LAZY (à la demande)
let mailjetClient = null;

const getMailjetClient = () => {
  if (!mailjetClient) {
    // Vérifier les variables
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      throw new Error(
        "❌ MAILJET_API_KEY et MAILJET_SECRET_KEY sont requis dans le fichier .env",
      );
    }

    mailjetClient = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY,
    });

    console.log("✅ Client Mailjet initialisé");
  }
  return mailjetClient;
};

// Vérifier la configuration au démarrage
const verifyEmailConnection = async () => {
  console.log("📧 Vérification configuration Mailjet...");
  console.log(
    "   - API_KEY:",
    process.env.MAILJET_API_KEY ? "✅ Défini" : "❌ MANQUANT",
  );
  console.log(
    "   - SECRET_KEY:",
    process.env.MAILJET_SECRET_KEY ? "✅ Défini" : "❌ MANQUANT",
  );
  console.log(
    "   - SENDER_EMAIL:",
    process.env.MAILJET_SENDER_EMAIL || "❌ MANQUANT",
  );

  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    console.error("❌ Configuration Mailjet incomplète!");
    return false;
  }

  try {
    const client = getMailjetClient();
    await client.get("user").request();
    console.log("✅ Connexion Mailjet vérifiée!");
    return true;
  } catch (error) {
    console.error("❌ Erreur connexion Mailjet:", error.message);
    return false;
  }
};

// Générer un code à 6 chiffres
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Template HTML pour l'email
const getEmailTemplate = (code, userName, type = "registration") => {
  let title, message;

  switch (type) {
    case "registration":
      title = "Bienvenue ! Vérifiez votre compte";
      message =
        "Merci de vous être inscrit ! Pour activer votre compte, veuillez utiliser le code ci-dessous :";
      break;
    case "login":
      title = "Code de connexion sécurisée";
      message =
        "Vous tentez de vous connecter. Utilisez le code ci-dessous pour continuer :";
      break;
    case "password-reset":
      title = "Réinitialisation de mot de passe";
      message =
        "Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code ci-dessous :";
      break;
    case "email-change":
      title = "Changement d'email demandé";
      message =
        "Vous avez demandé à changer votre adresse email. Utilisez le code ci-dessous :";
      break;
    case "change-password":
      title = "Modification de mot de passe";
      message =
        "Vous avez demandé à modifier votre mot de passe. Utilisez le code ci-dessous :";
      break;
    default:
      title = "Code de vérification";
      message = "Votre code de vérification :";
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px 30px; text-align: center; }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
        .content { padding: 50px 40px; }
        .greeting { font-size: 24px; color: #2d3748; margin-bottom: 20px; font-weight: 600; }
        .message { font-size: 16px; color: #4a5568; line-height: 1.8; margin-bottom: 40px; }
        .code-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 40px; text-align: center; margin: 40px 0; }
        .code { font-size: 48px; font-weight: 900; color: white; letter-spacing: 12px; font-family: 'Courier New', monospace; }
        .expiry { background: #fff5f5; border-left: 4px solid #fc8181; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .expiry-text { color: #c53030; font-size: 16px; font-weight: 600; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 ${title}</h1>
        </div>
        <div class="content">
          <p class="greeting">Bonjour ${userName} ! 👋</p>
          <p class="message">${message}</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <div class="expiry">
            <p class="expiry-text">⏰ Ce code expire dans 10 minutes</p>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 PRIMAZUL Chat</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 📤 Envoyer le code de vérification
const sendVerificationEmail = async (
  email,
  userName,
  code,
  type = "registration",
) => {
  console.log("📤 Envoi email via Mailjet...");
  console.log("   - Destinataire:", email);
  console.log("   - Type:", type);

  try {
    const client = getMailjetClient();

    let subject;
    switch (type) {
      case "registration":
        subject = "🔐 Code de vérification - Activation de votre compte";
        break;
      case "login":
        subject = "🔐 Code de connexion sécurisée";
        break;
      case "password-reset":
        subject = "🔑 Code de réinitialisation de mot de passe";
        break;
      case "email-change":
        subject = "✉️ Code de vérification pour changement d'email";
        break;
      case "change-password":
        subject = "🔐 Code de modification de mot de passe";
        break;
      default:
        subject = "🔐 Code de vérification";
    }

    const result = await client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_SENDER_EMAIL,
            Name: "PRIMAZUL Chat",
          },
          To: [
            {
              Email: email,
              Name: userName,
            },
          ],
          Subject: subject,
          TextPart: `Bonjour ${userName}, votre code de vérification est : ${code}. Ce code expire dans 10 minutes.`,
          HTMLPart: getEmailTemplate(code, userName, type),
        },
      ],
    });

    console.log("✅ Email envoyé avec succès!");
    console.log("   - Status:", result.response.status);

    return {
      success: true,
      messageId: result.body.Messages?.[0]?.To?.[0]?.MessageID,
    };
  } catch (error) {
    console.error("❌ ERREUR envoi email Mailjet:");
    console.error("   - Message:", error.message);
    console.error("   - Details:", error.response?.body || error);

    throw new Error(`Échec envoi email: ${error.message}`);
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  verifyEmailConnection,
};
