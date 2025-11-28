'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getSocket, onIncomingCall, onCallAccepted, onCallRejected, onCallEnded, onCallBusy, getCurrentOnlineUsers } from '@/services/socket';
import api from '@/lib/api';

export const useAgora = () => {
  const { user } = useContext(AuthContext);
  const [callStatus, setCallStatus] = useState('idle');
  const [currentCall, setCurrentCall] = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  // Références pour les éléments et ressources Agora
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const clientRef = useRef(null);
  const tracksRef = useRef([]);

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
      
      console.log('✅ Token reçu:', response.data.token ? 'OUI' : 'NON');
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur génération token:', error.response?.data || error.message);
      throw new Error('Impossible de générer le token: ' + (error.response?.data?.error || error.message));
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
        errorMessage = 'Microphone/caméra bloqués ! Clique sur le cadenas 🔒 et autorise l\'accès.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Aucun microphone/caméra détecté. Vérifie tes périphériques.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Impossible d\'accéder au microphone/caméra. Vérifie qu\'ils ne sont pas utilisés par une autre application.';
      }
      
      setPermissionError(errorMessage);
      alert(errorMessage);
      return false;
    }
  };

  // Initialiser Agora pour un appel
  const initAgoraForCall = async (channelName, callType) => {
    try {
      if (typeof window === 'undefined') return;
      console.log('🚀 Initialisation Agora pour:', channelName);
      
      // Importer Agora dynamiquement
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const tokenData = await generateToken(channelName);
      console.log('🔑 Token data:', tokenData);
      
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
        
        // Afficher la vidéo locale
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

      // Configurer les écouteurs pour les utilisateurs distants
      client.on('user-published', async (user, mediaType) => {
        console.log('👤 Utilisateur publié:', user.uid, mediaType);
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoRef.current) {
            remoteVideoTrack.play(remoteVideoRef.current);
          }
          console.log('📹 Vidéo distante affichée');
        }
        
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
          console.log('🔊 Audio distant activé');
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        console.log('👤 Utilisateur non publié:', user.uid, mediaType);
        if (mediaType === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.innerHTML = '';
        }
      });

      client.on('user-left', (user) => {
        console.log('👤 Utilisateur a quitté:', user.uid);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.innerHTML = '';
        }
        // Si l'autre utilisateur quitte, terminer l'appel
        endCall();
      });

      client.on('connection-state-change', (curState, prevState) => {
        console.log('🔗 État connexion:', prevState, '->', curState);
      });

    } catch (error) {
      console.error('❌ Erreur initialisation Agora:', error);
      // Nettoyer en cas d'erreur
      await cleanupAgora();
      throw error;
    }
  };

  // Nettoyer les ressources Agora
  const cleanupAgora = async () => {
    try {
      // Libérer les tracks
      if (tracksRef.current.length > 0) {
        tracksRef.current.forEach(track => {
          if (track.stop) track.stop();
          if (track.close) track.close();
        });
        tracksRef.current = [];
        console.log('🧹 Tracks Agora libérés');
      }

      // Quitter le channel
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
        console.log('🚪 Channel Agora quitté');
      }

      // Nettoyer les éléments vidéo
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

  // Démarrer un appel
  const startCall = async (receiverId, callType = 'audio') => {
    try {
      // Vérifier que le destinataire est en ligne
      const onlineUsers = getCurrentOnlineUsers();
      if (!onlineUsers.includes(receiverId)) {
        alert('❌ L\'utilisateur est hors ligne');
        return;
      }

      // Vérifier qu'aucun appel n'est en cours
      if (callStatus !== 'idle') {
        alert('❌ Un appel est déjà en cours');
        return;
      }

      // Tester les permissions AVANT tout
      const permissionsOK = await testPermissions(callType);
      if (!permissionsOK) return;

      setCallStatus('calling');
      setPermissionError(null);
      
      const channelName = `call_${user._id}_${receiverId}_${Date.now()}`;
      const caller = {
        id: user._id,
        name: user.name,
        profilePicture: user.profilePicture
      };

      // Émettre l'événement d'appel via Socket.io
      const socket = getSocket();
      if (socket) {
        socket.emit('call-initiate', {
          receiverId,
          callType,
          channelName,
          caller
        });
      }

      setCurrentCall({
        channelName,
        receiverId,
        callType,
        caller,
        isInitiator: true
      });

      console.log('📞 Appel initié:', { receiverId, callType, channelName });

    } catch (error) {
      console.error('❌ Erreur démarrage appel:', error);
      setCallStatus('idle');
      alert('Erreur lors du démarrage de l\'appel: ' + error.message);
    }
  };

  // Accepter un appel
  const acceptCall = async () => {
    if (!currentCall) return;

    try {
      const permissionsOK = await testPermissions(currentCall.callType);
      if (!permissionsOK) {
        rejectCall();
        return;
      }

      setCallStatus('in-call');
      
      const { channelName, callType } = currentCall;
      await initAgoraForCall(channelName, callType);

      // Notifier l'appelant que l'appel est accepté
      const socket = getSocket();
      if (socket) {
        socket.emit('call-accepted', {
          callerId: currentCall.caller.id,
          channelName,
          callType
        });
      }

      console.log('✅ Appel accepté');

    } catch (error) {
      console.error('❌ Erreur acceptation appel:', error);
      alert('Erreur lors de l\'acceptation de l\'appel: ' + error.message);
      endCall();
    }
  };

  // Rejeter un appel
  const rejectCall = () => {
    if (!currentCall) return;

    console.log('❌ Appel rejeté');

    const socket = getSocket();
    if (socket && currentCall.caller) {
      socket.emit('call-rejected', {
        callerId: currentCall.caller.id
      });
    }

    resetCallState();
  };

  // Terminer un appel
  const endCall = async () => {
    try {
      console.log('📞 Fin d\'appel demandée');
      
      await cleanupAgora();

      // Notifier l'autre utilisateur
      const socket = getSocket();
      if (socket && currentCall) {
        const receiverId = currentCall.isInitiator 
          ? currentCall.receiverId 
          : currentCall.caller.id;
          
        socket.emit('call-ended', {
          receiverId,
          channelName: currentCall.channelName
        });
      }

    } catch (error) {
      console.error('❌ Erreur fin d\'appel:', error);
    } finally {
      resetCallState();
    }
  };

  // Réinitialiser l'état d'appel
  const resetCallState = () => {
    setCallStatus('idle');
    setCurrentCall(null);
    setPermissionError(null);
    console.log('🔄 État d\'appel réinitialisé');
  };

  // Gérer les appels entrants
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Appel entrant reçu:', data);
      
      // Vérifier qu'aucun appel n'est en cours
      if (callStatus !== 'idle') {
        console.log('🚗 Déjà en appel, rejet automatique');
        socket.emit('call-busy', { callerId: data.caller.id });
        return;
      }

      setCurrentCall({
        ...data,
        isInitiator: false
      });
      setCallStatus('ringing');
    };

    const handleCallAccepted = async (data) => {
      console.log('✅ Appel accepté par le destinataire:', data);
      setCallStatus('in-call');
      
      // Rejoindre le channel Agora pour l'appelant
      if (currentCall?.isInitiator) {
        try {
          await initAgoraForCall(data.channelName, data.callType);
        } catch (error) {
          console.error('❌ Erreur rejoindre channel après acceptation:', error);
          endCall();
        }
      }
    };

    const handleCallRejected = () => {
      console.log('❌ Appel rejeté par le destinataire');
      alert('L\'appel a été rejeté');
      resetCallState();
    };

    const handleCallEnded = () => {
      console.log('📞 Appel terminé par l\'autre utilisateur');
      alert('L\'autre utilisateur a terminé l\'appel');
      resetCallState();
    };

    const handleCallBusy = () => {
      console.log('🚗 Utilisateur occupé');
      alert('L\'utilisateur est actuellement occupé');
      resetCallState();
    };

    // Écouter les événements d'appel
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-busy', handleCallBusy);

    // Nettoyer à la déconnexion du composant
    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-busy', handleCallBusy);
      
      // Nettoyer Agora si le composant est démonté pendant un appel
      if (callStatus !== 'idle') {
        cleanupAgora();
      }
    };
  }, [callStatus, currentCall]);

  // Nettoyer automatiquement à la déconnexion
  useEffect(() => {
    return () => {
      if (callStatus !== 'idle') {
        cleanupAgora();
      }
    };
  }, []);

  return {
    // États
    callStatus,
    currentCall,
    permissionError,
    
    // Références
    localVideoRef,
    remoteVideoRef,
    
    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
};