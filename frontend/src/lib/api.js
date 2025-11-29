import axios from 'axios';

// 🔹 URL de base du backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || '[http://localhost:5001/api](http://localhost:5001/api)';

// 🔹 Instance Axios
const api = axios.create({
baseURL: API_URL,
headers: {
'Content-Type': 'application/json',
},
});

// 🔹 Injection automatique du token
api.interceptors.request.use(
(config) => {
if (typeof window !== 'undefined') {
const token = localStorage.getItem('token');
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
if (typeof window !== 'undefined') {
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/login';
}
}
return Promise.reject(error);
}
);

// =================== AUTH ===================
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const searchUsers = (query) => api.get(`/auth/search?query=${query}`);

// =================== CONVERSATIONS ===================
export const getConversations = () => api.get('/conversations');
export const createConversation = (participantId) =>
api.post('/conversations/get-or-create', { contactId: participantId });
export const getConversation = (id) => api.get(`/conversations/${id}`);

// =================== GROUPES ===================
export const createGroup = (data) => api.post('/groups/create', data);
export const getGroup = (id) => api.get(`/groups/${id}`);
export const addParticipantsToGroup = (data) =>
api.post('/groups/add-participants', data);
export const leaveGroup = (groupId) =>
api.delete(`/groups/${groupId}/leave`);

// =================== INVITATIONS ===================
export const sendInvitation = (data) => api.post('/invitations/send', data);
export const getReceivedInvitations = () => api.get('/invitations/received');
export const getSentInvitations = () => api.get('/invitations/sent');
export const acceptInvitation = (id) => api.post(`/invitations/${id}/accept`);
export const rejectInvitation = (id) => api.post(`/invitations/${id}/reject`);
export const cancelInvitation = (id) => api.delete(`/invitations/${id}/cancel`);

// =================== MESSAGES ===================
export const getMessages = (conversationId) =>
api.get(`/messages/${conversationId}`);
export const sendMessage = (data) => api.post('/messages', data);
export const markMessagesAsDelivered = (messageIds) =>
api.post('/messages/mark-delivered', { messageIds });
export const markConversationAsRead = (conversationId) =>
api.post('/messages/mark-read', { conversationId });
export const getUnreadCount = () => api.get('/messages/unread/count');

// =================== ⚙️ PARAMÈTRES DE MESSAGES ===================
export const deleteConversationForUser = (conversationId) =>
api.delete(`/message-settings/conversations/${conversationId}/delete`);
export const restoreConversationForUser = (conversationId) =>
api.post(`/message-settings/conversations/${conversationId}/restore`);
export const muteConversation = (conversationId) =>
api.post(`/message-settings/conversations/${conversationId}/mute`);
export const unmuteConversation = (conversationId) =>
api.post(`/message-settings/conversations/${conversationId}/unmute`);
export const blockUser = (targetUserId) =>
api.post('/message-settings/block', { targetUserId });
export const unblockUser = (targetUserId) =>
api.post('/message-settings/unblock', { targetUserId });
export const getBlockedUsers = () => api.get('/message-settings/blocked');
export const getConversationMedia = (conversationId) =>
api.get(`/message-settings/conversations/${conversationId}/media`);

export const saveTheme = (theme, wallpaperUrl) =>
  api.post('/message-settings/save-theme', {
    theme,
    wallpaperUrl
  });

export default api;
