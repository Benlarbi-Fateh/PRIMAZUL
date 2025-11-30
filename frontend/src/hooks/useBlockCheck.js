// hooks/useBlockCheck.js
import { useState, useEffect } from 'react';
import { useBlock } from '@/context/BlockContext';

const useBlockCheck = (contactId) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ 
    iBlocked: false, 
    blockedMe: false 
  });
  const [loading, setLoading] = useState(true);
  const { blockUpdates } = useBlock();

  useEffect(() => {
    if (!contactId) {
      setLoading(false);
      return;
    }

    const checkBlockStatus = async () => {
      try {
        setLoading(true);
        
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('❌ Aucun token trouvé');
          setLoading(false);
          return;
        }
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        
        console.log('🔍 Vérification blocage pour:', contactId);
        
        const response = await fetch(`${API_URL}/message-settings/check-blocked?targetUserId=${contactId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          console.warn('⚠️ Endpoint check-blocked non trouvé, utilisation de fallback');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📡 Réponse blocage:', data);
        
        if (data.success) {
          setBlockStatus({
            iBlocked: data.iBlocked,
            blockedMe: data.blockedMe
          });
          setIsBlocked(data.iBlocked || data.blockedMe);
        }
      } catch (error) {
        console.error('❌ Erreur vérification blocage:', error);
        setIsBlocked(false);
        setBlockStatus({ iBlocked: false, blockedMe: false });
      } finally {
        setLoading(false);
      }
    };

    checkBlockStatus();
  }, [contactId, blockUpdates]);

  // ✅ AJOUTER CETTE LIGNE : Calculer blockedStatus
  const blockedStatus = isBlocked || blockStatus?.iBlocked || blockStatus?.blockedMe;

  // ✅ RETOURNER blockedStatus
  return { isBlocked, blockStatus, blockedStatus, loading };
};

export default useBlockCheck;