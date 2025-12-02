'use client'
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export default function useBlockCheck(targetUserId) {
  // ✅ INITIALISATION COMPLÈTE pour éviter undefined
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    iBlocked: false,
    blockedMe: false,
    isBlocked: false
  });
  const [loading, setLoading] = useState(false); // false au début
  const [error, setError] = useState(null);
  
  const isCheckingRef = useRef(false);

  const checkBlockStatus = async () => {
    if (!targetUserId) {
      // ✅ Valeurs par défaut si pas d'ID
      setBlockStatus({ iBlocked: false, blockedMe: false, isBlocked: false });
      setIsBlocked(false);
      setLoading(false);
      return;
    }

    if (isCheckingRef.current) return;
    
    try {
      isCheckingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🔍 Vérification blocage pour:', targetUserId);
      
      const response = await api.get(`/message-settings/check-blocked/${targetUserId}`, {
  timeout: 5000
});
      if (response.data?.success) {
        const { iBlocked, blockedMe, isBlocked: blocked } = response.data;
        
        console.log('✅ Statut blocage reçu:', { iBlocked, blockedMe, blocked });
        
        const newStatus = { 
          iBlocked: !!iBlocked, 
          blockedMe: !!blockedMe, 
          isBlocked: !!blocked 
        };
        
        setBlockStatus(newStatus);
        setIsBlocked(!!blocked);
      }
    } catch (err) {
      console.error('❌ Erreur vérification blocage:', err);
      
      // ✅ GESTION DES ERREURS SPÉCIFIQUES
      if (err.response?.status === 404) {
        console.warn('⚠️ Route /check-blocked non trouvée (404)');
        setError('Fonction de blocage non disponible');
      } else if (err.code === 'ECONNABORTED') {
        console.warn('⏱️ Timeout - Le serveur ne répond pas');
        setError('Délai dépassé');
      } else {
        setError(err.message || 'Erreur inconnue');
      }
      
      // ✅ TOUJOURS définir des valeurs par défaut
      setBlockStatus({ iBlocked: false, blockedMe: false, isBlocked: false });
      setIsBlocked(false);
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    checkBlockStatus();

    const handleBlockChange = () => {
      console.log('🔄 Événement block-status-changed détecté');
      checkBlockStatus();
    };

    window.addEventListener('block-status-changed', handleBlockChange);

    return () => {
      window.removeEventListener('block-status-changed', handleBlockChange);
    };
  }, [targetUserId]);

  // ✅ RETOURNER LES VALEURS SÉCURISÉES
  const safeBlockStatus = blockStatus || { iBlocked: false, blockedMe: false, isBlocked: false };
  const safeIsBlocked = isBlocked || false;

  return { 
    isBlocked: safeIsBlocked,
    blockStatus: safeBlockStatus,
    loading, 
    error,
    refresh: checkBlockStatus
  };
}