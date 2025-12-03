'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001';

const CreateStatus = ({ onClose, onStatusCreated }) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Veuillez ajouter du texte');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          content: content.trim()
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        onStatusCreated();
        onClose();
      } else {
        setError(result.error || `Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Créer un statut</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            disabled={isUploading}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setType('text'); setContent(''); setError(''); }}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                type === 'text' 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              disabled={isUploading}
            >
              📝 Texte
            </button>
          </div>

          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError('');
              }}
              placeholder="Quoi de neuf ? Partagez votre journée..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50"
              rows="4"
              maxLength="500"
              disabled={isUploading}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {content.length}/500 caractères
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={!content.trim() || isUploading}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publication...
                </>
              ) : (
                'Publier le statut'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            ⏰ Votre statut sera visible pendant 24 heures
          </p>
        </form>
      </div>
    </div>
  );
};

export default CreateStatus;