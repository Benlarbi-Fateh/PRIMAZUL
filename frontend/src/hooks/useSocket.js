'use client'

import { useEffect, useContext, useRef } from 'react';
import { initSocket } from '@/services/socket';
import { AuthContext } from '@/context/AuthContext';

export const useSocket = () => {
  const { user } = useContext(AuthContext);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (user && !isInitialized.current) {
      const userId = user._id || user.id;
      console.log('🔌 Initialisation du socket pour user:', userId);
      
      // 🆕 initSocket gère maintenant tout automatiquement
      initSocket(userId);
      isInitialized.current = true;
    }

    // 🆕 Cleanup si l'utilisateur se déconnecte
    return () => {
      if (!user && isInitialized.current) {
        console.log('🧹 User déconnecté, reset du socket');
        isInitialized.current = false;
      }
    };
  }, [user]);
};