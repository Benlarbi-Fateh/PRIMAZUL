// hooks/useBlockCheck.js
'use client'
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function useBlockCheck(targetUserId) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    iBlocked: false,
    blockedMe: false
  });
  const [loading, setLoading] = useState(true); // ✅ true par défaut
  const [error, setError] = useState(null);

  // ✅ Fonction de vérification extraite pour pouvoir la réutiliser
  const checkBlockStatus = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Vérification blocage pour:', targetUserId);
      
      const response = await api.get('/message-settings/check-blocked', {
        params: { targetUserId }
      });

      if (response.data && response.data.success) {
        const { iBlocked, blockedMe, isBlocked: blocked } = response.data;
        
        console.log('✅ Statut blocage reçu:', { iBlocked, blockedMe, blocked });
        
        setBlockStatus({ iBlocked, blockedMe });
        setIsBlocked(blocked);
      }
    } catch (err) {
      console.error('❌ Erreur vérification blocage:', err);
      setError(err.message);
      
      // ✅ Valeurs par défaut en cas d'erreur
      setIsBlocked(false);
      setBlockStatus({ iBlocked: false, blockedMe: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBlockStatus();

    // ✅ Écouter les événements de changement
    const handleBlockChange = () => {
      console.log('🔄 Événement block-status-changed détecté');
      checkBlockStatus();
    };

    window.addEventListener('block-status-changed', handleBlockChange);

    return () => {
      window.removeEventListener('block-status-changed', handleBlockChange);
    };
  }, [targetUserId]);

  // ✅ Retourner aussi la fonction de refresh
  return { 
    isBlocked, 
    blockStatus, 
    loading, 
    error,
    refresh: checkBlockStatus // ✅ Permet de forcer un refresh
  };
}