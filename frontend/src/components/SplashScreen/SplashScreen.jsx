"use client";
import Image from "next/image";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center 
      bg-[#1e40af] bg-gradient-to-b from-[#1e40af] to-[#0a1c4a]
      overflow-hidden">

      {/* ANIMATION ENSEMBLE */}
      <div className="flex flex-col items-center animate-logoEnter">

        {/* LOGO */}
        <div className="relative w-40 h-40 animate-logoZoom">
          <Image
            src="/logoPRIMAZUL.png"
            alt="PrimAzul Logo"
            fill
            className="object-contain drop-shadow-[0_0_25px_rgba(65,132,255,0.6)]"
          />
        </div>

        {/* TITRE */}
        <h1
          className="mt-6 text-5xl font-extrabold text-white tracking-wide opacity-0 animate-titleShow"
        >
          Prim<span className="text-blue-300">Azul</span>
        </h1>

        {/* SLOGAN */}
        <p className="mt-2 text-white/70 tracking-widest opacity-0 animate-sloganShow">
          making distance disappear
        </p>
      </div>

      {/* ANIMATIONS */}
      <style jsx>{`
        /* Logo principal qui arrive avec zoom + rotation légère */
        @keyframes logoZoomKey {
          0% {
            transform: scale(0.2) rotateX(25deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.1) rotateX(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotateX(0deg);
            opacity: 1;
          }
        }
        .animate-logoZoom {
          animation: logoZoomKey 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Titre PrimAzul style "cinematic anim" */
        @keyframes titleShowKey {
          0% {
            opacity: 0;
            letter-spacing: -3px;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            letter-spacing: 3px;
            transform: translateY(0);
          }
        }
        .animate-titleShow {
          animation: titleShowKey 1.2s ease forwards;
          animation-delay: 0.5s;
        }

        /* Slogan douce apparition */
        @keyframes sloganShowKey {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }
        .animate-sloganShow {
          animation: sloganShowKey 1s ease forwards;
          animation-delay: 1s;
        }

        /* Conteneur pour l'effet "tout vient du centre" */
        @keyframes logoEnterKey {
          0% {
            filter: blur(10px);
          }
          100% {
            filter: blur(0);
          }
        }
        .animate-logoEnter {
          animation: logoEnterKey 1.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}