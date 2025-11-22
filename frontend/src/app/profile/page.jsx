'use client';

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Camera, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle,
  Users,
  Shield,
  Bell,
  Settings,
  Edit3,
  Check,
  Clock,
  ArrowLeft,
  Save,
  X,
  Star,
  Award,
  TrendingUp,
  Eye,
  Download,
  Calendar,
  Zap,
  Heart
} from 'lucide-react';

// Composant ActivityIcon séparé (nom changé pour éviter le conflit)
const ActivityIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export default function ProfilePage() {
  const { user, updateProfile, setUser } = useContext(AuthContext);
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Données simulées pour remplir l'espace
  const userStats = {
    level: 3,
    experience: 75,
    nextLevel: 100,
    rank: 'Explorateur',
    achievements: 5,
    streak: 12,
    totalViews: 1247,
    downloads: 89,
    rating: 4.8,
    clipsCreated: 23,
    likesReceived: 156
  };

  const recentActivity = [
    { id: 1, action: 'a partagé un clip', time: '2 min', icon: Zap },
    { id: 2, action: 'a rejoint un groupe', time: '1 h', icon: Users },
    { id: 3, action: 'a aimé un message', time: '3 h', icon: Heart },
    { id: 4, action: 'a créé un clip', time: '5 h', icon: Zap }
  ];

  const achievements = [
    { id: 1, name: 'Premier clip', icon: '🎬', progress: 100 },
    { id: 2, name: 'Socialite', icon: '🤝', progress: 80 },
    { id: 3, name: 'Créateur', icon: '⭐', progress: 60 },
    { id: 4, name: 'Viral', icon: '🚀', progress: 40 }
  ];

  // Fix hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      });
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload image:', error);
      setError('Erreur lors de l\'upload de l\'image');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const dataToUpdate = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        profilePicture: profilePicture
      };

      const result = await updateProfile(dataToUpdate);
      
      if (result.success) {
        setSuccess('✅ Profil mis à jour avec succès !');
        setIsEditing(false);
        
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      setError(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      });
      setProfilePicture(user.profilePicture || '');
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600/20 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Container principal avec padding */}
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-lg border border-blue-100">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800">
                Mon Profil
              </h1>
              <p className="text-slate-600 text-sm">
                Gérez vos informations personnelles
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold transition-all shadow-md"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Annuler</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-xl font-semibold transition-all shadow-md"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>
                      {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages d'alerte */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 text-sm">
              <span className="text-lg">❌</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3 text-sm">
              <span className="text-lg">✅</span>
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Contenu principal - Optimisé pour desktop et mobile */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Colonne de gauche - Profil */}
            <div className="lg:w-1/3 xl:w-1/4 flex flex-col">
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden flex-1 flex flex-col">
                <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 text-center shrink-0">
                  <div className="relative inline-block">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-2xl ring-4 ring-white/50 mx-auto">
                      {profilePicture ? (
                        <Image
                          src={profilePicture}
                          alt={user.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {isEditing && (
                      <label className="absolute -bottom-1 -right-1 bg-white hover:bg-blue-50 text-blue-600 p-1.5 rounded-lg shadow-lg cursor-pointer transition-all border border-blue-200">
                        <Camera className="w-3 h-3" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          disabled={isLoading}
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-3">
                    <h2 className="text-lg font-bold text-white line-clamp-1">
                      {formData.name}
                    </h2>
                    <p className="text-blue-100 text-sm truncate mt-1">
                      {formData.email}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 text-xs font-medium">{userStats.rank}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-200 text-xs font-medium">En ligne</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Niveau et progression */}
                    <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700">Niveau {userStats.level}</span>
                        <span className="text-xs text-slate-600">{userStats.experience}/{userStats.nextLevel} XP</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-linear-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(userStats.experience / userStats.nextLevel) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Statistiques principales */}
                    <div>
                      <h3 className="flex items-center text-xs font-bold text-slate-800 mb-3">
                        <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                        Statistiques
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <div className="text-sm font-bold text-blue-600">
                            {user.stats?.messagesCount || 0}
                          </div>
                          <div className="text-xs text-slate-600">Messages</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <div className="text-sm font-bold text-blue-600">
                            {user.stats?.contactsCount || 0}
                          </div>
                          <div className="text-xs text-slate-600">Contacts</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <div className="text-sm font-bold text-blue-600">
                            {user.stats?.groupsCount || 0}
                          </div>
                          <div className="text-xs text-slate-600">Groupes</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    <button 
                      onClick={() => router.push('/chat')}
                      className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-slate-700 text-sm font-medium border border-blue-200"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <span>Conversations</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-slate-700 text-sm font-medium border border-blue-200">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Groupes</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation par onglets */}
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-3 mt-4">
                <div className="space-y-1">
                  {[
                    { id: 'profile', icon: User, label: 'Profil' },
                    { id: 'privacy', icon: Shield, label: 'Confidentialité' },
                    { id: 'notifications', icon: Bell, label: 'Notifications' }
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-2 p-2 font-semibold transition-all rounded-lg text-sm ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-blue-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Colonne de droite - Contenu principal */}
            <div className="lg:w-2/3 xl:w-3/4 flex-1">
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden min-h-[600px]">
                {/* En-tête du contenu */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        {activeTab === 'profile' && 'Informations personnelles'}
                        {activeTab === 'privacy' && 'Paramètres de confidentialité'}
                        {activeTab === 'notifications' && 'Préférences de notifications'}
                      </h2>
                      <p className="text-slate-600 text-sm mt-1">
                        {activeTab === 'profile' && 'Gérez vos informations de profil'}
                        {activeTab === 'privacy' && 'Contrôlez votre confidentialité'}
                        {activeTab === 'notifications' && 'Gérez vos préférences de notifications'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-yellow-700">{userStats.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-700">{userStats.achievements} succès</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenu scrollable si nécessaire */}
                <div className="p-4">
                  {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Colonne gauche - Informations de base */}
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <label className="flex items-center text-sm font-medium text-slate-700 mb-3">
                            <User className="w-4 h-4 text-blue-600 mr-2" />
                            Nom complet
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                              placeholder="Votre nom complet"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold text-lg">
                              {formData.name}
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <label className="flex items-center text-sm font-medium text-slate-700 mb-3">
                            <Mail className="w-4 h-4 text-blue-600 mr-2" />
                            Adresse email
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                              placeholder="votre@email.com"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold text-lg">
                              {formData.email}
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <label className="flex items-center text-sm font-medium text-slate-700 mb-3">
                            <Phone className="w-4 h-4 text-blue-600 mr-2" />
                            Téléphone
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                              placeholder="+213 6 12 34 56 78"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold">
                              {formData.phone || 'Non renseigné'}
                            </p>
                          )}
                        </div>

                        {/* Section activité récente */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <h3 className="flex items-center text-sm font-bold text-slate-800 mb-3">
                            <ActivityIcon className="w-4 h-4 text-blue-600 mr-2" />
                            Activité récente
                          </h3>
                          <div className="space-y-2">
                            {recentActivity.map((activity) => {
                              const IconComponent = activity.icon;
                              return (
                                <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-3 h-3 text-slate-500" />
                                    <span className="text-xs text-slate-700">{activity.action}</span>
                                  </div>
                                  <span className="text-xs text-slate-500">{activity.time}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Colonne droite - Informations supplémentaires */}
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <label className="flex items-center text-sm font-medium text-slate-700 mb-3">
                            <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                            Localisation
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                              placeholder="Votre ville"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold">
                              {formData.location || 'Non renseigné'}
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <label className="flex items-center text-sm font-medium text-slate-700 mb-3">
                            <User className="w-4 h-4 text-blue-600 mr-2" />
                            Bio
                          </label>
                          {isEditing ? (
                            <textarea
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
                              placeholder="Décrivez-vous en quelques mots..."
                            />
                          ) : (
                            <p className="text-slate-700 leading-relaxed text-sm">
                              {formData.bio || 'Aucune bio renseignée'}
                            </p>
                          )}
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h3 className="flex items-center text-sm font-bold text-slate-800 mb-3">
                            <Clock className="w-4 h-4 text-blue-600 mr-2" />
                            Statut et activité
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Statut:</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-emerald-600 font-semibold">En ligne</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Membre depuis:</span>
                              <span className="text-slate-700 font-medium">
                                {new Date(user.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Série active:</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-orange-500" />
                                <span className="text-orange-600 font-semibold">{userStats.streak} jours</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progression des succès */}
                        <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                          <h3 className="flex items-center text-sm font-bold text-slate-800 mb-3">
                            <Award className="w-4 h-4 text-purple-600 mr-2" />
                            Progression des succès
                          </h3>
                          <div className="space-y-2">
                            {achievements.map((achievement) => (
                              <div key={achievement.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{achievement.icon}</span>
                                  <span className="text-xs text-slate-700">{achievement.name}</span>
                                </div>
                                <div className="w-16 bg-slate-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${achievement.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'privacy' && (
                    <div className="text-center w-full max-w-2xl mx-auto">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Paramètres de confidentialité</h3>
                      <p className="text-slate-600 mb-6">Gérez qui peut voir vos informations et vous contacter</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left">
                          <h4 className="font-semibold text-slate-800 mb-2">Visibilité du profil</h4>
                          <p className="text-slate-600 text-sm mb-3">Contrôlez qui peut voir votre profil</p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="radio" name="visibility" defaultChecked className="text-blue-600" />
                              <span>Tout le monde</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="radio" name="visibility" className="text-blue-600" />
                              <span>Contacts uniquement</span>
                            </label>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left">
                          <h4 className="font-semibold text-slate-800 mb-2">Paramètres de contact</h4>
                          <p className="text-slate-600 text-sm mb-3">Gérez qui peut vous contacter</p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="text-blue-600 rounded" />
                              <span>Accepter les messages</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="text-blue-600 rounded" />
                              <span>Accepter les appels</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="text-center w-full max-w-2xl mx-auto">
                      <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-cyan-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Préférences de notifications</h3>
                      <p className="text-slate-600 mb-6">Contrôlez comment et quand vous recevez les notifications</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left">
                          <h4 className="font-semibold text-slate-800 mb-2">Messages</h4>
                          <p className="text-slate-600 text-sm mb-3">Notifications de nouveaux messages</p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="text-blue-600 rounded" />
                              <span>Nouveaux messages</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="text-blue-600 rounded" />
                              <span>Messages de groupe</span>
                            </label>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left">
                          <h4 className="font-semibold text-slate-800 mb-2">Activités</h4>
                          <p className="text-slate-600 text-sm mb-3">Notifications d&apos;activités sociales</p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="text-blue-600 rounded" />
                              <span>Nouveaux likes</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="text-blue-600 rounded" />
                              <span>Nouveaux followers</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}