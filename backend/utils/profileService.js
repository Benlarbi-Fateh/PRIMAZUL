const User = require('../models/User');
const { generateVerificationCode, sendVerificationEmail } = require('./emailService');

// Envoi du code de vérification pour modification profil
exports.sendProfileUpdateCode = async (userId, updatedData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  user.verificationCode = verificationCode;
  user.verificationCodeExpiry = verificationCodeExpiry;
  user.verificationCodeType = 'profile-update';
  user.pendingProfileUpdate = updatedData; // Stocker temporairement les changements
  await user.save();

  await sendVerificationEmail(
    user.email,
    user.name,
    verificationCode,
    'profile-update'
  );

  return { userId: user._id, email: user.email };
};

// Vérifier le code et appliquer les modifications
exports.verifyProfileUpdateCode = async (userId, code) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');

  if (user.verificationCode !== code)
    throw new Error('Code de vérification incorrect');

  if (user.verificationCodeExpiry < Date.now())
    throw new Error('Code expiré');

  if (user.verificationCodeType !== 'profile-update')
    throw new Error('Code invalide pour cette opération');

  // Appliquer les changements
  Object.assign(user, user.pendingProfileUpdate);
  user.verificationCode = undefined;
  user.verificationCodeExpiry = undefined;
  user.verificationCodeType = undefined;
  user.pendingProfileUpdate = undefined;
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    status: user.status
  };
};
