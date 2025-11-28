// Utilitaires simples pour les permissions
export const requestMediaPermissions = async (audio = true, video = false) => {
  try {
    console.log('🔊 Demande permissions:', { audio, video });
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audio,
      video: video
    });
    
    // Arrêter le stream immédiatement (on veut juste la permission)
    stream.getTracks().forEach(track => track.stop());
    
    console.log('✅ Permissions accordées');
    return true;
  } catch (error) {
    console.error('❌ Permissions refusées:', error);
    return false;
  }
};

// Vérifier si les permissions sont déjà accordées
export const checkExistingPermissions = async () => {
  try {
    // Essayer d'accéder aux devices sans demander
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasAudio = devices.some(device => device.kind === 'audioinput' && device.deviceId !== '');
    const hasVideo = devices.some(device => device.kind === 'videoinput' && device.deviceId !== '');
    
    return { hasAudio, hasVideo };
  } catch (error) {
    return { hasAudio: false, hasVideo: false };
  }
};