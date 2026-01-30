// app/profile/hooks/useProfile.js
"use client";

import { useState, useCallback, useContext } from "react";
import { AuthContext } from "@/context/AuthProvider";
import {
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
  requestEmailChange,
  confirmEmailChange,
} from "@/lib/api";
import toast from "react-hot-toast";

export function useProfile() {
  const { user, setUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState("idle"); // idle | pending | verifying
  const [pendingEmail, setPendingEmail] = useState("");

  // 📊 Rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMyProfile();
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data.user;
    } catch (error) {
      console.error("Erreur refresh profil:", error);
      toast.error("Impossible de charger le profil");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // ✏️ Mettre à jour le profil
  const updateUserProfile = useCallback(
    async (data) => {
      setIsUpdating(true);
      try {
        const response = await updateProfile(data);
        if (response.data.success) {
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          toast.success("Profil mis à jour avec succès !");
          return response.data.user;
        }
      } catch (error) {
        console.error("Erreur update profil:", error);
        const message =
          error.response?.data?.error || "Erreur lors de la mise à jour";
        toast.error(message);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [setUser],
  );

  // 🖼️ Upload photo de profil
  const uploadPhoto = useCallback(
    async (file) => {
      if (!file) return;

      // Validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Format non supporté. Utilisez JPG, PNG, WebP ou GIF");
        return;
      }

      if (file.size > maxSize) {
        toast.error("Image trop volumineuse (max 5MB)");
        return;
      }

      setIsUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await uploadProfilePicture(formData);

        if (response.data.success) {
          const updatedUser = {
            ...user,
            profilePicture: response.data.profilePicture,
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          toast.success("Photo de profil mise à jour !");
          return response.data.profilePicture;
        }
      } catch (error) {
        console.error("Erreur upload photo:", error);
        toast.error("Erreur lors de l'upload de la photo");
        throw error;
      } finally {
        setIsUploadingPhoto(false);
      }
    },
    [user, setUser],
  );

  // 📧 Demander un changement d'email
  const requestEmailChangeOTP = useCallback(
    async (newEmail) => {
      if (!newEmail || newEmail === user?.email) {
        toast.error("Veuillez entrer un nouvel email différent");
        return;
      }

      setIsUpdating(true);
      try {
        const response = await requestEmailChange(newEmail);
        if (response.data.success) {
          setPendingEmail(newEmail);
          setEmailChangeStep("verifying");
          toast.success("Code de vérification envoyé à votre nouvel email");
          return true;
        }
      } catch (error) {
        console.error("Erreur demande changement email:", error);
        const message =
          error.response?.data?.error || "Erreur lors de la demande";
        toast.error(message);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [user?.email],
  );

  // ✅ Confirmer le changement d'email avec OTP
  const confirmEmailChangeOTP = useCallback(
    async (code) => {
      if (!code || code.length !== 6) {
        toast.error("Veuillez entrer un code valide à 6 chiffres");
        return;
      }

      setIsUpdating(true);
      try {
        const response = await confirmEmailChange(code);
        if (response.data.success) {
          const updatedUser = { ...user, email: pendingEmail };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setEmailChangeStep("idle");
          setPendingEmail("");
          toast.success("Email modifié avec succès !");
          return true;
        }
      } catch (error) {
        console.error("Erreur confirmation email:", error);
        const message =
          error.response?.data?.error || "Code invalide ou expiré";
        toast.error(message);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [user, pendingEmail, setUser],
  );

  // ❌ Annuler le changement d'email
  const cancelEmailChange = useCallback(() => {
    setEmailChangeStep("idle");
    setPendingEmail("");
  }, []);

  return {
    user,
    isLoading,
    isUpdating,
    isUploadingPhoto,
    emailChangeStep,
    pendingEmail,
    refreshProfile,
    updateUserProfile,
    uploadPhoto,
    requestEmailChangeOTP,
    confirmEmailChangeOTP,
    cancelEmailChange,
  };
}
