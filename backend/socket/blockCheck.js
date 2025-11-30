// backend/socket/blockCheck.js
const BlockedUser = require('../models/BlockedUser');


const checkBlockStatusSocket = async (userId, targetUserId) => {
  try {
    if (!userId || !targetUserId) return true; // Bloquer par sécurité
   
    const isBlocked = await BlockedUser.findOne({
      $or: [
        { userId: userId, blockedUserId: targetUserId },
        { userId: targetUserId, blockedUserId: userId }
      ]
    });
   
    return !!isBlocked;
  } catch (error) {
    console.error('Erreur vérification blocage socket:', error);
    return true; // Bloquer en cas d'erreur
  }
};


module.exports = { checkBlockStatusSocket };