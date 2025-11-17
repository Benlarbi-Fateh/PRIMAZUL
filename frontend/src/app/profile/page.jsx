"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FaSignOutAlt,
  FaTrashAlt,
  FaPhone,
  FaPen,
  FaUser,
  FaEnvelope,
  FaCommentDots,
} from "react-icons/fa";
import StarRating from "../components/StarRating";
import ReclamationForm from "../components/ReclamationForm";



export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [editableUser, setEditableUser] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReclamationModal, setShowReclamationModal] = useState(false);

  // Charger le profil utilisateur
  useEffect(() => {
    axios
      .get("http://192.168.176.1:5000/api/user/last")
      .then((res) => {
        setUser(res.data);
        setEditableUser(res.data);
      })
      .catch((err) => {
        console.error("Erreur récupération utilisateur :", err);
        alert("Impossible de récupérer les informations utilisateur");
      });
  }, []);

  // Mettre à jour le profil
  const updateProfile = async () => {
    try {
      const res = await axios.put(
        `http://192.168.176.1:5000/api/user/${user._id}`,
        editableUser
      );
      setUser(res.data);
      setEditableUser(res.data);
      setEditMode(false);
      alert("Profil mis à jour !");
    } catch (error) {
      console.error("Erreur mise à jour :", error);
      alert("Erreur lors de la mise à jour du profil");
    }
  };

  // Upload photo
  const uploadProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?._id) return;

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const res = await axios.post(
        `http://192.168.176.1:5000/api/user/upload/${user._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUser(res.data);
      setEditableUser(res.data);
    } catch (error) {
      console.error("Erreur upload photo :", error);
      alert("Erreur lors de l’upload de la photo");
    }
  };

  // Supprimer compte
  const deleteAccount = async () => {
    try {
      await axios.delete(`http://192.168.176.1:5000/api/user/${user._id}`);
      alert("Compte supprimé !");
      router.push("/login");
    } catch (error) {
      console.error("Erreur suppression compte :", error);
      alert("Erreur lors de la suppression");
    }
  };

  // Logout
  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (!user) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Menu</h2>
        <button
          onClick={() => setShowRatingModal(true)}
          className="w-full flex items-center gap-3 p-3 bg-blue-100 rounded mb-3"
        >
          <FaCommentDots /> Noter l'application
        </button>
        <button
          onClick={() => setShowReclamationModal(true)}
          className="w-full flex items-center gap-3 p-3 bg-yellow-100 rounded mb-3"
        >
          <FaCommentDots /> Réclamation
        </button>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 p-3 bg-red-100 rounded mb-3"
        >
          <FaSignOutAlt /> Déconnexion
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 p-3 bg-red-300 rounded"
        >
          <FaTrashAlt /> Supprimer mon compte
        </button>
      </aside>

      {/* Contenu */}
      <main className="flex-1 p-12">
        <div className="bg-white shadow-lg p-8 rounded-lg max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <img
              src={
                user.profilePicture
                  ? `http://192.168.176.1:5000${user.profilePicture}`
                  : "/default-avatar.png"
              }
              alt="Profil"
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Changer la photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={uploadProfilePicture}
              className="hidden"
            />
          </div>

          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-3">
              <FaUser />
              <input
                type="text"
                disabled={!editMode}
                value={editableUser.username || ""}
                onChange={(e) =>
                  setEditableUser({ ...editableUser, username: e.target.value })
                }
                className={`border p-2 rounded w-full ${
                  editMode ? "bg-gray-50" : "bg-gray-200 cursor-not-allowed"
                }`}
              />
            </div>
            <div className="flex items-center gap-3">
              <FaEnvelope />
              <input
                type="email"
                disabled={!editMode}
                value={editableUser.email || ""}
                onChange={(e) =>
                  setEditableUser({ ...editableUser, email: e.target.value })
                }
                className={`border p-2 rounded w-full ${
                  editMode ? "bg-gray-50" : "bg-gray-200 cursor-not-allowed"
                }`}
              />
            </div>
            <div className="flex items-center gap-3">
              <FaPhone />
              <input
                type="text"
                disabled={!editMode}
                value={editableUser.phoneNumber || ""}
                onChange={(e) =>
                  setEditableUser({
                    ...editableUser,
                    phoneNumber: e.target.value,
                  })
                }
                className={`border p-2 rounded w-full ${
                  editMode ? "bg-gray-50" : "bg-gray-200 cursor-not-allowed"
                }`}
              />
            </div>
            <textarea
              disabled={!editMode}
              value={editableUser.statusMessage || ""}
              onChange={(e) =>
                setEditableUser({
                  ...editableUser,
                  statusMessage: e.target.value,
                })
              }
              placeholder="Message de statut"
              className={`border p-2 rounded w-full h-20 ${
                editMode ? "bg-gray-50" : "bg-gray-200 cursor-not-allowed"
              }`}
            />
          </div>

          <div className="mt-8 flex justify-center gap-4">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="bg-green-500 text-white px-6 py-2 rounded flex items-center gap-2"
              >
                <FaPen /> Modifier
              </button>
            ) : (
              <>
                <button
                  onClick={updateProfile}
                  className="bg-blue-500 text-white px-6 py-2 rounded"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditableUser(user);
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {showRatingModal && <StarRating onClose={() => setShowRatingModal(false)} />}
      {showReclamationModal && <ReclamationForm onClose={() => setShowReclamationModal(false)} />}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-lg mb-4">Se déconnecter ?</p>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
              Oui
            </button>
            <button onClick={() => setShowLogoutConfirm(false)} className="ml-3 text-gray-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-lg mb-4">Supprimer votre compte ?</p>
            <button
              onClick={deleteAccount}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Oui supprimer
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} className="ml-3 text-gray-600">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
