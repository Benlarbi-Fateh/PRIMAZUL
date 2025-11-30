import axios from "axios";

// Utilise une variable d'environnement pour l'URL de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    // Next.js : vérifier que nous sommes côté client
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
       config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// 🔐 AUTH
// ============================================
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const verifyRegistration = (data) =>
  api.post("/auth/verify-registration", data);
export const verifyLogin = (data) => api.post("/auth/verify-login", data);
export const resendCode = (data) => api.post("/auth/resend-code", data);
export const finalizeRegistration = (data) =>
  api.post("/auth/finalize-registration", data);

// 🆕 METTRE À JOUR LAST LOGIN
export const updateLastLogin = () => api.put("/auth/update-last-login");

// 🔍 RECHERCHE D'UTILISATEURS
export const searchUsers = (query) => api.get(`/auth/search?query=${query}`);

// ============================================
// 👤 PROFIL
// ============================================
export const getMyProfile = () => api.get("/profile/me");
export const getUserProfile = (userId) => api.get(`/profile/${userId}`);
export const updateProfile = (data) => api.put("/profile/update", data);
export const uploadProfilePicture = (formData) => {
  return api.put("/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const updatePrivacySettings = (data) =>
  api.put("/profile/privacy", data);
export const updatePreferences = (data) =>
  api.put("/profile/preferences", data);
export const changePassword = (data) =>
  api.put("/profile/change-password", data);

// ============================================
// 💬 CONVERSATIONS
// ============================================
export const getConversations = () => api.get("/conversations");
export const createConversation = (participantId) =>
  api.post("/conversations/get-or-create", { contactId: participantId });
export const getConversation = (id) => api.get(`/conversations/${id}`);

// ============================================
// 👥 GROUPES
// ============================================
export const createGroup = (data) => api.post("/groups/create", data);
export const getGroup = (id) => api.get(`/groups/${id}`);
export const addParticipantsToGroup = (data) =>
  api.post("/groups/add-participants", data);
export const leaveGroup = (groupId) => api.delete(`/groups/${groupId}/leave`);

// ============================================
// 📨 INVITATIONS
// ============================================
export const sendInvitation = (data) => api.post("/invitations/send", data);
export const getReceivedInvitations = () => api.get("/invitations/received");
export const getSentInvitations = () => api.get("/invitations/sent");
export const acceptInvitation = (invitationId) =>
  api.post(`/invitations/${invitationId}/accept`);
export const rejectInvitation = (invitationId) =>
  api.post(`/invitations/${invitationId}/reject`);
export const cancelInvitation = (invitationId) =>
  api.delete(`/invitations/${invitationId}/cancel`);

// ============================================
// 📨 MESSAGES
// ============================================
export const getMessages = (conversationId) =>
  api.get(`/messages/${conversationId}`);
export const sendMessage = (data) => api.post("/messages", data);

// 📊 STATUTS DES MESSAGES
export const markMessagesAsDelivered = (messageIds) =>
  api.post("/messages/mark-delivered", { messageIds });

export const markConversationAsRead = (conversationId) =>
  api.post("/messages/mark-read", { conversationId });

export const getUnreadCount = () => api.get("/messages/unread/count");

<<<<<<< HEAD
// ============================================
// 🔑 RÉINITIALISATION MOT DE PASSE
// ============================================
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const verifyResetCode = (data) => api.post('/auth/verify-reset-code', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export default api;
=======
>>>>>>> d7b2651abdf5ff4b9b346ac8afc789f56540d4fd

// ============================================
// 🆕 API CONTACTS
// ============================================

// Add contact
export const addContact = (data) => api.post("/contacts", data);

// Récupérer tous les contacts
export const getContacts = () => api.get('/contacts');

// Rechercher dans ses contacts
export const searchContacts = (query) => api.get(`/contacts/search?query=${encodeURIComponent(query)}`);

// Récupérer un contact spécifique
export const getContactById = (contactId) => api.get(`/contacts/${contactId}`);

// Mettre à jour un contact
export const updateContact = (contactId, data) => api.put(`/contacts/${contactId}`, data);

// Supprimer un contact
export const deleteContact = (contactId) => api.delete(`/contacts/${contactId}`);

// Toggle favori
export const toggleFavoriteContact = (contactId) => api.patch(`/contacts/${contactId}/favorite`);

// Toggle bloquer
export const toggleBlockContact = (contactId) => api.patch(`/contacts/${contactId}/block`);
<<<<<<< HEAD

=======


// ============================================
// 🔑 RÉINITIALISATION MOT DE PASSE
// ============================================
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const verifyResetCode = (data) =>
  api.post("/auth/verify-reset-code", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
// ============================================
// ⚙️ PARAMÈTRES - CHANGEMENT DE MOT DE PASSE AVEC OTP
// ============================================
export const sendPasswordOtp = (data) =>
  api.post("/auth/settings/send-password-otp", data);
export const verifyChangePassword = (data) =>
  api.put("/auth/settings/verify-change-password", data);

export default api;
>>>>>>> d7b2651abdf5ff4b9b346ac8afc789f56540d4fd
