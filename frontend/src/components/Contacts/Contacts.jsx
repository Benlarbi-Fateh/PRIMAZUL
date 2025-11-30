 "use client";

import { useEffect, useState, useRef } from "react";
//import { Search, ArrowLeft, Mail, Star, CalendarDays, UserPlus } from "lucide-react";
import { 
  Search, ArrowLeft, Mail, Star, CalendarDays, UserPlus, 
  Phone, MessageCircle, Video 
} from "lucide-react";

import api from "../../lib/api";
import { searchUsers, sendInvitation, getSentInvitations } from "@/lib/api";
import { getSocket, onInvitationCancelled } from "@/services/socket";

/* ---------------- AVATAR ---------------- */
function Avatar({ user, size = "md", showStatus = true }) {
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const sizes = { sm: "w-12 h-12 text-sm", md: "w-14 h-14 text-base", lg: "w-28 h-28 text-3xl" };
  const statusSizes = { sm: "w-3 h-3", md: "w-3 h-3", lg: "w-4 h-4" };

  return (
    <div className="relative">
      {user.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.name}
          className={`${sizes[size]} rounded-full object-cover shadow`}
        />
      ) : (
        <div
          className={`${sizes[size]} bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow`}
        >
          {getInitials(user.name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-1 right-1 ${statusSizes[size]} rounded-full border-2 border-white ${
            user.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
    </div>
  );
}

/* ---------------- FAVORITES BAR ---------------- */
function FavoritesBar({ contacts, favoriteIds, setSelected, searchTerm }) {
  const favorites = contacts.filter(
    (c) => favoriteIds.has(c.user?._id) && c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (favorites.length === 0) return null;

  return (
    <div className="mb-4 max-w-lg mx-auto">
      <h2 className="font-semibold text-lg mb-2 text-gray-700">Favoris</h2>
      <div className="flex gap-3 overflow-x-auto p-3 bg-gray-50 shadow rounded-xl">
        {favorites.map((contact) => (
          <div
            key={contact._id}
            className="flex flex-col items-center cursor-pointer hover:bg-blue-50 transition-colors rounded-lg p-1"
            onClick={() => setSelected(contact)}
          >
            <Avatar user={contact.user} size="sm" showStatus={true} />
            <p className="text-xs text-gray-700 truncate max-w-[50px] text-center">{contact.user.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/*  CONTACT DETAILS  */


function ContactDetails({ contact, toggleFavorite, favoriteIds, onBack }) {
  const user = contact.user;
  const isFav = favoriteIds.has(user._id);

  return (
    <div className="bg-white/90 backdrop-blur-xl shadow-2xl p-6 rounded-3xl max-w-lg mx-auto animate-fadeIn relative">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 mb-5 hover:text-blue-800 transition">
        <ArrowLeft size={20} /> Retour
      </button>

      {/* Favorite button */}
      <button onClick={() => toggleFavorite(user._id)} className="absolute top-6 right-6">
        <Star
          size={28}
          className={`transition-colors ${isFav ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} hover:text-yellow-400`}
        />
      </button>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center">
        <Avatar user={user} size="lg" showStatus={true} />
        <h1 className="text-2xl font-semibold mt-4 text-gray-800">{user.name}</h1>
        <p className="text-gray-500">{user.status || "Aucun statut"}</p>
      </div>

      {/* Action icons horizontal */}
      <div className="flex justify-center gap-6 mt-6">
        <button className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition">
          <Phone size={24} />
          <span className="text-xs mt-1">Appeler</span>
        </button>
        <button className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition">
          <MessageCircle size={24} />
          <span className="text-xs mt-1">Message</span>
        </button>
        <button className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition">
          <Video size={24} />
          <span className="text-xs mt-1">Vidéo</span>
        </button>
      </div>

      {/* Email & Date */}
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-4 shadow">
          <Mail className="text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900 font-medium">{user.email}</p>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-xl flex items-center gap-4 shadow">
          <CalendarDays className="text-purple-600" />
          <div>
            <p className="text-sm text-gray-500">Ajouté le</p>
            <p className="text-gray-900 font-medium">{new Date(contact.addedAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ---------------- ADD CONTACT TAB ---------------- */
function AddContactTab({ contactIds }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const [sentInvitations, setSentInvitations] = useState(new Set());
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    clearTimeout(searchTimeoutRef.current);

    const performSearch = async () => {
      try {
        setSearching(true);
        const response = await searchUsers(searchQuery);
        const filteredUsers = (response.data.users || []).filter(
          (user) => !contactIds.has(user._id)
        );
        setSearchResults(filteredUsers);
      } catch (error) {
        console.error(error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    searchTimeoutRef.current = setTimeout(performSearch, 500);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, contactIds]);

  useEffect(() => {
    const fetchSentInvitations = async () => {
      try {
        const response = await getSentInvitations();
        const sentUserIds = (response.data.invitations || []).map((inv) => inv.receiver._id);
        setSentInvitations(new Set(sentUserIds));
      } catch (error) {
        console.error(error);
      }
    };
    fetchSentInvitations();
  }, []);

  useEffect(() => {
    const handleCancelled = (data) => {
      setSentInvitations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.receiverId);
        return newSet;
      });
    };
    onInvitationCancelled(handleCancelled);
    return () => {
      const socket = getSocket();
      if (socket) socket.off("invitation-cancelled", handleCancelled);
    };
  }, []);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (!value.trim()) setSearchResults([]);
  };

  const handleSendInvitation = async (userId) => {
    setSendingTo(userId);
    try {
      await sendInvitation({ receiverId: userId });
      setSentInvitations((prev) => new Set([...prev, userId]));
      alert("Invitation envoyée !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div>
      <div className="sticky top-0 bg-gradient-to-b from-white to-transparent z-40 pb-2">
        <div className="p-4 max-w-lg mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-all" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-blue-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all text-slate-700 placeholder-blue-400 font-medium shadow-sm hover:shadow-md"
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {searchResults.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md shadow-xl p-5 rounded-2xl animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Résultats ({searchResults.length})</h3>
            <ul className="space-y-3">
              {searchResults.map((user) => {
                const isInvitationSent = sentInvitations.has(user._id);
                return (
                  <li
                    key={user._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-blue-50"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <Avatar user={user} size="sm" showStatus={false} />
                      <div className="ml-4 min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendInvitation(user._id)}
                      disabled={sendingTo === user._id || isInvitationSent}
                      className={`ml-3 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex-shrink-0 ${
                        isInvitationSent
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      }`}
                    >
                      {sendingTo === user._id ? "Envoi..." : isInvitationSent ? "Envoyé" : "Inviter"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {searchResults.length === 0 && searchQuery && !searching && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
            <p className="text-gray-400 text-sm mt-2">Essayez un autre terme de recherche</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- MAIN CONTACTS PAGE ---------------- */
export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("contacts");
  const [contactIds, setContactIds] = useState(new Set());
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get("/contacts");
        const fetchedContacts = res.data.contacts || [];
        setContacts(fetchedContacts);
        setContactIds(new Set(fetchedContacts.map((c) => c.user?._id).filter(Boolean)));
        setFavoriteIds(new Set(fetchedContacts.filter((c) => c.isFavorite).map((c) => c.user._id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const toggleFavorite = async (userId) => {
    const wasFavorite = favoriteIds.has(userId);

    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (wasFavorite) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });

    try {
      await api.put(`/contacts/${userId}/favorite`, { favorite: !wasFavorite });
    } catch (err) {
      console.error(err);
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        if (wasFavorite) newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="text-gray-400 animate-pulse">Loading contacts...</p>;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Tabs */}
      <div className="sticky top-0 bg-gradient-to-b from-gray-50 to-white z-50 pb-2 pt-4">
        <div className="flex gap-2 max-w-lg mx-auto">
          <button
            onClick={() => { setActiveTab("contacts"); setSelected(null); }}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${activeTab === "contacts" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            Contacts
          </button>
          <button
            onClick={() => { setActiveTab("add"); setSelected(null); }}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "add" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            <UserPlus size={18} />
            Ajouter Contact
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "add" ? (
          <AddContactTab contactIds={contactIds} />
        ) : selected ? (
          <ContactDetails contact={selected} toggleFavorite={toggleFavorite} favoriteIds={favoriteIds} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Search */}
            <div className="sticky top-0 bg-gradient-to-b from-white to-transparent z-40 pb-2">
              <div className="max-w-lg mx-auto">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-all" />
                  <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-blue-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all text-slate-700 placeholder-blue-400 font-medium shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Favorites */}
            <FavoritesBar contacts={contacts} favoriteIds={favoriteIds} setSelected={setSelected} searchTerm={searchTerm} />

            {/* Contact List */}
            <h2 className="font-semibold text-lg mb-2 text-gray-700 max-w-lg mx-auto">Contacts</h2>
            <div className="bg-white/80 backdrop-blur-md shadow-xl p-5 rounded-2xl max-w-lg mx-auto animate-fadeIn">
              {filteredContacts.length === 0 && <p className="text-center text-sm text-gray-500 py-6">Aucun contact ne correspond à la recherche.</p>}

              <ul className="space-y-3">
                {filteredContacts.map((contact) => {
                  const user = contact.user;
                  if (!user) return null;
                  const isFav = favoriteIds.has(user._id);

                  return (
                    <li
                      key={contact._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-blue-50"
                      onClick={() => setSelected(contact)}
                    >
                      <div className="flex items-center">
                        <Avatar user={user} size="md" showStatus={true} />
                        <div className="ml-4">
                          <p className="font-medium text-gray-900 text-lg">{user.name}</p>
                          <p className={`text-sm ${user.isOnline ? "text-green-600" : "text-gray-500"}`}>
                            {user.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(user._id); }}>
                        <Star
                          size={20}
                          className={`transition-colors ${isFav ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} hover:text-yellow-400`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
