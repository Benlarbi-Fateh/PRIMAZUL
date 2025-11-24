import axios from 'axios';

// Utilise une variable d'environnement pour l'URL de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    // Next.js : vérifier que nous sommes côté client
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// 🔐 AUTH
// ============================================
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// 🔍 RECHERCHE D'UTILISATEURS
export const searchUsers = (query) => api.get(`/auth/search?query=${query}`);

// ============================================
// 💬 CONVERSATIONS
// ============================================
export const getConversations = () => api.get('/conversations');
export const createConversation = (participantId) => api.post('/conversations/get-or-create', { contactId: participantId });
export const getConversation = (id) => api.get(`/conversations/${id}`);

// ============================================
// 👥 GROUPES (🆕 AJOUTÉ)
// ============================================
export const createGroup = (data) => api.post('/groups/create', data);
export const getGroup = (id) => api.get(`/groups/${id}`);
export const addParticipantsToGroup = (data) => api.post('/groups/add-participants', data);
export const leaveGroup = (groupId) => api.delete(`/groups/${groupId}/leave`);

// ============================================
// 📨 INVITATIONS (🆕 AJOUTÉ)
// ============================================
export const sendInvitation = (data) => api.post('/invitations/send', data);
export const getReceivedInvitations = () => api.get('/invitations/received');
export const getSentInvitations = () => api.get('/invitations/sent');
export const acceptInvitation = (invitationId) => api.post(`/invitations/${invitationId}/accept`);
export const rejectInvitation = (invitationId) => api.post(`/invitations/${invitationId}/reject`);
export const cancelInvitation = (invitationId) => api.delete(`/invitations/${invitationId}/cancel`);

// ============================================
// 📨 MESSAGES
// ============================================
export const getMessages = (conversationId) => api.get(`/messages/${conversationId}`);
export const sendMessage = (data) => api.post('/messages', data);

// 📊 STATUTS DES MESSAGES
export const markMessagesAsDelivered = (messageIds) => 
  api.post('/messages/mark-delivered', { messageIds });

export const markConversationAsRead = (conversationId) => 
  api.post('/messages/mark-read', { conversationId });

export const getUnreadCount = () => 
  api.get('/messages/unread/count');


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



export default api;