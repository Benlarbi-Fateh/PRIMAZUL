// backend/socket/blockCheck.js
const BlockedUser = require('../models/BlockedUser');

const checkBlockStatusSocket = async (userId, targetUserId) => {
  try {
    if (!userId || !targetUserId) return true;
   
    const blockStatus = await BlockedUser.getBlockStatus(
      userId.toString(),
      targetUserId.toString()
    );
   
    return blockStatus.isBlocked;
  } catch (error) {
    console.error('❌ Erreur vérification blocage socket:', error);
    return true;
  }
};

module.exports = { checkBlockStatusSocket };