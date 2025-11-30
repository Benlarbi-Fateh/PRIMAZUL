import React, { useEffect } from "react";
import "./splash.css"; // importe le style
export const metadata = { layout: false };

const Splash = ({ onFinish }) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 100000); // durée de l'animation

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-container">
      <img
        src="/logoPRIMAZUL.png"    
        alt="PrimAzul Logo"
        className="splash-logo"
      />

      <h1 className="splash-title">PrimAzul</h1>

      <p className="splash-slogan">Making distance disappear</p>
    </div>
  );
};

export default Splash;
