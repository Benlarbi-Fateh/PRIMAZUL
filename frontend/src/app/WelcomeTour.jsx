import React, { useState, useEffect } from 'react';
import { Rocket, MousePointer2, Layout, CheckCircle2, ArrowRight, X } from 'lucide-react';

const WelcomeTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Vérifie si l'utilisateur a déjà vu le guide
    const hasSeenGuide = localStorage.getItem('hasSeenProjectGuide');
    if (!hasSeenGuide) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, []);

  const closeTour = () => {
    localStorage.setItem('hasSeenProjectGuide', 'true');
    setIsOpen(false);
  };

  const steps = [
    {
      title: "Organisez vos idées",
      desc: "Créez des projets et divisez-les en missions claires pour votre équipe.",
      icon: <Layout className="text-blue-500" size={40} />,
      color: "bg-blue-50"
    },
    {
      title: "Drag & Drop",
      desc: "Faites glisser vos tâches entre les colonnes pour mettre à jour leur statut en un éclair.",
      icon: <MousePointer2 className="text-purple-500" size={40} />,
      color: "bg-purple-50"
    },
    {
      title: "Collaborez en direct",
      desc: "Assignez des responsables et discutez dans l'espace de briefing dédié.",
      icon: <CheckCircle2 className="text-emerald-500" size={40} />,
      color: "bg-emerald-50"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative border border-white/20">
        
        {/* Bouton Fermer */}
        <button 
          onClick={closeTour}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-10 flex flex-col items-center text-center">
          {/* Icône Animée */}
          <div className={`w-24 h-24 ${steps[step].color} rounded-[32px] flex items-center justify-center mb-8 animate-bounce`}>
            {steps[step].icon}
          </div>

          {/* Texte */}
          <div className="space-y-3 min-h-[120px]">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {steps[step].title}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              {steps[step].desc}
            </p>
          </div>

          {/* Indicateurs de pas */}
          <div className="flex gap-2 my-8">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? "w-8 bg-blue-600" : "w-2 bg-slate-200"}`} 
              />
            ))}
          </div>

          {/* Bouton Action */}
          <button
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : closeTour()}
            className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {step < steps.length - 1 ? (
              <>Suivant <ArrowRight size={14} /></>
            ) : (
              <>C&apos;est parti ! <Rocket size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeTour;