import React, { useState } from "react";
import Splash from "./Splash";
import Login from "./Login"; // ta page login

function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);

  return (
    <>
      {!isSplashDone ? (
        <Splash onFinish={() => setIsSplashDone(true)} />
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
