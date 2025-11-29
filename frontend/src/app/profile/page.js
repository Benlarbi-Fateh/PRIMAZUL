"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import Image from "next/image";
import VerifyCode from "@/components/Auth/VerifyCode"; 
import { FaArrowLeft, FaUser, FaInfoCircle, FaCamera } from "react-icons/fa";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", status: "" });
  const [originalEmail, setOriginalEmail] = useState("");

  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // 🔹 Vérification email
  const [showVerify, setShowVerify] = useState(false);
  const [tempEmail, setTempEmail] = useState("");

  // -----------------------------
  // 🔹 Récupération profil
  // -----------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setUser(data);
        setOriginalEmail(data.email);
        setForm({
          name: data.name || "",
          email: data.email || "",
          status: data.status || "",
        });
      } catch (err) {
        console.error("Erreur API:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // -----------------------------
  // 🔹 Upload image
  // -----------------------------
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSelectedFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // -----------------------------
  // 🔹 Sauvegarde
  // -----------------------------
  const handleUpdate = async () => {
    try {
      const updatedData = { ...form };

      // 🔹 Image
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);

        const { data: uploadData } = await api.post("/upload", fd, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        updatedData.profilePicture = uploadData.fileUrl;
      }

      // 🔹 SI l’email a changé → vérification obligatoire
      if (form.email !== originalEmail) {
        setTempEmail(form.email);

        await api.post(
          "/users/request-email-change",
          { newEmail: form.email },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        setShowVerify(true); // Affiche VerifyCode
        return; // on bloque la sauvegarde standard
      }

      // Sinon sauvegarde normale
      const { data } = await api.put("/users/profile", updatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      setUser({ ...user, ...data });
      localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
      setOriginalEmail(data.email);

      setEditMode(false);
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  // -----------------------------
  // 🔹 Vérification du code reçu
  // -----------------------------
  const handleVerify = async (code) => {
    await api.post(
      "/users/confirm-email-change",
      { code },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    setShowVerify(false);
    setEditMode(false);

    // Persistance profil
    setUser({ ...user, email: tempEmail });
    setOriginalEmail(tempEmail);

    alert("Adresse email mise à jour !");
  };

  const handleResend = async () => {
    await api.post(
      "/users/request-email-change",
      { newEmail: tempEmail },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
  };

  if (!user) return <p className="text-center mt-10">Chargement...</p>;

  // -----------------------------------------
  // 🔹 MODE VÉRIFICATION EMAIL
  // -----------------------------------------
  if (showVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <VerifyCode
          email={tempEmail}
          type="email-change"
          onVerify={handleVerify}
          onResend={handleResend}
          onBack={() => setShowVerify(false)}
        />
      </div>
    );
  }

  // -----------------------------------------
  // 🔹 MODE EDIT PROFILE
  // -----------------------------------------
  return (
    <div className="min-h-screen bg-blue-50 text-blue-900 flex flex-col items-center">
      <div
        className="fixed top-0 left-16 w-[calc(100%-5rem)] flex items-center px-4 py-3 shadow z-10"
        style={{
          background:
            "linear-gradient(to right bottom, #2563eb, #1d4ed8, #0ea5e9)",
        }}
      >
        <button onClick={() => router.back()} className="text-white text-xl mr-2">
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-white">Profil</h1>
      </div>

      <div className="pt-24 max-w-md w-full flex flex-col items-center px-4">
        {/* PHOTO */}
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
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* CHAMPS */}
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

        {/* BOUTONS */}
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

function ProfileField({ icon, label, name, value, editMode, handleChange, fallback }) {
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
