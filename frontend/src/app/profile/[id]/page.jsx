'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { getUserProfile } from '@/lib/api';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Mail, 
  User, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Video,
  Users,
  Settings,
  MessageSquare,
  Shield,
  Bell,
  Star,
  Award,
  Calendar,
  Activity,
  Zap,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useContext(AuthContext);
  const { isDark } = useTheme();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Styles basés sur le thème (mêmes couleurs que sidebar)
  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-b from-blue-50 to-indigo-100";

  const cardBg = isDark
    ? "bg-gradient-to-b from-blue-900/90 via-blue-900/80 to-blue-900/90 border-blue-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    : "bg-white border-blue-100 shadow-lg";

  const headerBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950 border-blue-800"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-blue-200";

  const textPrimary = isDark ? "text-blue-50" : "text-slate-800";
  const textSecondary = isDark ? "text-blue-200" : "text-slate-600";
  const textMuted = isDark ? "text-blue-300" : "text-slate-500";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20";

  const statCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-blue-50 border-blue-200";

  const detailCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-slate-50 border-slate-200";

  const activityCardBg = isDark
    ? "bg-blue-800/70 border-blue-700"
    : "bg-white border-slate-200";

  const profileHeaderBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-r from-blue-600 to-indigo-600";

  const profileRing = isDark
    ? "ring-blue-700/50"
    : "ring-white/50";

  const quickActionBg = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-200 border-blue-700"
    : "bg-blue-50 hover:bg-blue-100 text-slate-700 border-blue-200";

  const tabBg = isDark
    ? "hover:bg-blue-800 hover:text-blue-100 text-blue-300"
    : "hover:bg-blue-50 hover:text-slate-800 text-slate-600";

  const contentHeaderBg = isDark
    ? "bg-blue-900/50 border-blue-800"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";

  const onlineBadgeBg = isDark
    ? "bg-cyan-700 text-cyan-200"
    : "bg-cyan-500 text-white";

  const offlineBadgeBg = isDark
    ? "bg-blue-800 text-blue-300"
    : "bg-blue-600 text-white";

  const levelBarBg = isDark
    ? "bg-blue-700"
    : "bg-blue-200";

  const levelBarFill = isDark
    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
    : "bg-gradient-to-r from-blue-500 to-indigo-500";

  const ratingBadgeBg = isDark
    ? "bg-yellow-900/30 border-yellow-800"
    : "bg-yellow-50 border-yellow-200";

  const achievementsBadgeBg = isDark
    ? "bg-blue-900/30 border-blue-800"
    : "bg-blue-50 border-blue-200";

  const achievementsCardBg = isDark
    ? "bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-800"
    : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await getUserProfile(id);
        setProfileUser(response.data.user);
      } catch (err) {
        console.error('Erreur getUserProfile:', err);
        setError(err.response?.data?.error || 'Utilisateur non trouvé');
      } finally {
        setLoading(false);
      }
    };

    if (id && isMounted) {
      fetchUserProfile();
    }
  }, [id, isMounted]);

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
    rating: 4.8
  };

  const recentActivity = [
    { id: 1, action: 'a partagé un clip', time: '2 min', icon: Activity },
    { id: 2, action: 'a rejoint un groupe', time: '1 h', icon: Users },
    { id: 3, action: 'a aimé un message', time: '3 h', icon: Star },
    { id: 4, action: 'a créé un clip', time: '5 h', icon: Zap }
  ];

  if (!isMounted || loading) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="relative">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 mx-auto ${
              isDark ? 'border-blue-800/50 border-t-cyan-400' : 'border-blue-600/20 border-t-blue-600'
            }`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className={`w-6 h-6 animate-pulse ${
                isDark ? 'text-cyan-400' : 'text-blue-600'
              }`} />
            </div>
          </div>
          <p className={`mt-6 font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
        <div className={`text-center max-w-md w-full p-6 rounded-2xl ${cardBg} border`}>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
            isDark ? 'bg-linear-to-br from-blue-800 to-blue-900' : 'bg-linear-to-br from-blue-100 to-blue-200'
          }`}>
            <User className={`w-10 h-10 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${textPrimary}`}>
            Profil non disponible
          </h2>
          <p className={`mb-8 ${textSecondary}`}>
            {error || 'Cet utilisateur n\'existe pas ou a restreint l\'accès à son profil.'}
          </p>
          <button
            onClick={() => router.back()}
            className={`px-8 py-3 rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${buttonStyle}`}
          >
            Retour aux messages
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profileUser._id;

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* Container principal avec padding */}
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto h-full">
          {/* Header */}
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 rounded-2xl shadow-lg border ${headerBg}`}>
            <button
              onClick={() => router.back()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${buttonStyle}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            
            <div className="text-center">
              <h1 className={`text-xl font-bold ${textPrimary}`}>
                {isOwnProfile ? 'Mon Profil' : `Profil de ${profileUser.name}`}
              </h1>
              <p className={`text-sm ${textSecondary}`}>
                {isOwnProfile ? 'Gérez vos informations personnelles' : 'Consultez le profil'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isOwnProfile && (
                <>
                  <button 
                    className={`p-2 rounded-xl transition-all shadow-md ${
                      isDark 
                        ? 'bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white' 
                        : 'bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
                    }`}
                    title="Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button 
                    className={`p-2 rounded-xl transition-all shadow-md ${
                      isDark 
                        ? 'bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white' 
                        : 'bg-linear-to-r from-green-600 to-cyan-500 hover:from-green-700 hover:to-cyan-600 text-white'
                    }`}
                    title="Appel vidéo"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </>
              )}
              {isOwnProfile && (
                <button 
                  onClick={() => router.push('/profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${buttonStyle}`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          </div>

          {/* Contenu principal - Optimisé pour desktop et mobile */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Colonne de gauche - Profil */}
            <div className="lg:w-1/3 xl:w-1/4 flex flex-col">
              <div className={`rounded-2xl shadow-lg border overflow-hidden flex-1 flex flex-col ${cardBg}`}>
                <div className={`p-6 text-center shrink-0 ${profileHeaderBg}`}>
                  <div className="relative inline-block">
                    <div className={`relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 mx-auto ${profileRing}`}>
                      {profileUser.profilePicture ? (
                        <Image
                          src={profileUser.profilePicture}
                          alt={profileUser.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          isDark ? 'bg-blue-800' : 'bg-blue-500'
                        }`}>
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-blue-700/50' : 'bg-white/20'
                          }`}>
                            <span className={`font-bold text-lg ${
                              isDark ? 'text-blue-100' : 'text-white'
                            }`}>
                              {profileUser.name?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute -bottom-2 -right-2">
                      {profileUser.isOnline ? (
                        <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg ${onlineBadgeBg}`}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          <span>En ligne</span>
                        </div>
                      ) : (
                        <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg ${offlineBadgeBg}`}>
                          <Clock className="w-3 h-3" />
                          <span>Hors ligne</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h2 className={`text-lg font-bold line-clamp-1 ${
                      isDark ? 'text-blue-50' : 'text-white'
                    }`}>
                      {profileUser.name}
                    </h2>
                    <p className={`text-sm truncate mt-1 ${
                      isDark ? 'text-blue-200' : 'text-blue-100'
                    }`}>
                      {profileUser.email}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Award className={`w-4 h-4 ${
                        isDark ? 'text-yellow-400' : 'text-yellow-300'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isDark ? 'text-yellow-300' : 'text-yellow-200'
                      }`}>
                        {userStats.rank}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Niveau et progression */}
                    <div className={`rounded-xl p-3 border ${statCardBg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${
                          isDark ? 'text-blue-200' : 'text-slate-700'
                        }`}>
                          Niveau {userStats.level}
                        </span>
                        <span className={`text-xs ${
                          isDark ? 'text-blue-300' : 'text-slate-600'
                        }`}>
                          {userStats.experience}/{userStats.nextLevel} XP
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-2 ${levelBarBg}`}>
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${levelBarFill}`}
                          style={{ width: `${(userStats.experience / userStats.nextLevel) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Statistiques principales */}
                    <div>
                      <h3 className={`flex items-center text-xs font-bold mb-3 ${
                        isDark ? 'text-blue-200' : 'text-slate-800'
                      }`}>
                        <TrendingUp className={`w-4 h-4 mr-2 ${
                          isDark ? 'text-cyan-400' : 'text-blue-600'
                        }`} />
                        Statistiques
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className={`rounded-lg p-2 border ${statCardBg}`}>
                          <div className={`text-sm font-bold ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`}>
                            {profileUser.stats?.messagesCount || 0}
                          </div>
                          <div className={`text-xs ${
                            isDark ? 'text-blue-300' : 'text-slate-600'
                          }`}>
                            Messages
                          </div>
                        </div>
                        <div className={`rounded-lg p-2 border ${statCardBg}`}>
                          <div className={`text-sm font-bold ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`}>
                            {profileUser.stats?.contactsCount || 0}
                          </div>
                          <div className={`text-xs ${
                            isDark ? 'text-blue-300' : 'text-slate-600'
                          }`}>
                            Contacts
                          </div>
                        </div>
                        <div className={`rounded-lg p-2 border ${statCardBg}`}>
                          <div className={`text-sm font-bold ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`}>
                            {profileUser.stats?.groupsCount || 0}
                          </div>
                          <div className={`text-xs ${
                            isDark ? 'text-blue-300' : 'text-slate-600'
                          }`}>
                            Groupes
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistiques avancées */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className={`rounded-lg p-2 border ${detailCardBg}`}>
                        <div className="flex items-center justify-center gap-1">
                          <Eye className={`w-3 h-3 ${
                            isDark ? 'text-blue-400' : 'text-slate-600'
                          }`} />
                          <div className={`text-xs font-bold ${
                            isDark ? 'text-blue-200' : 'text-slate-700'
                          }`}>
                            {userStats.totalViews}
                          </div>
                        </div>
                        <div className={`text-xs ${
                          isDark ? 'text-blue-400' : 'text-slate-500'
                        }`}>
                          Vues
                        </div>
                      </div>
                      <div className={`rounded-lg p-2 border ${detailCardBg}`}>
                        <div className="flex items-center justify-center gap-1">
                          <Download className={`w-3 h-3 ${
                            isDark ? 'text-blue-400' : 'text-slate-600'
                          }`} />
                          <div className={`text-xs font-bold ${
                            isDark ? 'text-blue-200' : 'text-slate-700'
                          }`}>
                            {userStats.downloads}
                          </div>
                        </div>
                        <div className={`text-xs ${
                          isDark ? 'text-blue-400' : 'text-slate-500'
                        }`}>
                          Téléch.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="space-y-2 pt-3 border-t border-blue-700/30">
                    <button 
                      onClick={() => router.push('/chat')}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-sm font-medium border ${quickActionBg}`}
                    >
                      <MessageSquare className={`w-4 h-4 ${
                        isDark ? 'text-cyan-400' : 'text-blue-600'
                      }`} />
                      <span>Conversations</span>
                    </button>
                    <button className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-sm font-medium border ${quickActionBg}`}>
                      <Users className={`w-4 h-4 ${
                        isDark ? 'text-cyan-400' : 'text-blue-600'
                      }`} />
                      <span>Groupes</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation par onglets */}
              {isOwnProfile && (
                <div className={`rounded-2xl shadow-lg border p-3 mt-4 ${cardBg}`}>
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
                              ? `${buttonStyle} shadow-md`
                              : tabBg
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne de droite - Contenu principal */}
            <div className="lg:w-2/3 xl:w-3/4 flex-1">
              <div className={`rounded-2xl shadow-lg border overflow-hidden min-h-[600px] ${cardBg}`}>
                <div className={`p-4 border-b ${contentHeaderBg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className={`text-lg font-bold ${textPrimary}`}>
                        Informations personnelles
                      </h2>
                      <p className={`text-sm mt-1 ${textSecondary}`}>
                        {isOwnProfile ? 'Vos informations de profil' : `Informations de ${profileUser.name}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${ratingBadgeBg}`}>
                        <Star className={`w-4 h-4 ${
                          isDark ? 'text-yellow-400' : 'text-yellow-500'
                        }`} />
                        <span className={`text-sm font-semibold ${
                          isDark ? 'text-yellow-300' : 'text-yellow-700'
                        }`}>
                          {userStats.rating}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${achievementsBadgeBg}`}>
                        <Award className={`w-4 h-4 ${
                          isDark ? 'text-blue-400' : 'text-blue-500'
                        }`} />
                        <span className={`text-sm font-semibold ${
                          isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                          {userStats.achievements} succès
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Colonne gauche */}
                    <div className="space-y-4">
                      <div className={`rounded-xl p-3 border ${detailCardBg}`}>
                        <label className={`flex items-center text-sm font-medium mb-2 ${
                          isDark ? 'text-blue-200' : 'text-slate-700'
                        }`}>
                          <User className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`} />
                          Nom complet
                        </label>
                        <p className={`font-semibold ${
                          isDark ? 'text-blue-100' : 'text-slate-800'
                        }`}>
                          {profileUser.name}
                        </p>
                      </div>

                      <div className={`rounded-xl p-3 border ${detailCardBg}`}>
                        <label className={`flex items-center text-sm font-medium mb-2 ${
                          isDark ? 'text-blue-200' : 'text-slate-700'
                        }`}>
                          <Mail className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`} />
                          Adresse email
                        </label>
                        <p className={`font-semibold ${
                          isDark ? 'text-blue-100' : 'text-slate-800'
                        }`}>
                          {profileUser.email}
                        </p>
                      </div>

                      <div className={`rounded-xl p-3 border ${detailCardBg}`}>
                        <label className={`flex items-center text-sm font-medium mb-2 ${
                          isDark ? 'text-blue-200' : 'text-slate-700'
                        }`}>
                          <Phone className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`} />
                          Téléphone
                        </label>
                        <p className={`text-sm ${
                          isDark ? 'text-blue-300' : 'text-slate-800'
                        }`}>
                          {profileUser.phoneNumber || profileUser.phone || 'Non renseigné'}
                        </p>
                      </div>

                      {/* Section activité récente */}
                      <div className={`rounded-xl p-3 border ${activityCardBg}`}>
                        <h3 className={`flex items-center text-sm font-bold mb-3 ${
                          isDark ? 'text-blue-200' : 'text-slate-800'
                        }`}>
                          <Activity className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`} />
                          Activité récente
                        </h3>
                        <div className="space-y-2">
                          {recentActivity.map((activity) => {
                            const IconComponent = activity.icon;
                            return (
                              <div 
                                key={activity.id} 
                                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-blue-800/50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <IconComponent className={`w-3 h-3 ${
                                    isDark ? 'text-blue-400' : 'text-slate-500'
                                  }`} />
                                  <span className={`text-xs ${
                                    isDark ? 'text-blue-300' : 'text-slate-700'
                                  }`}>
                                    {activity.action}
                                  </span>
                                </div>
                                <span className={`text-xs ${
                                  isDark ? 'text-blue-400' : 'text-slate-500'
                                }`}>
                                  {activity.time}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="space-y-4">
                      <div className={`rounded-xl p-3 border ${detailCardBg}`}>
                        <label className={`flex items-center text-sm font-medium mb-2 ${
                          isDark ? 'text-blue-200' : 'text-slate-700'
                        }`}>
                          <MapPin className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`} />
                          Localisation
                        </label>
                        <p className={`text-sm ${
                          isDark ? 'text-blue-300' : 'text-slate-800'
                        }`}>
                          {profileUser.location || 'Non renseigné'}
                        </p>
                      </div>

                      <div className={`rounded-xl p-3 border ${detailCardBg}`}>
                        <label className={`flex items-center text-sm font-medium mb-2 ${
                          isDark ? 'text-blue-200' : 'text-slate-700'
                        }`}>
                          <User className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`} />
                          Bio
                        </label>
                        <p className={`leading-relaxed text-sm ${
                          isDark ? 'text-blue-300' : 'text-slate-700'
                        }`}>
                          {profileUser.bio || 'Aucune bio renseignée'}
                        </p>
                      </div>

                      <div className={`rounded-xl p-3 border ${statCardBg}`}>
                        <h3 className={`flex items-center text-sm font-bold mb-3 ${
                          isDark ? 'text-blue-200' : 'text-slate-800'
                        }`}>
                          <Clock className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-cyan-400' : 'text-blue-600'
                          }`} />
                          Statut et activité
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className={isDark ? 'text-blue-300' : 'text-slate-600'}>
                              Statut:
                            </span>
                            <div className="flex items-center gap-2">
                              {profileUser.isOnline ? (
                                <>
                                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                  <span className={`font-semibold text-xs ${
                                    isDark ? 'text-cyan-400' : 'text-cyan-600'
                                  }`}>
                                    En ligne
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  <span className={`font-semibold text-xs ${
                                    isDark ? 'text-blue-400' : 'text-blue-600'
                                  }`}>
                                    Hors ligne
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={isDark ? 'text-blue-300' : 'text-slate-600'}>
                              Membre depuis:
                            </span>
                            <span className={`font-medium text-xs ${
                              isDark ? 'text-blue-200' : 'text-slate-700'
                            }`}>
                              {new Date(profileUser.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={isDark ? 'text-blue-300' : 'text-slate-600'}>
                              Série active:
                            </span>
                            <div className="flex items-center gap-1">
                              <Calendar className={`w-3 h-3 ${
                                isDark ? 'text-orange-400' : 'text-orange-500'
                              }`} />
                              <span className={`font-semibold text-xs ${
                                isDark ? 'text-orange-400' : 'text-orange-600'
                              }`}>
                                {userStats.streak} jours
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Badges ou réalisations */}
                      <div className={`rounded-xl p-3 border ${achievementsCardBg}`}>
                        <h3 className={`flex items-center text-sm font-bold mb-3 ${
                          isDark ? 'text-blue-200' : 'text-slate-800'
                        }`}>
                          <Award className={`w-4 h-4 mr-2 ${
                            isDark ? 'text-purple-400' : 'text-purple-600'
                          }`} />
                          Réalisations
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className={`rounded-lg p-2 border ${
                            isDark ? 'bg-blue-800/70 border-purple-800' : 'bg-white border-purple-200'
                          }`}>
                            <div className={`text-sm font-bold ${
                              isDark ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              🎯
                            </div>
                            <div className={`text-xs ${
                              isDark ? 'text-blue-300' : 'text-slate-600'
                            }`}>
                              Débutant
                            </div>
                          </div>
                          <div className={`rounded-lg p-2 border ${
                            isDark ? 'bg-blue-800/70 border-purple-800' : 'bg-white border-purple-200'
                          }`}>
                            <div className={`text-sm font-bold ${
                              isDark ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              🚀
                            </div>
                            <div className={`text-xs ${
                              isDark ? 'text-blue-300' : 'text-slate-600'
                            }`}>
                              Actif
                            </div>
                          </div>
                          <div className={`rounded-lg p-2 border ${
                            isDark ? 'bg-blue-800/70 border-purple-800' : 'bg-white border-purple-200'
                          }`}>
                            <div className={`text-sm font-bold ${
                              isDark ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              ⭐
                            </div>
                            <div className={`text-xs ${
                              isDark ? 'text-blue-300' : 'text-slate-600'
                            }`}>
                              Social
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}