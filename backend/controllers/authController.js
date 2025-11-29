const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');
const profileService = require('../utils/profileService');

// 🆕 FONCTION : Vérifier si le 2FA est nécessaire (24 heures)
const isTwoFactorRequired = (user) => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  const timeSinceLastLogin = Date.now() - new Date(user.lastLogin).getTime();
  
  console.log(`⏰ Dernière connexion: ${user.lastLogin}`);
  console.log(`⏰ Temps écoulé: ${Math.round(timeSinceLastLogin / (60 * 60 * 1000))} heures`);
  console.log(`🔐 2FA requis: ${timeSinceLastLogin > TWENTY_FOUR_HOURS}`);
  
  return timeSinceLastLogin > TWENTY_FOUR_HOURS;
};

// 🆕 INSCRIPTION - Envoie le code de vérification
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer le code de vérification
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Créer l'utilisateur NON vérifié
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpiry,
      verificationCodeType: 'registration',
      lastLogin: new Date() // 🆕 Initialiser lastLogin
    });
    
    await user.save();

    // Envoyer l'email avec le code
    await sendVerificationEmail(email, name, verificationCode, 'registration');

    console.log('✅ Utilisateur créé, code envoyé:', email);

    res.status(201).json({
      success: true,
      message: 'Code de vérification envoyé à votre email',
      userId: user._id,
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('❌ Erreur registration:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 VÉRIFIER LE CODE (INSCRIPTION) - Ne plus connecter automatiquement
exports.verifyRegistration = async (req, res) => {
  try {
    const { userId, code } = req.body;

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si déjà vérifié
    if (user.isVerified) {
      return res.status(400).json({ error: 'Compte déjà vérifié' });
    }

    // Vérifier le code et l'expiration
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Code de vérification incorrect' });
    }

    if (user.verificationCodeExpiry < Date.now()) {
      return res.status(400).json({ error: 'Code expiré. Demandez un nouveau code.' });
    }

    // Vérifier le compte SANS générer le token
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    user.verificationCodeType = undefined;
    user.lastLogin = new Date(); // 🆕 Mettre à jour lastLogin
    await user.save();

    console.log('✅ Compte vérifié:', user.email);

    // Ne pas envoyer le token, juste confirmer la vérification
    res.json({
      success: true,
      message: 'Compte vérifié ! Vous pouvez maintenant personnaliser votre profil.',
      userId: user._id
    });
  } catch (error) {
    console.error('❌ Erreur verification:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 FINALISER L'INSCRIPTION (après photo de profil)
exports.finalizeRegistration = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: 'Compte non vérifié' });
    }

    // Mettre l'utilisateur en ligne et mettre à jour lastLogin
    user.isOnline = true;
    user.lastLogin = new Date(); // 🆕 Mettre à jour lastLogin
    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    console.log('✅ Inscription finalisée:', user.email);

    res.json({
      success: true,
      message: 'Bienvenue sur PrimAzul !',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('❌ Erreur finalize registration:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 RENVOYER UN CODE
exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Générer un nouveau code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = verificationCodeExpiry;
    await user.save();

    // Envoyer l'email
    const type = user.isVerified ? 'login' : 'registration';
    await sendVerificationEmail(email, user.name, verificationCode, type);

    console.log('✅ Nouveau code envoyé:', email);

    res.json({
      success: true,
      message: 'Nouveau code envoyé à votre email'
    });
  } catch (error) {
    console.error('❌ Erreur resend code:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 CONNEXION - 2FA après 24 heures d'inactivité
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si le compte est vérifié
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Compte non vérifié. Veuillez vérifier votre email.',
        requiresVerification: true,
        userId: user._id,
        email: user.email
      });
    }

    // 🆕 VÉRIFIER SI LE 2FA EST NÉCESSAIRE (24 heures)
    const requiresTwoFactor = isTwoFactorRequired(user);
    
    if (!requiresTwoFactor) {
      // ✅ Connexion directe sans 2FA (activité récente)
      user.lastLogin = new Date();
      user.isOnline = true;
      await user.save();

      const token = generateToken(user._id);

      console.log('✅ Connexion directe (2FA non requis):', user.email);

      return res.json({
        success: true,
        message: 'Connexion réussie !',
        token,
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          profilePicture: user.profilePicture 
        },
        requiresVerification: false // 🆕 Indiquer que le 2FA n'est pas requis
      });
    }

    // 🔐 2FA REQUIS - Envoyer le code (inactivité > 24h)
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = verificationCodeExpiry;
    user.verificationCodeType = 'login';
    await user.save();

    // Envoyer l'email avec le code
    await sendVerificationEmail(email, user.name, verificationCode, 'login');

    console.log('✅ 2FA requis - Code de connexion envoyé:', email);

    res.json({
      success: true,
      message: 'Code de vérification envoyé à votre email',
      userId: user._id,
      email: user.email,
      requiresVerification: true // 🆕 Indiquer que le 2FA est requis
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 VÉRIFIER LE CODE (CONNEXION)
exports.verifyLogin = async (req, res) => {
  try {
    const { userId, code } = req.body;

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier le code et l'expiration
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Code de vérification incorrect' });
    }

    if (user.verificationCodeExpiry < Date.now()) {
      return res.status(400).json({ error: 'Code expiré. Demandez un nouveau code.' });
    }

    // Connexion réussie
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    user.verificationCodeType = undefined;
    user.isOnline = true;
    user.lastLogin = new Date(); // 🆕 METTRE À JOUR LA DERNIÈRE CONNEXION
    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    console.log('✅ Connexion 2FA réussie:', user.email);

    res.json({
      success: true,
      message: 'Connexion réussie !',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        profilePicture: user.profilePicture 
      }
    });
  } catch (error) {
    console.error('❌ Erreur verify login:', error);
    res.status(500).json({ error: error.message });
  }
};

// FONCTION DE RECHERCHE D'UTILISATEURS
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: "La recherche ne peut pas être vide" 
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { isVerified: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email profilePicture status isOnline')
    .limit(20);

    res.status(200).json({ 
      success: true, 
      users 
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    res.status(500).json({ 
      success: false, 
      error: "Erreur serveur lors de la recherche" 
    });
  }
};

// Récupérer tous les utilisateurs (sauf soi-même)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      isVerified: true
    })
      .select('-password')
      .sort({ name: 1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🆕 DEMANDER LA RÉINITIALISATION DU MOT DE PASSE
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'Si cet email existe, un code de réinitialisation a été envoyé'
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = verificationCodeExpiry;
    user.verificationCodeType = 'password-reset';
    await user.save();

    await sendVerificationEmail(email, user.name, verificationCode, 'password-reset');

    console.log('✅ Code de réinitialisation envoyé:', email);

    res.json({
      success: true,
      message: 'Code de réinitialisation envoyé à votre email',
      email: user.email
    });
  } catch (error) {
    console.error('❌ Erreur forgot password:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 VÉRIFIER LE CODE DE RÉINITIALISATION
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Code de vérification incorrect' });
    }

    if (user.verificationCodeExpiry < Date.now()) {
      return res.status(400).json({ error: 'Code expiré. Demandez un nouveau code.' });
    }

    if (user.verificationCodeType !== 'password-reset') {
      return res.status(400).json({ error: 'Code invalide pour cette opération' });
    }

    console.log('✅ Code de réinitialisation vérifié:', email);

    res.json({
      success: true,
      message: 'Code vérifié. Vous pouvez maintenant réinitialiser votre mot de passe.',
      email: user.email
    });
  } catch (error) {
    console.error('❌ Erreur verify reset code:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 RÉINITIALISER LE MOT DE PASSE
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Code de vérification incorrect' });
    }

    if (user.verificationCodeExpiry < Date.now()) {
      return res.status(400).json({ error: 'Code expiré' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    user.verificationCodeType = undefined;
    await user.save();

    console.log('✅ Mot de passe réinitialisé:', email);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    });
  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 METTRE À JOUR LAST LOGIN (pour les requêtes automatiques)
exports.updateLastLogin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    user.lastLogin = new Date();
    await user.save();

    console.log('✅ Last login mis à jour pour:', user.email);

    res.json({
      success: true,
      message: 'Last login mis à jour',
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('❌ Erreur updateLastLogin:', error);
    res.status(500).json({ error: error.message });
  }
};
// 🚀 Envoi code pour mise à jour profil
exports.sendProfileUpdateCode = async (req, res) => {
  try {
    const { userId } = req.user; // ou req.body.userId si nécessaire
    const updatedData = req.body;

    const data = await profileService.sendProfileUpdateCode(userId, updatedData);
    res.json({ success: true, message: 'Code de vérification envoyé', ...data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// 🚀 Vérification code et sauvegarde profil
exports.verifyProfileUpdateCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const updatedUser = await profileService.verifyProfileUpdateCode(userId, code);
    res.json({ success: true, message: 'Profil mis à jour !', user: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
