'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function CameraCapture({ onCapture, onCancel }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retakeFlag, setRetakeFlag] = useState(0); // ✅ Pour forcer le redémarrage

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ✅ CORRECTION : facingMode ET retakeFlag comme dépendances
  useEffect(() => {
    let isMounted = true;
    let loadTimeout;

    const startCamera = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);

        // Nettoyer l'ancien stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        console.log('🎥 Démarrage caméra - facingMode:', facingMode);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        console.log('✅ Stream caméra obtenu');
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;

        console.log('📹 Attachement du stream à la vidéo');
        videoRef.current.srcObject = stream;
        
        // Timeout de sécurité
        loadTimeout = setTimeout(() => {
          if (isMounted) {
            console.error('⏰ TIMEOUT');
            setError('La caméra met trop de temps');
            setLoading(false);
          }
        }, 10000);

        // Handler loadeddata  
        const handleLoadedData = () => {
          clearTimeout(loadTimeout);
          if (!isMounted) return;
          
          console.log('✅ loadeddata - Lecture vidéo');
          
          videoRef.current?.play()
            .then(() => {
              if (!isMounted) return;
              console.log('✅ Caméra prête !');
              setLoading(false);
            })
            .catch(err => {
              console.error('❌ Erreur play:', err);
              if (!isMounted) return;
              setError('Erreur lecture vidéo');
              setLoading(false);
            });
        };

        videoRef.current.addEventListener('loadeddata', handleLoadedData, { once: true });

      } catch (err) {
        clearTimeout(loadTimeout);
        console.error('❌ Erreur caméra:', err.name, err.message);
        
        if (!isMounted) return;
        
        let errorMsg = "Erreur caméra";
        
        if (err.name === 'NotAllowedError') {
          errorMsg = "Permission refusée";
        } else if (err.name === 'NotFoundError') {
          errorMsg = "Aucune caméra trouvée";
        } else if (err.name === 'NotReadableError') {
          errorMsg = "Caméra déjà utilisée";
        }
        
        setError(errorMsg);
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      console.log('🧹 Nettoyage');
      isMounted = false;
      clearTimeout(loadTimeout);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, retakeFlag]); // ✅ Ajout de retakeFlag pour forcer le redémarrage

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Éléments manquants");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Vidéo non prête");
      return;
    }

    try {
      console.log('📸 Capture photo');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Image capturée:', (blob.size / 1024).toFixed(0), 'KB');
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        }
      }, 'image/jpeg', 0.8);

    } catch (err) {
      console.error('❌ Erreur capture:', err);
      setError("Erreur capture");
    }
  };

  const handleSend = async () => {
    if (!capturedImage || !canvasRef.current) return;

    try {
      console.log('📤 Envoi photo...');
      
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          
          console.log('📤 Appel onCapture avec:', file.name);
          await onCapture(file);
          
          URL.revokeObjectURL(capturedImage);
          setCapturedImage(null);
        }
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('❌ Erreur envoi:', err);
      setError("Erreur envoi");
    }
  };

  const handleRetake = () => {
    console.log('🔄 Reprendre photo');
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setError(null);
    setRetakeFlag(prev => prev + 1); // ✅ Incrémenter pour forcer le redémarrage de useEffect
  };

  const toggleCamera = () => {
    console.log('🔄 Changement de caméra');
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCancel = () => {
    console.log('❌ Annulation');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-linear-to-b from-black/70 to-transparent p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={handleCancel}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {!capturedImage && !loading && !error && (
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <RotateCw className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Vue principale */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {/* Video toujours présent mais caché si nécessaire */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`max-w-full max-h-full object-cover ${
            loading || error || capturedImage ? 'hidden' : ''
          }`}
          style={{
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
          }}
        />

        {/* Overlays */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Chargement caméra...</p>
              <p className="text-white/60 text-sm mt-2">Veuillez patienter</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Erreur caméra</p>
              <p className="text-white/70 text-sm mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Recharger
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {capturedImage && (
          <Image
            src={capturedImage}
            alt="Photo capturée"
            fill
            className="object-contain"
            unoptimized
          />
        )}
      </div>

      {/* Footer */}
      {!loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-8">
          <div className="flex items-center justify-center gap-8">
            {capturedImage ? (
              <>
                <button
                  onClick={handleRetake}
                  className="p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  <RotateCw className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleSend}
                  className="p-6 rounded-full bg-blue-500 hover:bg-blue-600 transition-all shadow-2xl"
                >
                  <Check className="w-8 h-8 text-white" />
                </button>
              </>
            ) : (
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all shadow-2xl flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}