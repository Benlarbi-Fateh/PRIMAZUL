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
        
        // Vérifier si on est côté client
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
  }, [contactId, blockUpdates]); // 🆕 AJOUTER blockUpdates aux dépendances

  // 🆕 AJOUTER CETTE FONCTION POUR L'ACTUALISATION AUTOMATIQUE
  useEffect(() => {
    if (!contactId) return;

    // Importer dynamiquement le service socket
    import('@/services/socket').then((socketModule) => {
      const socket = socketModule.getSocket();
      
      if (socket) {
        // Écouter les événements de blocage/déblocage
        socket.on('user-blocked', (data) => {
          if (data.blockedBy === contactId) {
            console.log('🔔 Vous avez été bloqué par cet utilisateur');
            setIsBlocked(true);
            setBlockStatus({ iBlocked: false, blockedMe: true });
          }
        });

        socket.on('user-unblocked', (data) => {
          if (data.unblockedBy === contactId) {
            console.log('🔔 Vous avez été débloqué par cet utilisateur');
            setIsBlocked(false);
            setBlockStatus({ iBlocked: false, blockedMe: false });
          }
        });

        return () => {
          socket.off('user-blocked');
          socket.off('user-unblocked');
        };
      }
    });
  }, [contactId]);

  // 🆕 VÉRIFICATION PÉRIODIQUE TOUTES LES 30 SECONDES
  useEffect(() => {
    if (!contactId) return;

    const checkBlockStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        
        const response = await fetch(`${API_URL}/message-settings/check-blocked?targetUserId=${contactId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        
        if (data.success) {
          setBlockStatus({
            iBlocked: data.iBlocked,
            blockedMe: data.blockedMe
          });
          setIsBlocked(data.iBlocked || data.blockedMe);
        }
      } catch (error) {
        console.error('❌ Erreur vérification périodique:', error);
      }
    };

    const interval = setInterval(() => {
      checkBlockStatus();
    }, 20000); // 30 secondes

    return () => clearInterval(interval);
  }, [contactId]);

  return { isBlocked, blockStatus, loading };
};

export default useBlockCheck;