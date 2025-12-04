'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
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
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

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

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-linear-to-brrom-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Profil non disponible</h2>
          <p className="text-slate-600 mb-8">{error || 'Cet utilisateur n\'existe pas ou a restreint l\'accès à son profil.'}</p>
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Retour aux messages
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profileUser._id;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
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
              {isOwnProfile ? 'Mon Profil' : `Profil de ${profileUser.name}`}
            </h1>
            <p className="text-slate-600 text-sm">
              {isOwnProfile ? 'Gérez vos informations personnelles' : 'Consultez le profil'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isOwnProfile && (
              <>
                <button 
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md"
                  title="Message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-md"
                  title="Appel vidéo"
                >
                  <Video className="w-4 h-4" />
                </button>
              </>
            )}
            {isOwnProfile && (
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md"
              >
                <Settings className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>

        {/* Contenu principal - Optimisé pour desktop sans scroll */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          
          {/* Colonne de gauche - Profil */}
          <div className="lg:w-1/3 xl:w-1/4 flex flex-col">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden flex-1 flex flex-col">
              <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-center shrink-0">
                <div className="relative inline-block">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/50 mx-auto">
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
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">CL</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-2 -right-2">
                    {profileUser.isOnline ? (
                      <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        <span>En ligne</span>
                      </div>
                    ) : (
                      <div className="bg-slate-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Clock className="w-3 h-3" />
                        <span>Hors ligne</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h2 className="text-lg font-bold text-white line-clamp-1">
                    {profileUser.name}
                  </h2>
                  <p className="text-blue-100 text-sm truncate mt-1">
                    {profileUser.email}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 text-xs font-medium">{userStats.rank}</span>
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
                          {profileUser.stats?.messagesCount || 0}
                        </div>
                        <div className="text-xs text-slate-600">Messages</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <div className="text-sm font-bold text-blue-600">
                          {profileUser.stats?.contactsCount || 0}
                        </div>
                        <div className="text-xs text-slate-600">Contacts</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <div className="text-sm font-bold text-blue-600">
                          {profileUser.stats?.groupsCount || 0}
                        </div>
                        <div className="text-xs text-slate-600">Groupes</div>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques avancées */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3 text-slate-600" />
                        <div className="text-xs font-bold text-slate-700">{userStats.totalViews}</div>
                      </div>
                      <div className="text-xs text-slate-500">Vues</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                      <div className="flex items-center justify-center gap-1">
                        <Download className="w-3 h-3 text-slate-600" />
                        <div className="text-xs font-bold text-slate-700">{userStats.downloads}</div>
                      </div>
                      <div className="text-xs text-slate-500">Téléch.</div>
                    </div>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <button 
                    onClick={() => router.push('/chat')}
                    className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-slate-700 text-sm font-medium border border-blue-200"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-600" />
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
            {isOwnProfile && (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-3 mt-4 shrink-0">
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
            )}
          </div>

          {/* Colonne de droite - Contenu principal */}
          <div className="lg:w-2/3 xl:w-3/4 flex-1">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden h-full flex flex-col">
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-200 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Informations personnelles
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                      {isOwnProfile ? 'Vos informations de profil' : `Informations de ${profileUser.name}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
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

              <div className="p-4 flex-1 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-auto">
                  
                  {/* Colonne gauche */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <User className="w-4 h-4 text-blue-600 mr-2" />
                        Nom complet
                      </label>
                      <p className="text-slate-800 font-semibold">
                        {profileUser.name}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <Mail className="w-4 h-4 text-blue-600 mr-2" />
                        Adresse email
                      </label>
                      <p className="text-slate-800 font-semibold">
                        {profileUser.email}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <Phone className="w-4 h-4 text-blue-600 mr-2" />
                        Téléphone
                      </label>
                      <p className="text-slate-800 text-sm">
                        {profileUser.phoneNumber || profileUser.phone || 'Non renseigné'}
                      </p>
                    </div>

                    {/* Section activité récente */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                      <h3 className="flex items-center text-sm font-bold text-slate-800 mb-3">
                        <Activity className="w-4 h-4 text-blue-600 mr-2" />
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

                  {/* Colonne droite */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                        Localisation
                      </label>
                      <p className="text-slate-800 text-sm">
                        {profileUser.location || 'Non renseigné'}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <User className="w-4 h-4 text-blue-600 mr-2" />
                        Bio
                      </label>
                      <p className="text-slate-700 leading-relaxed text-sm">
                        {profileUser.bio || 'Aucune bio renseignée'}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                      <h3 className="flex items-center text-sm font-bold text-slate-800 mb-3">
                        <Clock className="w-4 h-4 text-blue-600 mr-2" />
                        Statut et activité
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Statut:</span>
                          <div className="flex items-center gap-2">
                            {profileUser.isOnline ? (
                              <>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-emerald-600 font-semibold text-xs">En ligne</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                <span className="text-slate-600 font-semibold text-xs">Hors ligne</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Membre depuis:</span>
                          <span className="text-slate-700 font-medium text-xs">
                            {new Date(profileUser.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Série active:</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-orange-500" />
                            <span className="text-orange-600 font-semibold text-xs">{userStats.streak} jours</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badges ou réalisations */}
                    <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">
                      <h3 className="flex items-center text-sm font-bold text-slate-800 mb-3">
                        <Award className="w-4 h-4 text-purple-600 mr-2" />
                        Réalisations
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2 border border-purple-200">
                          <div className="text-sm font-bold text-purple-600">🎯</div>
                          <div className="text-xs text-slate-600">Débutant</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-purple-200">
                          <div className="text-sm font-bold text-purple-600">🚀</div>
                          <div className="text-xs text-slate-600">Actif</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-purple-200">
                          <div className="text-sm font-bold text-purple-600">⭐</div>
                          <div className="text-xs text-slate-600">Social</div>
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