module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        scaleFade: {
          "0%": { transform: "scale(0.6)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        fadeInSlow: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },

        // --- Animations ajoutées ---
        fadeIn: { 
          "0%": { opacity: 0 }, 
          "100%": { opacity: 1 } 
        },

        scaleIn: { 
          "0%": { transform: "scale(0.85)" }, 
          "100%": { transform: "scale(1)" } 
        },

        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" }
        },
      
    fadeUp: {
      "0%": { opacity: 0, transform: "translateY(15px)" },
      "100%": { opacity: 1, transform: "translateY(0)" },
    }
  
      },

      animation: {
        scaleFade: "scaleFade 1.2s ease-out forwards",
        fadeInSlow: "fadeInSlow 1.8s ease-out forwards",

        // --- Animations ajoutées ---
        fadeIn: "fadeIn 0.25s ease-out",
        scaleIn: "scaleIn 0.25s ease-out",
        shake: "shake 0.3s ease-in-out",
        fadeUp: "fadeUp 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
