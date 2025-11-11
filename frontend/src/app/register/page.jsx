'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Phone, Mail, User, Lock } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Validation côté client
  const validateForm = () => {
    const newErrors = {};

    // Username
    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (formData.username.length < 3) {
      newErrors.username = "Minimum 3 caractères";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Phone Number
    const phoneRegex = /^(\+213|0)[5-7][0-9]{8}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Le numéro de téléphone est requis";
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = "Numéro invalide (ex: 0555123456 ou +213555123456)";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage({ type: '', text: '' });

  if (!validateForm()) {
    setMessage({ type: 'error', text: 'Veuillez corriger les erreurs' });
    return;
  }

  setLoading(true);

  try {
    console.log('Envoi des données:', formData); // Debug

    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    console.log('Réponse du serveur:', data); // Debug

    if (response.ok && data.success) {
      // Stocker l'email pour la page de vérification
      localStorage.setItem('verificationEmail', data.email);
      console.log('Email stocké dans localStorage:', data.email); // Debug
      
      setMessage({ 
        type: 'success', 
        text: '✅ Code envoyé ! Vérifiez votre email...' 
      });
      
      setTimeout(() => {
        window.location.href = '/verify';
      }, 1500);
    } else {
      setMessage({ 
        type: 'error', 
        text: data.message || "Erreur lors de l'inscription" 
      });
    }
  } catch (error) {
    console.error('Erreur complète:', error);
    setMessage({ 
      type: 'error', 
      text: 'Erreur de connexion au serveur' 
    });
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Inscription</h1>
          <p className="text-gray-600 mt-2">Créez votre compte</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-800' 
              : 'bg-green-50 text-green-800'
          }`}>
            {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d&apos;utilisateur <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={20} />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre nom d'utilisateur"
              />
            </div>
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@exemple.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0555123456"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Min. 8 caractères avec majuscule, minuscule et chiffre
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600 pt-4">
            Déjà un compte ?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Se connecter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
