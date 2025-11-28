// lib/agora.js - Version corrigée pour Next.js

// 🔥 CORRECTION : Vérifier si on est côté client
let AgoraRTC;

if (typeof window !== 'undefined') {
  // Importer seulement côté client
  AgoraRTC = require('agora-rtc-sdk-ng').default;
}

export const AGORA_CONFIG = {
  appId: process.env.NEXT_PUBLIC_AGORA_APP_ID,
  codec: 'vp8',
  mode: 'rtc'
};

class AgoraService {
  constructor() {
    this.client = null;
    this.localTracks = {
      audioTrack: null,
      videoTrack: null
    };
    this.isJoined = false;
    this.channelName = null;
  }

  async initClient() {
    if (typeof window === 'undefined') {
      throw new Error('Agora ne peut être initialisé que côté client');
    }

    if (!AgoraRTC) {
      AgoraRTC = require('agora-rtc-sdk-ng').default;
    }

    this.client = AgoraRTC.createClient({ 
      mode: AGORA_CONFIG.mode, 
      codec: AGORA_CONFIG.codec 
    });
    return this.client;
  }

  async joinChannel(token, channelName, uid = null) {
    if (!this.client) await this.initClient();
    
    try {
      await this.client.join(AGORA_CONFIG.appId, channelName, token, uid);
      this.isJoined = true;
      this.channelName = channelName;
      console.log('✅ Rejoint le channel Agora:', channelName);
      return true;
    } catch (error) {
      console.error('❌ Erreur rejoindre channel:', error);
      throw error;
    }
  }

  async createLocalTracks(audio = true, video = false) {
    if (typeof window === 'undefined') {
      throw new Error('Création de tracks impossible côté serveur');
    }

    try {
      if (audio) {
        this.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      }
      if (video) {
        this.localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
      }
      return this.localTracks;
    } catch (error) {
      console.error('❌ Erreur création tracks:', error);
      throw error;
    }
  }

  async publishTracks() {
    const tracksToPublish = Object.values(this.localTracks).filter(track => track !== null);
    if (tracksToPublish.length > 0) {
      await this.client.publish(tracksToPublish);
      console.log('✅ Tracks publiés');
    }
  }

  async leaveChannel() {
    if (this.localTracks.audioTrack) {
      this.localTracks.audioTrack.close();
      this.localTracks.audioTrack = null;
    }
    if (this.localTracks.videoTrack) {
      this.localTracks.videoTrack.close();
      this.localTracks.videoTrack = null;
    }

    if (this.client && this.isJoined) {
      await this.client.leave();
      this.isJoined = false;
      this.channelName = null;
      console.log('✅ Channel quitté');
    }
  }

  setupChannelListeners(onUserJoined, onUserLeft, onUserPublished) {
    if (!this.client) return;

    this.client.on('user-joined', (user) => {
      console.log('👤 Utilisateur rejoint:', user);
      onUserJoined && onUserJoined(user);
    });

    this.client.on('user-left', (user) => {
      console.log('👤 Utilisateur parti:', user);
      onUserLeft && onUserLeft(user);
    });

    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);
      console.log('📡 Utilisateur publié:', user, mediaType);
      onUserPublished && onUserPublished(user, mediaType);
    });
  }
}

export const agoraService = new AgoraService();