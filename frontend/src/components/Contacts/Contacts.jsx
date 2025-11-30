"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Search,
  ArrowLeft,
  Mail,
  Star,
  CalendarDays,
  UserPlus,
  Phone,
  MessageCircle,
  Video,
} from "lucide-react";

import api from "../../lib/api";
import {
  searchUsers,
  sendInvitation,
  getSentInvitations,
} from "@/lib/api";
import { getSocket, onInvitationCancelled } from "@/services/socket";

/* ---------------- AVATAR ---------------- */
function Avatar({ user, size = "md", showStatus = true }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0])
        .toUpperCase()
        .slice(0, 2);
    return name.slice(0, 2).toUpperCase();
  };

  const sizes = {
    sm: "w-12 h-12 text-sm",
    md: "w-14 h-14 text-base",
    lg: "w-28 h-28 text-3xl",
  };
  const statusSizes = { sm: "w-3 h-3", md: "w-3 h-3", lg: "w-4 h-4" };
  const statusBorder = isDark ? "border-slate-900" : "border-white";

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
          className={`${sizes[size]} bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow`}
        >
          {getInitials(user.name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-1 right-1 ${statusSizes[size]} rounded-full border-2 ${statusBorder} ${
            user.isOnline ? "bg-emerald-500" : "bg-slate-500"
          }`}
        />
      )}
    </div>
  );
}

/* ---------------- FAVORITES BAR ---------------- */
function FavoritesBar({ contacts, favoriteIds, setSelected, searchTerm }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const favorites = contacts.filter(
    (c) =>
      favoriteIds.has(c.user?._id) &&
      c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (favorites.length === 0) return null;

  return (
    <div className="mb-4 max-w-lg mx-auto">
      <h2
        className={
          "font-semibold text-lg mb-2 " +
          (isDark ? "text-slate-100" : "text-gray-700")
        }
      >
        Favoris
      </h2>
      <div
        className={
          "flex gap-3 overflow-x-auto p-3 rounded-xl shadow " +
          (isDark ? "bg-slate-900/80 border border-slate-800" : "bg-gray-50")
        }
      >
        {favorites.map((contact) => (
          <div
            key={contact._id}
            className={
              "flex flex-col items-center cursor-pointer rounded-lg p-1 transition-colors " +
              (isDark
                ? "hover:bg-slate-800"
                : "hover:bg-blue-50")
            }
            onClick={() => setSelected(contact)}
          >
            <Avatar user={contact.user} size="sm" showStatus={true} />
            <p
              className={
                "text-xs truncate max-w-[60px] text-center " +
                (isDark ? "text-slate-200" : "text-gray-700")
              }
            >
              {contact.user.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/*  CONTACT DETAILS  */
function ContactDetails({ contact, toggleFavorite, favoriteIds, onBack }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const user = contact.user;
  const isFav = favoriteIds.has(user._id);

  const cardClass =
    "backdrop-blur-xl p-6 rounded-3xl max-w-lg mx-auto animate-fadeIn relative shadow-2xl " +
    (isDark
      ? "bg-slate-900/95 border border-slate-800 text-slate-50"
      : "bg-white/90 border border-slate-100 text-gray-900");

  const subtleText = isDark ? "text-slate-400" : "text-gray-500";

  return (
    <div className={cardClass}>
      {/* Back button */}
      <button
        onClick={onBack}
        className={
          "flex items-center gap-2 mb-5 transition-colors " +
          (isDark
            ? "text-sky-400 hover:text-sky-300"
            : "text-blue-600 hover:text-blue-800")
        }
      >
        <ArrowLeft size={20} /> Retour
      </button>

      {/* Favorite button */}
      <button
        onClick={() => toggleFavorite(user._id)}
        className="absolute top-6 right-6"
      >
        <Star
          size={28}
          className={
            "transition-colors " +
            (isFav
              ? "text-yellow-400 fill-yellow-400"
              : isDark
              ? "text-slate-500"
              : "text-gray-300 hover:text-yellow-400")
          }
        />
      </button>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center">
        <Avatar user={user} size="lg" showStatus={true} />
        <h1 className="text-2xl font-semibold mt-4">{user.name}</h1>
        <p className={subtleText}>{user.status || "Aucun statut"}</p>
      </div>

      {/* Action icons horizontal */}
      <div className="flex justify-center gap-6 mt-6">
        <button
          className={
            "flex flex-col items-center transition-colors " +
            (isDark
              ? "text-slate-300 hover:text-sky-400"
              : "text-gray-700 hover:text-blue-600")
          }
        >
          <Phone size={24} />
          <span className="text-xs mt-1">Appeler</span>
        </button>
        <button
          className={
            "flex flex-col items-center transition-colors " +
            (isDark
              ? "text-slate-300 hover:text-sky-400"
              : "text-gray-700 hover:text-blue-600")
          }
        >
          <MessageCircle size={24} />
          <span className="text-xs mt-1">Message</span>
        </button>
        <button
          className={
            "flex flex-col items-center transition-colors " +
            (isDark
              ? "text-slate-300 hover:text-sky-400"
              : "text-gray-700 hover:text-blue-600")
          }
        >
          <Video size={24} />
          <span className="text-xs mt-1">Vidéo</span>
        </button>
      </div>

      {/* Email & Date */}
      <div className="mt-6 space-y-4">
        <div
          className={
            "p-4 rounded-xl flex items-center gap-4 shadow " +
            (isDark ? "bg-slate-900 border border-slate-700" : "bg-blue-50")
          }
        >
          <Mail
            className={
              "w-5 h-5 " +
              (isDark ? "text-sky-400" : "text-blue-600")
            }
          />
          <div>
            <p className={"text-sm " + subtleText}>Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>

        <div
          className={
            "p-4 rounded-xl flex items-center gap-4 shadow " +
            (isDark
              ? "bg-slate-900 border border-slate-700"
              : "bg-purple-50")
          }
        >
          <CalendarDays
            className={
              "w-5 h-5 " +
              (isDark ? "text-purple-300" : "text-purple-600")
            }
          />
          <div>
            <p className={"text-sm " + subtleText}>Ajouté le</p>
            <p className="font-medium">
              {new Date(contact.addedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADD CONTACT TAB ---------------- */
function AddContactTab({ contactIds }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
        const sentUserIds = (response.data.invitations || []).map(
          (inv) => inv.receiver._id
        );
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

  const searchInputClass =
    "w-full pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none transition-all font-medium shadow-sm hover:shadow-md " +
    (isDark
      ? "bg-slate-900 border-2 border-slate-700 text-slate-100 placeholder-sky-500 focus:ring-4 focus:ring-sky-900/50 focus:border-sky-500"
      : "bg-white border-2 border-blue-100 text-slate-700 placeholder-blue-400 focus:ring-4 focus:ring-blue-200 focus:border-blue-400");

  return (
    <div>
      <div
        className={
          "sticky top-0 z-40 pb-2 " +
          (isDark
            ? "bg-gradient-to-b from-slate-950 to-slate-900"
            : "bg-gradient-to-b from-white to-transparent")
        }
      >
        <div className="p-4 max-w-lg mx-auto">
          <div className="relative group">
            <Search
              className={
                "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all " +
                (isDark
                  ? "text-sky-400 group-focus-within:text-sky-300"
                  : "text-blue-400 group-focus-within:text-blue-600")
              }
            />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={searchInputClass}
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {searchResults.length > 0 && (
          <div
            className={
              "rounded-2xl p-5 animate-fadeIn shadow-xl backdrop-blur-md " +
              (isDark
                ? "bg-slate-900/90 border border-slate-800"
                : "bg-white/80")
            }
          >
            <h3
              className={
                "text-lg font-semibold mb-4 " +
                (isDark ? "text-slate-100" : "text-gray-800")
              }
            >
              Résultats ({searchResults.length})
            </h3>
            <ul className="space-y-3">
              {searchResults.map((user) => {
                const isInvitationSent = sentInvitations.has(user._id);
                return (
                  <li
                    key={user._id}
                    className={
                      "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer shadow-sm " +
                      (isDark
                        ? "bg-slate-900 border border-slate-700 hover:bg-slate-800"
                        : "bg-white hover:bg-blue-50 hover:shadow-md")
                    }
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <Avatar user={user} size="sm" showStatus={false} />
                      <div className="ml-4 min-w-0 flex-1">
                        <p
                          className={
                            "font-medium truncate " +
                            (isDark ? "text-slate-100" : "text-gray-900")
                          }
                        >
                          {user.name}
                        </p>
                        <p
                          className={
                            "text-sm truncate " +
                            (isDark ? "text-slate-400" : "text-gray-500")
                          }
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendInvitation(user._id)}
                      disabled={sendingTo === user._id || isInvitationSent}
                      className={
                        "ml-3 px-4 py-2 text-sm font-medium rounded-lg flex-shrink-0 transition-all shadow-sm " +
                        (isInvitationSent
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed")
                      }
                    >
                      {sendingTo === user._id
                        ? "Envoi..."
                        : isInvitationSent
                        ? "Envoyé"
                        : "Inviter"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {searchResults.length === 0 && searchQuery && !searching && (
          <div className="text-center py-8">
            <p
              className={
                "text-lg " + (isDark ? "text-slate-200" : "text-gray-500")
              }
            >
              Aucun utilisateur trouvé
            </p>
            <p
              className={
                "mt-2 text-sm " +
                (isDark ? "text-slate-500" : "text-gray-400")
              }
            >
              Essayez un autre terme de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- MAIN CONTACTS PAGE ---------------- */
export default function ContactsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
        setContactIds(
          new Set(
            fetchedContacts
              .map((c) => c.user?._id)
              .filter(Boolean)
          )
        );
        setFavoriteIds(
          new Set(
            fetchedContacts
              .filter((c) => c.isFavorite)
              .map((c) => c.user._id)
          )
        );
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
      await api.put(`/contacts/${userId}/favorite`, {
        favorite: !wasFavorite,
      });
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

  if (loading)
    return (
      <p
        className={
          "animate-pulse text-sm " +
          (isDark ? "text-slate-500" : "text-gray-400")
        }
      >
        Loading contacts...
      </p>
    );

  const headerBg =
    "sticky top-0 z-50 pb-2 pt-4 " +
    (isDark
      ? "bg-gradient-to-b from-slate-950 to-slate-900"
      : "bg-gradient-to-b from-gray-50 to-white");

  const tabBase =
    "flex-1 py-3 rounded-xl font-semibold transition-all " +
    (isDark
      ? "bg-slate-900 text-slate-200 hover:bg-slate-800"
      : "bg-white text-gray-600 hover:bg-gray-100");

  const tabActive =
    "bg-blue-600 text-white shadow-md hover:bg-blue-600";

  const searchInputClass =
    "w-full pl-12 pr-4 py-3 rounded-2xl focus:outline-none transition-all font-medium shadow-sm hover:shadow-md " +
    (isDark
      ? "bg-slate-900 border-2 border-slate-700 text-slate-100 placeholder-sky-500 focus:ring-4 focus:ring-sky-900/50 focus:border-sky-500"
      : "bg-white border-2 border-blue-100 text-slate-700 placeholder-blue-400 focus:ring-4 focus:ring-blue-200 focus:border-blue-400");

  const contactCardClass =
    "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all shadow-sm " +
    (isDark
      ? "bg-slate-900 border border-slate-700 hover:bg-slate-800"
      : "bg-white hover:bg-blue-50 hover:shadow-md");

  return (
    <div
      className={
        "flex flex-col h-full p-4 " +
        (isDark ? "bg-slate-950 text-slate-50" : "bg-gray-50 text-slate-900")
      }
    >
      {/* Tabs */}
      <div className={headerBg}>
        <div className="flex gap-2 max-w-lg mx-auto">
          <button
            onClick={() => {
              setActiveTab("contacts");
              setSelected(null);
            }}
            className={
              tabBase +
              " " +
              (activeTab === "contacts" ? tabActive : "")
            }
          >
            Contacts
          </button>
          <button
            onClick={() => {
              setActiveTab("add");
              setSelected(null);
            }}
            className={
              tabBase +
              " flex items-center justify-center gap-2 " +
              (activeTab === "add" ? tabActive : "")
            }
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
          <ContactDetails
            contact={selected}
            toggleFavorite={toggleFavorite}
            favoriteIds={favoriteIds}
            onBack={() => setSelected(null)}
          />
        ) : (
          <>
            {/* Search contacts */}
            <div
              className={
                "sticky top-0 z-40 pb-2 " +
                (isDark
                  ? "bg-gradient-to-b from-slate-950 to-slate-900"
                  : "bg-gradient-to-b from-white to-transparent")
              }
            >
              <div className="max-w-lg mx-auto">
                <div className="relative group">
                  <Search
                    className={
                      "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all " +
                      (isDark
                        ? "text-sky-400 group-focus-within:text-sky-300"
                        : "text-blue-400 group-focus-within:text-blue-600")
                    }
                  />
                  <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={searchInputClass}
                  />
                </div>
              </div>
            </div>

            {/* Favorites */}
            <FavoritesBar
              contacts={contacts}
              favoriteIds={favoriteIds}
              setSelected={setSelected}
              searchTerm={searchTerm}
            />

            {/* Contact List */}
            <h2
              className={
                "font-semibold text-lg mb-2 max-w-lg mx-auto " +
                (isDark ? "text-slate-100" : "text-gray-700")
              }
            >
              Contacts
            </h2>
            <div
              className={
                "max-w-lg mx-auto rounded-2xl p-5 animate-fadeIn shadow-xl backdrop-blur-md " +
                (isDark
                  ? "bg-slate-900/90 border border-slate-800"
                  : "bg-white/80")
              }
            >
              {filteredContacts.length === 0 && (
                <p
                  className={
                    "text-center text-sm py-6 " +
                    (isDark ? "text-slate-400" : "text-gray-500")
                  }
                >
                  Aucun contact ne correspond à la recherche.
                </p>
              )}

              <ul className="space-y-3">
                {filteredContacts.map((contact) => {
                  const user = contact.user;
                  if (!user) return null;
                  const isFav = favoriteIds.has(user._id);

                  return (
                    <li
                      key={contact._id}
                      className={contactCardClass}
                      onClick={() => setSelected(contact)}
                    >
                      <div className="flex items-center">
                        <Avatar user={user} size="md" showStatus={true} />
                        <div className="ml-4">
                          <p className="font-medium text-lg">{user.name}</p>
                          <p
                            className={
                              "text-sm " +
                              (user.isOnline
                                ? "text-emerald-400"
                                : isDark
                                ? "text-slate-400"
                                : "text-gray-500")
                            }
                          >
                            {user.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(user._id);
                        }}
                      >
                        <Star
                          size={20}
                          className={
                            "transition-colors " +
                            (isFav
                              ? "text-yellow-400 fill-yellow-400"
                              : isDark
                              ? "text-slate-500"
                              : "text-gray-300 hover:text-yellow-400")
                          }
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