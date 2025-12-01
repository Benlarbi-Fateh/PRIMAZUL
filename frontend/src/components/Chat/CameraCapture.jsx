'use client';

import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Camera, X, RotateCw, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function CameraCapture({ onCapture, onCancel }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      stopCamera();

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // ✅ CORRECTION: Attendre que la vidéo soit vraiment prête
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video ref perdu'));
            return;
          }

          const video = videoRef.current;
          
          // Timeout de sécurité
          const timeout = setTimeout(() => {
            reject(new Error('Timeout caméra'));
          }, 10000);

          const handleCanPlay = async () => {
            clearTimeout(timeout);
            try {
              await video.play();
              
              // Vérifier que la vidéo a des dimensions valides
              const checkVideo = () => {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                  setIsCameraActive(true);
                  setLoading(false);
                  resolve();
                } else {
                  // Réessayer après 100ms
                  setTimeout(checkVideo, 100);
                }
              };
              
              checkVideo();
            } catch (err) {
              clearTimeout(timeout);
              reject(err);
            }
          };

          video.addEventListener('canplay', handleCanPlay, { once: true });
        });
      }
    } catch (err) {
      console.error('Erreur accès caméra:', err);
      let errorMessage = "Impossible d'accéder à la caméra. ";

      if (err.name === 'NotAllowedError') {
        errorMessage += "Veuillez autoriser l'accès à la caméra.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'Aucune caméra trouvée.';
      } else if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
        errorMessage += "Contexte non sécurisé (utilisez HTTPS).";
      } else {
        errorMessage += err.message || 'Erreur technique.';
      }

      setError(errorMessage);
      setLoading(false);
      setIsCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 0);
    
    return () => {
      clearTimeout(timer);
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState < 2 || video.videoWidth === 0) {
      setError("La caméra n'est pas prête. Veuillez réessayer.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg');
  }, [facingMode, stopCamera]);

  const handleRetake = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setError(null);
    startCamera();
  }, [capturedImage, startCamera]);

  const handleSend = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      await onCapture(file);
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
      setCapturedImage(null);
      stopCamera();
    }, 'image/jpeg');
  }, [capturedImage, onCapture, stopCamera]);

  const toggleCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    stopCamera();
    setLoading(true);
    
    setTimeout(async () => {
      try {
        const constraints = {
          video: {
            facingMode: newFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          setTimeout(() => {
            setIsCameraActive(true);
            setLoading(false);
          }, 500);
        }
      } catch (err) {
        console.error('Erreur changement caméra:', err);
        setError("Impossible de changer de caméra");
        setLoading(false);
      }
    }, 100);
  }, [facingMode, stopCamera]);

  const handleCancel = useCallback(() => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    onCancel();
  }, [capturedImage, onCancel, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 bg-linear-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {!capturedImage && !loading && isCameraActive && (
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <RotateCw className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        {loading ? (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Démarrage de la caméra...</p>
            <p className="text-white/60 text-sm mt-2">Cela peut prendre quelques secondes</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 max-w-md">
            <Camera className="w-16 h-16 text-white mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Erreur caméra</p>
            <p className="text-white/70 text-sm mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium"
            >
              Réessayer
            </button>
          </div>
        ) : capturedImage ? (
          <Image
            src={capturedImage}
            alt="Photo capturée"
            fill
            className="object-contain"
            unoptimized
          />
        ) : isCameraActive ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-cover"
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />
            <div className="absolute inset-0 border-2 border-white/20 rounded-lg pointer-events-none" />
          </div>
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />

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
            ) : isCameraActive ? (
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all shadow-2xl flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}