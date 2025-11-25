'use client'

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, X, Check, User, Sparkles, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function UploadProfilePicture({ userId, userName, onComplete }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Générer les initiales
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setSelectedImage(file);
    setError('');

    // Créer la preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedImage);
      formData.append('userId', userId);

      console.log('📤 Envoi de l\'image...');

      const response = await api.post('/auth/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Photo uploadée:', response.data);
      onComplete(response.data.user);
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setError(error.response?.data?.error || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    setUploading(true);
    try {
      console.log('⏭️ Photo ignorée');
      const response = await api.post('/auth/skip-profile-picture', { userId });
      console.log('✅ Réponse skip:', response.data);
      onComplete(response.data.user);
    } catch (error) {
      console.error('❌ Erreur skip:', error);
      setError(error.response?.data?.error || 'Erreur');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Photo de profil</h2>
          <p className="text-gray-600">Personnalisez votre compte</p>
        </div>
      </div>

      {/* Preview Zone */}
      <div className="flex justify-center">
        <div className="relative">
          {preview ? (
            // Image uploadée
            <div className="relative">
              <Image
                src={preview}
                alt="Preview"
                width={160}
                height={160}
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-500 shadow-xl"
                unoptimized
              />
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // Initiales par défaut
            <div className="w-40 h-40 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-blue-200">
              {getInitials(userName)}
            </div>
          )}

          {/* Bouton caméra flottant */}
          {!preview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-2 right-2 w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 border-2 border-gray-200 disabled:opacity-50"
            >
              <Camera className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {preview ? (
          // Bouton confirmer l'upload
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Upload en cours...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirmer cette photo</span>
              </>
            )}
          </button>
        ) : (
          // Bouton choisir une photo
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Upload className="w-5 h-5" />
            <span>Choisir une photo</span>
          </button>
        )}

        {/* Bouton Ignorer */}
        <button
          onClick={handleSkip}
          disabled={uploading}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-gray-300"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5" />
              <span>Continuer sans photo</span>
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          Vous pourrez la modifier plus tard
        </p>
        <p className="text-xs text-gray-500">
          Formats acceptés : JPG, PNG, WebP (5MB max)
        </p>
      </div>
    </div>
  );
}