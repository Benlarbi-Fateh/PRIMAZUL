import axios from "axios";

// 🔹 URL de base du backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// 🔹 Instance Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // ✅ AJOUT: Timeout de 30 secondes
});

// 🔹 Injection automatique du token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Gestion des erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// =================== UPLOAD DE FICHIERS ===================
export const uploadFile = (formData) => {
  console.log('📤 uploadFile: Début upload');
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // ✅ AJOUT: 60 secondes pour les gros fichiers
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`📊 Upload: ${percentCompleted}%`);
    }
  });
};

// =================== AUTH ===================
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);

export const searchUsers = (query) => api.get(`/auth/search?query=${query}`);

// Fonctions d'authentification supplémentaires
export const verifyRegistration = (data) => api.post("/auth/verify-registration", data);
export const verifyLogin = (data) => api.post("/auth/verify-login", data);
export const resendCode = (data) => api.post("/auth/resend-code", data);
export const finalizeRegistration = (data) => api.post("/auth/finalize-registration", data);

export const updateLastLogin = () => api.put("/auth/update-last-login");

// =================== PROFIL ===================
export const getMyProfile = () => api.get("/profile/me");
export const getUserProfile = (userId) => api.get(`/profile/${userId}`);
export const updateProfile = (data) => api.put("/profile/update", data);
export const uploadProfilePicture = (formData) => {
  return api.put("/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000,
  });
};
export const updatePrivacySettings = (data) => api.put("/profile/privacy", data);
export const updatePreferences = (data) => api.put("/profile/preferences", data);
export const changePassword = (data) => api.put("/profile/change-password", data);

// =================== CONVERSATIONS ===================
export const getConversations = () => api.get("/conversations");
export const createConversation = (participantId) =>
  api.post("/conversations/get-or-create", { contactId: participantId });
export const getConversation = (id) => api.get(`/conversations/${id}`);

// =================== GROUPES ===================
export const createGroup = (data) => api.post("/groups/create", data);
export const getGroup = (id) => api.get(`/groups/${id}`);
export const addParticipantsToGroup = (data) =>
  api.post("/groups/add-participants", data);
export const leaveGroup = (groupId) => api.delete(`/groups/${groupId}/leave`);

// 🆕 NOUVELLES FONCTIONS
export const removeParticipantFromGroup = (data) =>
  api.post("/groups/remove-participant", data);
export const promoteToAdmin = (data) =>
  api.post("/groups/promote-admin", data);
export const removeAdminFromGroup = (data) =>
  api.post("/groups/remove-admin", data);
export const updateGroupName = (data) =>
  api.put("/groups/update-name", data);
export const updateGroupImage = (groupId, formData) =>
  api.put(`/groups/${groupId}/update-image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000,
  });

// =================== CONTACTS ===================
export const addContact = (data) => api.post("/contacts", data);
export const getMyContacts = () => api.get("/contacts");
export const deleteContact = (contactId) => api.delete(`/contacts/${contactId}`);

// =================== INVITATIONS ===================
export const sendInvitation = (data) => api.post("/invitations/send", data);
export const getReceivedInvitations = () => api.get("/invitations/received");
export const getSentInvitations = () => api.get("/invitations/sent");
export const acceptInvitation = (invitationId) =>
  api.post(`/invitations/${invitationId}/accept`);
export const rejectInvitation = (invitationId) =>
  api.post(`/invitations/${invitationId}/reject`);
export const cancelInvitation = (invitationId) =>
  api.delete(`/invitations/${invitationId}/cancel`);

// =================== MESSAGES ===================
export const getMessages = (conversationId) =>
  api.get(`/messages/${conversationId}`);
export const sendMessage = (data) => api.post("/messages", data);
export const markMessagesAsDelivered = (messageIds) =>
  api.post("/messages/mark-delivered", { messageIds });
export const markConversationAsRead = (conversationId) =>
  api.post("/messages/mark-read", { conversationId });
export const getUnreadCount = () => api.get("/messages/unread/count");

// =================== PARAMÈTRES DE MESSAGES ===================
export const deleteConversationForUser = (conversationId) =>
  api.delete(`/message-settings/conversations/${conversationId}/delete`);
export const restoreConversationForUser = (conversationId) =>
  api.post(`/message-settings/conversations/${conversationId}/restore`);
export const muteConversation = (conversationId) =>
  api.post(`/message-settings/conversations/${conversationId}/mute`);
export const unmuteConversation = (conversationId) =>
  api.post(`/message-settings/conversations/${conversationId}/unmute`);
export const blockUser = (targetUserId) =>
  api.post("/message-settings/block", { targetUserId });
export const unblockUser = (targetUserId) =>
  api.post("/message-settings/unblock", { targetUserId });
export const getBlockedUsers = () => api.get("/message-settings/blocked");
export const getConversationMedia = (conversationId) =>
  api.get(`/message-settings/conversations/${conversationId}/media`);

export const saveTheme = (theme, wallpaperUrl) =>
  api.post("/message-settings/save-theme", {
    theme,
    wallpaperUrl
  });

  // =================== ARCHIVAGE ===================
export const archiveConversation = (conversationId) =>
  api.post(`/message-settings/conversations/${conversationId}/archive`);

export const unarchiveConversation = (conversationId) =>
  api.post(`/message-settings/conversations/${conversationId}/unarchive`);

export const getArchivedConversations = () =>
  api.get("/message-settings/archived");

// =================== RÉINITIALISATION MOT DE PASSE ===================
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const verifyResetCode = (data) => api.post("/auth/verify-reset-code", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);

// =================== PARAMÈTRES - CHANGEMENT DE MOT DE PASSE AVEC OTP ===================
export const sendPasswordOtp = (data) =>
  api.post("/auth/settings/send-password-otp", data);
export const verifyChangePassword = (data) =>
  api.put("/auth/settings/verify-change-password", data);


// =================== CHANGEMENT D'EMAIL ===================
export const requestEmailChange = (newEmail) =>
  api.post("/request-email-change", { newEmail });

export const confirmEmailChange = (code) =>
  api.post("/confirm-email-change", { code });

export default api;