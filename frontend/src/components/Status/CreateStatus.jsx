'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Video, Image, FileText, X, Upload, Clock, Plus } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001';

const CreateStatus = ({ onClose, onStatusCreated }) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const videoRef = useRef();
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📁 Fichier sélectionné:', {
      name: file.name,
      type: file.type,
      size: file.size,
      selectedType: type
    });

    if (type === 'video') {
      // Validation vidéo
      if (!file.type.startsWith('video/')) {
        setError('Veuillez sélectionner un fichier vidéo (MP4, WebM, MOV, etc.)');
        return;
      }
      
      // Vérifier les types spécifiques
      const allowedVideoTypes = [
        'video/mp4', 
        'video/webm', 
        'video/ogg', 
        'video/quicktime',
        'video/x-msvideo'
      ];
      
      if (!allowedVideoTypes.includes(file.type)) {
        setError(`Format vidéo non supporté: ${file.type}. Formats acceptés: MP4, WebM, OGG, MOV, AVI`);
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setError('La vidéo est trop volumineuse (max 50MB)');
        return;
      }
      
      setVideoFile(file);
      setImageFile(null);
      
      // Créer URL de prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      console.log('✅ Vidéo acceptée:', file.name);
    } else if (type === 'image') {
      // Validation image
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Vérifier les types spécifiques
      const allowedImageTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedImageTypes.includes(file.type)) {
        setError(`Format image non supporté: ${file.type}. Formats acceptés: JPG, PNG, GIF, WebP`);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('L\'image est trop volumineuse (max 10MB)');
        return;
      }
      
      setImageFile(file);
      setVideoFile(null);
      
      // Créer URL de prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      console.log('✅ Image acceptée:', file.name);
    }
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📤 Soumission statut:', { type, content, videoFile, imageFile });
    
    // Validation selon le type
    if (type === 'text' && !content.trim()) {
      setError('Veuillez ajouter du texte');
      return;
    }
    
    if (type === 'video' && !videoFile) {
      setError('Veuillez sélectionner une vidéo');
      return;
    }
    
    if (type === 'image' && !imageFile) {
      setError('Veuillez sélectionner une image');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté');
        return;
      }
      
      // Utiliser FormData pour envoyer des fichiers
      const formData = new FormData();
      formData.append('type', type);
      
      // Ajouter le contenu (texte pour type text, légende pour image/video)
      if (content.trim()) {
        formData.append('content', content.trim());
      } else if (type === 'text') {
        setError('Veuillez ajouter du texte');
        return;
      }
      
      // Ajouter le fichier approprié
      if (type === 'video' && videoFile) {
        formData.append('video', videoFile);
      } else if (type === 'image' && imageFile) {
        formData.append('image', imageFile);
      }

      console.log('📤 Envoi FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.type}, ${value.size} bytes)` : value);
      }

      const response = await fetch(`${API_BASE_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NE PAS mettre 'Content-Type': FormData le fera automatiquement avec boundary
        },
        body: formData
      });

      const result = await response.json();
      console.log('📥 Réponse serveur:', { status: response.status, result });
      
      if (response.ok) {
        // Nettoyer les previews
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        onStatusCreated();
        onClose();
      } else {
        setError(result.error || result.details || `Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      setError('Erreur de connexion au serveur: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const resetFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setVideoFile(null);
    setImageFile(null);
    setPreviewUrl('');
    setError('');
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setError('');
    resetFile();
    
    // Réinitialiser le contenu seulement pour le texte
    if (newType === 'text') {
      setContent('');
    }
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Créer un statut</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          {/* Sélection du type */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleTypeChange('text')}
              className={`flex-1 py-3 px-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                type === 'text' 
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-200 border border-transparent'
              }`}
              disabled={isUploading}
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Texte</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('image')}
              className={`flex-1 py-3 px-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                type === 'image' 
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-200 border border-transparent'
              }`}
              disabled={isUploading}
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('video')}
              className={`flex-1 py-3 px-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                type === 'video' 
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-200 border border-transparent'
              }`}
              disabled={isUploading}
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">Vidéo</span>
            </button>
          </div>

          {/* Zone de contenu */}
          <div className="mb-4">
            {type === 'text' ? (
              <>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setError('');
                  }}
                  placeholder="Quoi de neuf ? Partagez votre journée..."
                  className="w-full p-4 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  rows="4"
                  maxLength="500"
                  disabled={isUploading}
                />
                <div className="text-right text-sm text-slate-500 mt-1">
                  {content.length}/500 caractères
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {/* Zone de prévisualisation/téléchargement */}
                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    {type === 'video' ? (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          src={previewUrl}
                          className="w-full h-48 object-cover bg-black"
                          controls
                          onLoadedMetadata={(e) => {
                            console.log('📹 Métadonnées vidéo:', {
                              duration: e.target.duration,
                              videoWidth: e.target.videoWidth,
                              videoHeight: e.target.videoHeight
                            });
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {videoRef.current?.duration 
                            ? `${Math.floor(videoRef.current.duration)}s` 
                            : 'Vidéo'
                          }
                        </div>
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Aperçu"
                        className="w-full h-48 object-cover"
                      />
                    )}
                    
                    {/* Overlay d'informations */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <div className="flex justify-between items-center text-white">
                        <div>
                          <p className="font-medium text-sm truncate">
                            {type === 'video' ? videoFile?.name : imageFile?.name}
                          </p>
                          <p className="text-xs opacity-80">
                            {formatFileSize(type === 'video' ? videoFile?.size : imageFile?.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={resetFile}
                          className="p-1 hover:bg-white/20 rounded-full transition-colors"
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectFile}
                    className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
                    disabled={isUploading}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="text-slate-600 font-medium">
                        {type === 'video' ? 'Sélectionner une vidéo' : 'Sélectionner une photo'}
                      </span>
                      <span className="text-sm text-slate-500">
                        {type === 'video' 
                          ? 'MP4, WebM, OGG, MOV, AVI (max 50MB)' 
                          : 'JPG, PNG, GIF, WebP (max 10MB)'
                        }
                      </span>
                    </div>
                  </button>
                )}

                {/* Input fichier caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={type === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />

                {/* Légende pour image/vidéo */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Ajouter une légende (optionnel) pour votre ${type === 'video' ? 'vidéo' : 'photo'}...`}
                  className="w-full p-3 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
                  rows="2"
                  maxLength="200"
                  disabled={isUploading}
                />
              </div>
            )}
          </div>

          {/* Info durée */}
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Votre statut sera visible pendant 24 heures</span>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 font-medium"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={
                isUploading || 
                (type === 'text' && !content.trim()) ||
                (type === 'video' && !videoFile) ||
                (type === 'image' && !imageFile)
              }
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publication...
                </>
              ) : (
                'Publier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStatus;