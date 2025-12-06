'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export default function useBlockCheck(targetUserId) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    iBlocked: false,
    blockedMe: false,
    isBlocked: false
  });
  const [loading, setLoading] = useState(true);
  const lastTargetRef = useRef(null);
  const [error, setError] = useState(null);
  
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);

const checkBlockStatus = async (forceCheck = false) => {
    if (!targetUserId) {
      setBlockStatus({ iBlocked: false, blockedMe: false, isBlocked: false });
      setIsBlocked(false);
      setLoading(false);
      return;
    }
if (isCheckingRef.current && !forceCheck) {
  console.log('⏳ Vérification déjà en cours');
  return;
}
    
    try {
      isCheckingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🔍 Vérification blocage pour:', targetUserId);
      
      const response = await api.get(`/message-settings/check-blocked/${targetUserId}`, {
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});
      
      if (!mountedRef.current) return;

      if (response.data?.success) {
        const { iBlocked, blockedMe, isBlocked: blocked } = response.data;
        
        console.log('✅ Statut reçu:', { iBlocked, blockedMe, blocked });
        
        const newStatus = { 
          iBlocked: Boolean(iBlocked), 
          blockedMe: Boolean(blockedMe), 
          isBlocked: Boolean(blocked || iBlocked || blockedMe)
        };
        
        setBlockStatus(newStatus);
        setIsBlocked(newStatus.isBlocked);
      }
    } catch (err) {
      console.error('❌ Erreur vérification blocage:', err);
      
      if (!mountedRef.current) return;
      
      if (err.response?.status === 404) {
        setError('Route non trouvée');
      } else if (err.code === 'ECONNABORTED') {
        setError('Délai dépassé');
      } else {
        setError(err.message || 'Erreur inconnue');
      }
      
      setBlockStatus({ iBlocked: false, blockedMe: false, isBlocked: false });
      setIsBlocked(false);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isCheckingRef.current = false;
    }
  };

 useEffect(() => {
  mountedRef.current = true;
  
  // Vérifier seulement si le targetUserId a changé
  if (targetUserId !== lastTargetRef.current) {
    console.log('🔄 Nouvelle cible:', targetUserId);
    lastTargetRef.current = targetUserId;
    checkBlockStatus(true);
  }

  const handleBlockChange = (event) => {
    console.log('🔄 Événement block-status-changed reçu', event?.detail);
    setTimeout(() => checkBlockStatus(true), 200);
  };

  window.addEventListener('block-status-changed', handleBlockChange);

  return () => {
    mountedRef.current = false;
    window.removeEventListener('block-status-changed', handleBlockChange);
  };
}, [targetUserId]);

  return { 
   isBlocked: Boolean(isBlocked),
    blockStatus: blockStatus || { iBlocked: false, blockedMe: false, isBlocked: false },
    loading, 
    error,
   refresh: () => checkBlockStatus(true)
  };
}