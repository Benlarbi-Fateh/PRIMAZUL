'use client'

import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { updateProfile as updateProfileAPI } from '@/lib/api';

export const AuthProvider = ({ children }) => {
  // ✅ Initialiser directement avec une fonction (lazy initialization)
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error('❌ Erreur parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return null;
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  const login = (token, userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // ✅ NOUVELLE FONCTION : Mettre à jour le profil en utilisant l'API axios
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      // Utiliser la fonction d'API qui utilise axios
      const response = await updateProfileAPI(profileData);

      // La réponse d'axios est dans response.data
      const updatedUser = response.data.user;
      
      setUser(updatedUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('❌ Erreur updateProfile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};