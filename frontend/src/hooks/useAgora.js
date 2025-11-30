'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getSocket } from '@/services/socket';
import api from '@/lib/api';

export const useAgora = () => {
  const { user } = useContext(AuthContext);
  const [callStatus, setCallStatus] = useState('idle');
  const [currentCall, setCurrentCall] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const callTimeoutRef = useRef(null);

  // Références pour Agora
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const clientRef = useRef(null);
  const tracksRef = useRef([]);

  // REF pour stocker currentCall
  const currentCallRef = useRef(null);

  // Synchroniser currentCallRef avec currentCall
  useEffect(() => {
    currentCallRef.current = currentCall;
    console.log('🔄 currentCallRef mis à jour:', currentCall);
  }, [currentCall]);

  // Générer un token Agora
  const generateToken = async (channelName, uid = null) => {
    try {
      console.log('🔑 Demande de token pour channel:', channelName);
      
      const response = await api.post('/calls/generate-token', {
        channelName,
        uid
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur génération token');
      }
      
      console.log('✅ Token reçu');
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur génération token:', error);
      throw new Error('Impossible de générer le token: ' + error.message);
    }
  };

  // Tester les permissions
  const testPermissions = async (callType) => {
    try {
      console.log('🎯 Test des permissions pour:', callType);
      setPermissionError(null);
      
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Permissions accordées');
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('❌ Permissions refusées:', error);
      
      let errorMessage = 'Erreur de permissions';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone/caméra bloqués ! Autorise l\'accès.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Aucun microphone/caméra détecté.';
      }
      
      setPermissionError(errorMessage);
      return false;
    }
  };

  // Initialiser Agora pour un appel
  const initAgoraForCall = async (channelName, callType) => {
    try {
      if (typeof window === 'undefined') return;
      console.log('🚀 INIT AGORA - Channel:', channelName);
      
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const tokenData = await generateToken(channelName);
      
      // Créer le client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;
      
      // Rejoindre le channel
      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID, 
        channelName, 
        tokenData.token, 
        null
      );

      console.log('✅ Channel Agora rejoint');

      // Créer et publier les tracks
      if (callType === 'video') {
        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        tracksRef.current = [microphoneTrack, cameraTrack];
        
        if (localVideoRef.current) {
          cameraTrack.play(localVideoRef.current);
        }
        
        await client.publish([microphoneTrack, cameraTrack]);
        console.log('🎥 Tracks vidéo publiés');
      } else {
        const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
        tracksRef.current = [microphoneTrack];
        await client.publish([microphoneTrack]);
        console.log('🎤 Track audio publié');
      }

      // Écouter les utilisateurs distants
      client.on('user-published', async (user, mediaType) => {
        console.log('👤 Utilisateur publié:', mediaType);
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoRef.current) {
            remoteVideoTrack.play(remoteVideoRef.current);
          }
        }
        
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });

      client.on('user-left', () => {
        console.log('👤 Utilisateur a quitté');
        endCall();
      });

    } catch (error) {
      console.error('❌ ERREUR INIT AGORA:', error);
      await cleanupAgora();
      throw error;
    }
  };

  // Nettoyer les ressources Agora
  const cleanupAgora = async () => {
    try {
      if (tracksRef.current.length > 0) {
        tracksRef.current.forEach(track => {
          track.stop();
          track.close();
        });
        tracksRef.current = [];
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage Agora:', error);
    }
  };

  // Réinitialiser l'état d'appel
  const resetCallState = () => {
    console.log('🔄 Réinitialisation état appel');
    setCallStatus('idle');
    setCurrentCall(null);
    currentCallRef.current = null;
    setPermissionError(null);
    if (callTimeoutRef.current) {
      console.log('⏰ Annulation du timeout en cours');
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };

  // Terminer un appel
  const endCall = async () => {
    try {
      console.log('📞 Fin d\'appel');
      await cleanupAgora();

      const socket = getSocket();
      const call = currentCallRef.current;
      
      if (socket && call) {
        const receiverId = call.isInitiator 
          ? call.receiverId 
          : (call.caller?.id || call.callerId);
          
        if (receiverId) {
          socket.emit('call-ended', {
            receiverId,
            channelName: call.channelName
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur fin d\'appel:', error);
    } finally {
      resetCallState();
    }
  };

  // Rejeter un appel
  const rejectCall = () => {
    console.log('❌ Appel rejeté');

    const socket = getSocket();
    const call = currentCallRef.current;
    
    if (socket && call && call.caller) {
      socket.emit('call-rejected', {
        callerId: call.caller.id
      });
    }

    resetCallState();
  };

  // Accepter un appel
  const acceptCall = async () => {
    const call = currentCallRef.current;
    
    if (!call) {
      console.log('❌ acceptCall: currentCall est null');
      return;
    }

    try {
      console.log('✅ DESTINATAIRE accepte l\'appel');
      console.log('📋 CurrentCall:', call);

      if (!call.caller) {
        console.error('❌ Caller manquant dans currentCall');
        alert('Erreur: Données d\'appel incomplètes');
        return;
      }

      const permissionsOK = await testPermissions(call.callType);
      if (!permissionsOK) {
        rejectCall();
        return;
      }

      setCallStatus('in-call');
      
      const { channelName, callType, caller } = call;
      await initAgoraForCall(channelName, callType);

      // Émettre l'acceptation
      const socket = getSocket();
      if (socket && caller.id) {
        console.log('📤 Envoi call-accepted à:', caller.id);
        socket.emit('call-accepted', {
          callerId: caller.id,
          channelName,
          callType
        });
      }

    } catch (error) {
      console.error('❌ Erreur acceptation appel:', error);
      endCall();
    }
  };

  // Démarrer un appel - 🔥 AVEC PRE-JOIN AGORA
  // Dans la fonction startCall, MODIFIER cette partie :
const startCall = async (receiverId, callType = 'audio') => {
  try {
    console.log('📞 ÉMETTEUR lance appel vers:', receiverId);
    
    if (callStatus !== 'idle') {
      alert('❌ Un appel est déjà en cours');
      return;
    }

    if (!user || !user.id) {
      console.error('❌ User non défini ou sans ID!', user);
      alert('Erreur: Utilisateur non connecté');
      return;
    }

    const permissionsOK = await testPermissions(callType);
    if (!permissionsOK) return;

    setCallStatus('calling');
    
    // Créer le channel name
    const timestamp = Date.now().toString().slice(-8);
    const callerId = user.id.slice(-8);
    const receiverIdShort = receiverId.slice(-8);
    const channelName = `c_${callerId}_${receiverIdShort}_${timestamp}`;
    
    console.log('📺 Channel créé:', channelName);
    
    const caller = {
      id: user.id,
      name: user.name || 'Utilisateur',
      profilePicture: user.profilePicture || ''
    };

    const newCall = {
      channelName,
      receiverId,
      callType,
      caller,
      isInitiator: true
    };
    
    setCurrentCall(newCall);
    currentCallRef.current = newCall;

    // 🔥 CORRECTION : Stocker receiverId dans une variable pour le timeout
    const targetReceiverId = receiverId;

    // 🔥 REJOINDRE AGORA IMMÉDIATEMENT
    console.log('🚀 ÉMETTEUR rejoint Agora immédiatement');
    await initAgoraForCall(channelName, callType);
    console.log('✅ ÉMETTEUR prêt dans le channel');

    // Émettre l'appel
    const socket = getSocket();
    if (socket) {
      socket.emit('call-initiate', {
        receiverId: targetReceiverId, // Utiliser la variable stockée
        callType,
        channelName,
        caller
      });
      console.log('✅ call-initiate émis');
    }

    // 🔥 CORRECTION : Timeout avec vérification robuste
    callTimeoutRef.current = setTimeout(() => {
      console.log('🔔 TIMEOUT DÉCLENCHÉ à', new Date().toISOString());
  console.log('📋 callStatus:', callStatus);
  console.log('📋 currentCallRef:', currentCallRef.current);
  console.log('📋 callTimeoutRef:', callTimeoutRef.current);
      
      // Vérifier si l'appel est toujours en attente
      if (currentCallRef.current && currentCallRef.current.isInitiator) {
        console.log('⏰ Appel expiré - Ne répond pas');
        
        setCallStatus('no-answer');
        
        // Notifier le backend
        if (socket) {
          socket.emit('call-expired', {
            receiverId: targetReceiverId, // Utiliser la variable stockée
            channelName,
            callerId: user.id
          });
        }
        
        // Fermer après 3 secondes
        setTimeout(() => {
          console.log('🔚 Fermeture automatique après timeout');
          endCall();
        }, 3000);
      } else {
        console.log('✅ Appel déjà terminé, timeout ignoré');
      }
    }, 60000); // 60 secondes

  } catch (error) {
    console.error('❌ Erreur démarrage appel:', error);
    await cleanupAgora();
    setCallStatus('idle');
  }
};
  // Gestion des événements Socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log('🔌 Configuration écouteurs socket');

    // Gérer appel entrant
    const handleIncomingCall = (data) => {
      console.log('📞 Appel entrant reçu:', data);
      
      if (callStatus !== 'idle') {
        console.log('🚗 Déjà en appel, rejet auto');
        socket.emit('call-busy', { callerId: data.caller?.id });
        return;
      }

      const newCall = {
        caller: data.caller,
        callType: data.callType,
        channelName: data.channelName,
        isInitiator: false
      };
      
      setCurrentCall(newCall);
      currentCallRef.current = newCall;
      setCallStatus('ringing');
      
      console.log('✅ Appel entrant configuré');
    };

    // Gérer appel accepté
    const handleCallAccepted = async (data) => {
      console.log('🎯 CALL-ACCEPTED REÇU');
      
      // Annuler timeout
      if (callTimeoutRef.current) {
        console.log('✅ Timeout annulé dans handleCallAccepted');
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
        console.log('✅ Timeout annulé');
      }

      setCallStatus('in-call');
      
      // L'émetteur est déjà dans Agora, juste changer le status
      console.log('✅ ÉMETTEUR déjà connecté à Agora, appel actif!');
    };

    const handleCallRejected = () => {
      console.log('❌ Appel rejeté');
      setCallStatus('rejected');
      setTimeout(() => {
        endCall();
      }, 1500);
    };

    const handleCallEnded = () => {
      console.log('📞 Appel terminé');
      cleanupAgora();
      resetCallState();
    };

    const handleCallBusy = () => {
      console.log('🚗 Utilisateur occupé');
      setCallStatus('busy');
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    // 🔥 NOUVEAU: Gérer expiration d'appel
    const handleCallExpired = () => {
      console.log('⏰ Appel expiré (reçu du serveur)');
      // Si c'est le destinataire (appel entrant), fermer directement
  if (currentCallRef.current && !currentCallRef.current.isInitiator) {
    console.log('🎯 Destinataire - Fermeture interface appel expiré');
    resetCallState();
  } 
  // Si c'est l'émetteur, changer le statut pour afficher "ne répond pas"
  else {
    console.log('📞 Émetteur - Changement statut vers "no-answer"');
    setCallStatus('no-answer');
    
    // Fermer après 3 secondes
    setTimeout(() => {
      endCall();
    }, 3000);
  }
};
    // Configurer écouteurs
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-busy', handleCallBusy);
    socket.on('call-expired', handleCallExpired);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-busy', handleCallBusy);
      socket.off('call-expired', handleCallExpired);
    };
  }, [callStatus]);

  return {
    callStatus,
    currentCall,
    permissionError,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
};