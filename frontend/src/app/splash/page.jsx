"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen overflow-hidden bg-gradient-animated">

      {/* Bulles flottantes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute w-6 h-6 bg-white/20 rounded-full animate-bounce-slow" style={{ top: '20%', left: '10%' }}></div>
        <div className="absolute w-4 h-4 bg-white/10 rounded-full animate-bounce-slower" style={{ top: '50%', left: '80%' }}></div>
        <div className="absolute w-5 h-5 bg-white/15 rounded-full animate-bounce-slow" style={{ top: '70%', left: '40%' }}></div>
      </div>

      {/* Logo animé */}
      <div className="animate-logoPop mb-6">
        <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl">
          <MessageCircle
            size={80}
            strokeWidth={2}
            className="text-white animate-logoBounce drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Titre */}
      <h1 className="text-white text-4xl font-bold tracking-wide animate-fadeInUp">
        PrimAzul
      </h1>

      {/* Slogan */}
      <p className="text-blue-100 text-lg mt-2 animate-fadeInUp delay-150">
        Making distance disappear
      </p>

      {/* Barre de chargement */}
      <div className="mt-8 w-16 h-1 bg-white/30 rounded-full overflow-hidden">
        <div className="h-full bg-white animate-loading"></div>
      </div>

      {/* Glow */}
      <div className="absolute inset-0 bg-blue-500/10 blur-[150px] animate-glow"></div>

      {/* CSS Animations */}
      <style jsx>{`
        /* Fond dégradé animé */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bg-gradient-animated {
          background: linear-gradient(270deg, #4f46e5, #3b82f6, #06b6d4);
          background-size: 600% 600%;
          animation: gradientShift 10s ease infinite;
        }

        /* Fade-in animations */
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Logo animations */
        @keyframes logoPop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes logoBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Glow animation */
        @keyframes glow {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }

        /* Bulles flottantes */
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        /* Barre de chargement */
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        /* Animation classes */
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out forwards; }
        .animate-logoPop { animation: logoPop 1.2s ease-out forwards; }
        .animate-logoBounce { animation: logoBounce 1.2s infinite ease-in-out; }
        .animate-glow { animation: glow 3s infinite ease-in-out; }
        .animate-bounce-slow { animation: bounceSlow 6s infinite ease-in-out; }
        .animate-bounce-slower { animation: bounceSlow 10s infinite ease-in-out; }
        .animate-loading { animation: loading 2.5s linear forwards; }
        .delay-150 { animation-delay: 0.15s; }
      `}</style>
    </div>
  );
}
