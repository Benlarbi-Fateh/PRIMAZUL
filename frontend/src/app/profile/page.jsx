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
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showReclamation, setShowReclamation] = useState(false); 
  const fileInputRef = useRef(null);

useEffect(() => {
  let isMounted = true;
 axios.get("http://192.168.176.1:5000/api/user/last")
    .then((res) => {
      if (isMounted) {
        setUser(res.data);
        setPreview(res.data?.profilePicture || "");
      }
    })
    .catch((err) => console.error("Erreur récupération utilisateur :", err));

  return () => { isMounted = false; };
}, []);

  const handleEditPhotoClick = () => fileInputRef.current.click();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = res.data.imageUrl;
      setPreview(imageUrl);
      setUser((prev) => ({ ...prev, profilePicture: imageUrl }));

      if (user?._id) {
        await axios.put(`http://localhost:5000/api/profile/${user._id}`, {
          profilePicture: imageUrl,
        });
      }

      alert("Photo de profil mise à jour !");
    } catch (err) {
      console.error("Erreur upload :", err);
      alert("Erreur lors du téléchargement de l'image.");
    }
  };





  const handleLogout = () => {
    localStorage.removeItem("userId");
    alert("Déconnexion réussie !");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
  if (!user?._id) {
    alert("Utilisateur non chargé, impossible de supprimer le compte !");
    return;
  }

  const confirmDelete = window.confirm(
    "⚠️ Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible !"
  );
  if (!confirmDelete) return;

  try {
    await axios.delete(`http://localhost:5000/api/profile/deleteAccount/${user._id}`);
    alert("Compte supprimé avec succès !");
    localStorage.removeItem("user");  
    localStorage.clear();
    router.replace("/register");
  } catch (error) {
    console.error("Erreur suppression du compte :", error);
    alert("Une erreur est survenue lors de la suppression du compte.");
  }
};


  const sidebarItems = [
    { icon: <ProfilePhoto src={preview} />, label: "profile" },
    { icon: <FaSignOutAlt size={22} />, label: "deconnexion", onClick: handleLogout },
    { icon: <FaTrashAlt size={22} color="red" />, label: "Suppression", onClick: handleDeleteAccount },
  ];

  if (!user)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Chargement du profil...</p>;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div
        style={{ ...styles.sidebar, width: sidebarExpanded ? 180 : 70 }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {sidebarItems.map((item) => (
          <SidebarIcon
            key={item.label}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick}
            expanded={sidebarExpanded}
          />
        ))}
      </div>

      {/* Contenu principal */}
      <div style={styles.profileContainer}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={styles.title}>Mon Profil</h2>
          <div style={{ position: "relative" }}>
            <button style={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)}>
              ⋮
            </button>
            {menuOpen && (
              <div style={styles.dropdown}>
                <div
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowRating(true);
                    setMenuOpen(false);
                  }}
                >
                  Évaluer Notre Application
                </div>
                <div
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowReclamation(true);
                    setMenuOpen(false);
                  }}
                >
                  Envoyer une réclamation
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photo de profil */}
        <div style={styles.photoWrapper}>
          <div style={styles.imageContainer} onClick={handleEditPhotoClick}>
            {preview ? (
              <img src={preview} alt="Profil" style={styles.profileImage} />
            ) : (
              <div style={styles.emptyProfileImage}>
                <FaPen size={20} color="#0057D9" />
              </div>
            )}
            <div style={styles.overlay}>Modifier la photo</div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
        </div>

        {/* Infos utilisateur */}
        <div style={styles.infoSection}>
          <label style={styles.label}>
            <FaUser style={{ marginRight: "5px" }} />
            Nom
          </label>
          <input
            type="text"
            name="username"
            value={user.username || ""}
            
            disabled
            style={inputStyle(false)}
          />

          <label style={styles.label}>
            <FaCommentDots style={{ marginRight: "5px" }} />
            Statut
          </label>
          <input
            type="text"
            name="statusMessage"
            value={user.statusMessage || ""}
            disabled
            style={inputStyle(false)}
            placeholder="Entrez votre statut"
          />

          <label style={styles.label}>
            <FaPhone style={{ marginRight: "5px" }} /> Téléphone
          </label>
          <input
            type="text"
            name="phoneNumber"
            value={user.phoneNumber || ""}
            disabled
            style={inputStyle(false)}
          />

          <label style={styles.label}>
            <FaEnvelope style={{ marginRight: "5px" }} />
            Email
          </label>
          <input
            type="email"
            name="email"
            value={user.email || ""}
            disabled
            style={inputStyle(false)}
          />
        </div>

       
      </div>

      {/* Modal StarRating */}
      {showRating && (
        <div style={styles.modalOverlay} onClick={() => setShowRating(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {user?._id && <StarRating userId={user._id} />}
            <button
              style={{
                marginTop: "15px",
                padding: "8px 15px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => setShowRating(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Reclamation */}
      {showReclamation && (
        <div style={styles.modalOverlay} onClick={() => setShowReclamation(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <ReclamationForm />
            <button
              style={{
                marginTop: "15px",
                padding: "8px 15px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => setShowReclamation(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Composants ---------- */
const SidebarIcon = ({ icon, label, onClick, expanded }) => (
  <div
    style={{
      ...styles.iconWrapper,
      width: expanded ? "160px" : "50px",
      justifyContent: expanded ? "flex-start" : "center",
    }}
    onClick={onClick}
  >
    {icon}
    {expanded && <span style={styles.iconLabel}>{label}</span>}
  </div>
);

const ProfilePhoto = ({ src }) => {
  if (!src) return null;
  return (
    <img
      src={src}
      alt="Profil"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid white",
      }}
    />
  );
};

/* ---------- Styles ---------- */
// ... ton objet styles et inputStyle restent identiques

/* ---------- Styles créatifs ---------- */
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', Arial, sans-serif",
    background: "linear-gradient(135deg, #e0f7ff, #f5f8ff)",
    transition: "background 0.5s",
  },
 sidebar: {
  background: "#ecf0f2ff", 
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "50px 0",
  width: "250px",
  transition: "all 0.4s ease",
  boxShadow: "4px 0 30px rgba(0,0,0,0.15)", // ombre plus douce et profonde
  borderRadius: "0 25px 25px 0",
  color: "#1ba0e3ff",
  fontWeight: "bold",
  letterSpacing: "0.5px",
},
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    margin: "22px 0",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "15px",
    transition: "all 0.3s ease",
  },
  iconWrapperHover: {
    background: "linear-gradient(90deg, #0057D9, #00aaff)",
    color: "#fff",
    transform: "scale(1.05)",
    boxShadow: "0 4px 15px rgba(0,87,217,0.3)",
  },
  iconLabel: {
    marginLeft: "14px",
    color: "#1a1a1a",
    fontWeight: 600,
    fontSize: "1rem",
    whiteSpace: "nowrap",
    transition: "color 0.3s",
  },
  profileContainer: {
    flexGrow: 1,
    padding: "45px 50px",
    background: "#ffffff",
    borderRadius: "25px",
    margin: "50px auto",
    maxWidth: "700px",
    boxShadow: "10px 15px 30px rgba(0,0,0,0.08)",
    position: "relative",
    transition: "transform 0.3s ease",
  },
  profileContainerHover: {
    transform: "translateY(-5px)",
  },
  title: {
    color: "#111",
    marginBottom: "35px",
    textAlign: "center",
    fontSize: "2rem",
    fontWeight: 700,
    textShadow: "1px 1px 3px rgba(0,0,0,0.1)",
  },
  photoWrapper: {
    textAlign: "center",
    position: "relative",
    marginBottom: "30px",
  },
  imageContainer: {
    position: "relative",
    display: "inline-block",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  profileImage: {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #0057D9",
    boxShadow: "0 6px 15px rgba(0,87,217,0.3)",
    transition: "all 0.3s ease",
  },
  profileImageHover: {
    transform: "rotate(3deg) scale(1.1)",
  },
  emptyProfileImage: {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    border: "3px dashed #0057D9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2ff",
    cursor: "pointer",
    boxShadow: "inset 0 4px 10px rgba(0,87,217,0.1)",
  },
  overlay: {
    position: "absolute",
    bottom: "0",
    left: "0",
    right: "0",
    height: "45px",
    backgroundColor: "rgba(0,87,217,0.9)",
    color: "#fff",
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: "50%",
    borderBottomRightRadius: "50%",
    opacity: 0,
    transition: "opacity 0.3s, transform 0.3s",
    transform: "translateY(10px)",
  },
  overlayHover: {
    opacity: 1,
    transform: "translateY(0)",
  },
  infoSection: {
    marginTop: "35px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  label: {
    color: "#333",
    fontWeight: 600,
    fontSize: "1rem",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "30px",
  },
  editBtn: {
    background: "linear-gradient(90deg, #0057D9, #00aaff)",
    color: "#fff",
    border: "none",
    padding: "12px 30px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s",
  },
  editBtnHover: {
    transform: "scale(1.05)",
    boxShadow: "0 6px 15px rgba(0,87,217,0.4)",
  },
  saveBtn: {
    background: "linear-gradient(90deg, #28a745, #45d87c)",
    color: "#fff",
    border: "none",
    padding: "12px 30px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s",
  },
  saveBtnHover: {
    transform: "scale(1.05)",
    boxShadow: "0 6px 15px rgba(40,167,69,0.4)",
  },
  dropdown: {
    position: "absolute",
    top: "50px",
    right: "0",
    background: "#fff",
    boxShadow: "0 15px 25px rgba(0,0,0,0.15)",
    borderRadius: "16px",
    padding: "18px",
    fontWeight: 600,
    overflow: "hidden",
    zIndex: 1000,
    minWidth: "220px",
    transition: "all 0.3s",
  },
  dropdownItem: {
    padding: "12px 18px",
    cursor: "pointer",
    borderRadius: "10px",
    color: "#333",
    transition: "all 0.2s",
  },
  dropdownItemHover: {
    background: "linear-gradient(90deg, #0057D9, #00aaff)",
    color: "#fff",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(3px)",
  },
  modalContent: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "18px",
    minWidth: "340px",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
    transform: "scale(0.95)",
    animation: "popIn 0.3s forwards",
  },
};

const inputStyle = (isEditing) => ({
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: isEditing ? "2px solid #0057D9" : "1px solid #ccc",
  backgroundColor: isEditing ? "#fff" : "#f0f4ff",
  fontSize: "1rem",
  transition: "all 0.3s ease",
  outline: "none",
  color: "#111",
  boxShadow: isEditing ? "0 0 8px rgba(0,87,217,0.2)" : "none",
  ":focus": {
    borderColor: "#0057D9",
    boxShadow: "0 0 10px rgba(0,87,217,0.3)",
  },
});
