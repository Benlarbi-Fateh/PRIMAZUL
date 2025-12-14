const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');

// 📊 Récupérer le profil complet de l'utilisateur connecté
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password -verificationCode -resetPasswordCode');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Calculer les statistiques en temps réel
    const messagesCount = await Message.countDocuments({ sender: userId });
    const contactsCount = await Conversation.countDocuments({
      participants: userId,
      isGroup: false
    });
    const groupsCount = await Conversation.countDocuments({
      participants: userId,
      isGroup: true
    });

    // Mettre à jour les stats
    user.stats.messagesCount = messagesCount;
    user.stats.contactsCount = contactsCount;
    user.stats.groupsCount = groupsCount;
    await user.save();

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Erreur getMyProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

// 👤 Récupérer le profil d'un autre utilisateur
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId).select('-password -verificationCode -resetPasswordCode');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si c'est un contact
    const isContact = await Conversation.exists({
      participants: { $all: [currentUserId, userId] },
      isGroup: false
    });

    // Appliquer les paramètres de confidentialité
    const profileData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      stats: user.stats
    };

    // Photo de profil selon les paramètres
    if (
      user.privacySettings.showProfilePicture === 'everyone' ||
      (user.privacySettings.showProfilePicture === 'contacts' && isContact)
    ) {
      profileData.profilePicture = user.profilePicture;
    } else {
      profileData.profilePicture = null;
    }

    // Statut en ligne selon les paramètres
    if (
      user.privacySettings.showOnlineStatus === 'everyone' ||
      (user.privacySettings.showOnlineStatus === 'contacts' && isContact)
    ) {
      profileData.isOnline = user.isOnline;
    }

    // Dernière vue selon les paramètres
    if (
      user.privacySettings.showLastSeen === 'everyone' ||
      (user.privacySettings.showLastSeen === 'contacts' && isContact)
    ) {
      profileData.lastSeen = user.lastSeen;
    }

    res.json({
      success: true,
      user: profileData,
      isContact
    });
  } catch (error) {
    console.error('❌ Erreur getUserProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✏️ Mettre à jour le profil - MODIFIÉ POUR SUPPORTER PLUS DE CHAMPS
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, username, bio, phoneNumber, status, email, phone, location, profilePicture } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier si le username est déjà pris
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
      }
      user.username = username;
    }

    // Vérifier si l'email est déjà pris
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      user.email = email;
    }

    // Mettre à jour les champs
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    
    // Support pour phoneNumber OU phone
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (phone !== undefined) user.phoneNumber = phone;
    
    if (status) user.status = status;
    if (location !== undefined) user.location = location;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    console.log('✅ Profil mis à jour:', user.email);

    // Retourner les données au format attendu par le frontend
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        phone: user.phoneNumber, // Alias pour compatibilité
        location: user.location,
        status: user.status,
        profilePicture: user.profilePicture,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        stats: user.stats,
        privacySettings: user.privacySettings,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('❌ Erreur updateProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔐 Mettre à jour les paramètres de confidentialité
exports.updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { showOnlineStatus, showProfilePicture, showLastSeen, whoCanMessageMe } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (showOnlineStatus) user.privacySettings.showOnlineStatus = showOnlineStatus;
    if (showProfilePicture) user.privacySettings.showProfilePicture = showProfilePicture;
    if (showLastSeen) user.privacySettings.showLastSeen = showLastSeen;
    if (whoCanMessageMe) user.privacySettings.whoCanMessageMe = whoCanMessageMe;

    await user.save();

    console.log('✅ Paramètres de confidentialité mis à jour:', user.email);

    res.json({
      success: true,
      message: 'Paramètres de confidentialité mis à jour',
      privacySettings: user.privacySettings
    });
  } catch (error) {
    console.error('❌ Erreur updatePrivacySettings:', error);
    res.status(500).json({ error: error.message });
  }
};

// ⚙️ Mettre à jour les préférences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { theme, language, notifications } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (theme) user.preferences.theme = theme;
    if (language) user.preferences.language = language;
    if (notifications) {
      if (notifications.sound !== undefined) user.preferences.notifications.sound = notifications.sound;
      if (notifications.desktop !== undefined) user.preferences.notifications.desktop = notifications.desktop;
      if (notifications.messagePreview !== undefined) user.preferences.notifications.messagePreview = notifications.messagePreview;
    }

    await user.save();

    console.log('✅ Préférences mises à jour:', user.email);

    res.json({
      success: true,
      message: 'Préférences mises à jour',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('❌ Erreur updatePreferences:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔑 Changer le mot de passe
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Mot de passe changé:', user.email);

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur changePassword:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔍 Rechercher des utilisateurs
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    console.log(`🔍 Recherche utilisateurs: "${query}"`);

    const searchRegex = new RegExp(query, 'i');
    
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { username: searchRegex }
          ]
        },
        { _id: { $ne: currentUserId } } // Exclure l'utilisateur actuel
      ]
    })
      .select('name email username profilePicture isOnline')
      .limit(20)
      .lean();

    console.log(`✅ ${users.length} utilisateurs trouvés`);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('❌ Erreur searchUsers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};