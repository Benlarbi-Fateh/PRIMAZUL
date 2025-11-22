"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import Image from "next/image";
import { FaArrowLeft, FaUser, FaInfoCircle, FaCamera } from "react-icons/fa";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", status: "" });
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Récupération du profil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          status: data.status || "",
        });
      } catch (error) {
        console.error("Erreur API:", error);
      }
    };
    fetchProfile();
  }, []);

  // Inputs
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Upload image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Sauvegarde du profil
  const handleUpdate = async () => {
    try {
      let updatedData = { ...form };

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const { data: uploadData } = await api.post("/upload", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        updatedData.profilePicture = uploadData.fileUrl;
      }

      const { data } = await api.put("/users/profile", updatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      setUser({ ...user, ...data });
      localStorage.setItem("user", JSON.stringify({ ...user, ...data }));

      setEditMode(false);
      setPreview(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Impossible de sauvegarder. Vérifie backend + Cloudinary.");
    }
  };

  if (!user)
    return (
      <p className="text-center text-blue-900 mt-10 text-lg">Chargement...</p>
    );

  return (
    <div className="min-h-screen bg-blue-50 text-blue-900 flex flex-col items-center">
      {/* Header */}
      <div
        className="fixed top-0 left-0 w-full flex items-center px-4 py-3 shadow z-10"
        style={{
          background:
            "linear-gradient(to right bottom, lab(44.0605 29.0279 -86.0352) 0%, lab(36.9089 35.0961 -85.6872) 50%, lab(55.1767 -26.7496 -30.5138) 100%)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="text-white text-xl mr-2"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-white">Profil</h1>
      </div>

      <div className="pt-24 max-w-md w-full flex flex-col items-center px-4">
        {/* Photo profil */}
        <div className="relative mb-6">
          <div className="w-36 h-36 rounded-full overflow-hidden bg-blue-100 shadow-md border border-blue-200">
            <Image
              src={preview || user.profilePicture || "/default-avatar.png"}
              alt="avatar"
              width={144}
              height={144}
              className="object-cover"
            />
          </div>

          {editMode && (
            <label className="absolute bottom-0 right-0 bg-blue-500 p-3 rounded-full cursor-pointer text-white shadow">
              <FaCamera />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Champs Profil */}
        <div className="w-full space-y-5 mb-6">
          <ProfileField
            icon={<FaUser />}
            label="Nom"
            name="name"
            value={form.name}
            editMode={editMode}
            handleChange={handleChange}
            fallback={user.name}
          />

          <ProfileField
            icon={<FaInfoCircle />}
            label="Email"
            name="email"
            value={form.email}
            editMode={editMode}
            handleChange={handleChange}
            fallback={user.email}
          />

          <ProfileField
            icon={<FaInfoCircle />}
            label="Statut"
            name="status"
            value={form.status}
            editMode={editMode}
            handleChange={handleChange}
            fallback={user.status || "Non défini"}
          />
        </div>

        {/* Boutons */}
        <div className="w-full flex justify-center">
          {editMode ? (
            <div className="flex space-x-4">
              <button
                onClick={handleUpdate}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setPreview(null);
                  setSelectedFile(null);
                  setForm({
                    name: user.name,
                    email: user.email,
                    status: user.status,
                  });
                }}
                className="bg-blue-200 text-blue-900 px-5 py-2 rounded-xl"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-800 text-white px-5 py-2 rounded-xl shadow"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   🔹 Composant champ de profil (NOUVEAU DESIGN AMÉLIORÉ)
---------------------------------------------------------- */
function ProfileField({
  icon,
  label,
  name,
  value,
  editMode,
  handleChange,
  fallback,
}) {
  return (
    <div className="w-full bg-white shadow-md rounded-2xl p-5 border border-blue-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-blue-600 text-2xl">{icon}</div>
        <p className="text-blue-900 text-base font-semibold">{label}</p>
      </div>

      {editMode ? (
        <input
          type={name === "email" ? "email" : "text"}
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full p-3 text-blue-900 rounded-xl border border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          placeholder={`Votre ${label.toLowerCase()}`}
        />
      ) : (
        <p className="text-xl font-bold text-blue-900 bg-blue-50 p-3 rounded-xl border border-blue-200">
          {fallback}
        </p>
      )}
    </div>
  );
}
