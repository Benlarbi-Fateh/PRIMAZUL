"use client";

import { AuthProvider } from "@/context/AuthProvider";
import { BlockProvider } from "@/context/BlockContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CallProvider } from "@/context/Callcontext";
import SplashWrapper from "@/components/SplashScreen/SplashWrapper";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <BlockProvider>
        <ThemeProvider>
          <CallProvider>
            <SplashWrapper>
              {children}
            </SplashWrapper>
          </CallProvider>
        </ThemeProvider>
      </BlockProvider>
    </AuthProvider>
  );
}
