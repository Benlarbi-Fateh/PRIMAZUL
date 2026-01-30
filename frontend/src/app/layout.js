import { AuthProvider } from "@/context/AuthProvider";
import { BlockProvider } from "@/context/BlockContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CallProvider } from "@/context/Callcontext";
import "./globals.css";
import { NotificationProvider } from "@/context/NotificationContext";
import GlobalNotificationListener from "@/components/Notifications/GlobalNotificationListener";
import SocketInitializer from "@/components/Socket/SocketInitializer";
import { MuteProvider } from "@/context/MuteContext";
//////////// METADATA ET LAYOUT GLOBAL DE L'APPLICATION //////////////
export const metadata = {
  title: "PrimaZul - Messagerie Moderne",
  description: "Application de messagerie instantanée moderne et sécurisée",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="h-full m-0 p-0 antialiased" suppressHydrationWarning>
        <AuthProvider>
          <BlockProvider>
            <ThemeProvider>
              <NotificationProvider>
                <CallProvider>
                  {/* Initialisation du Socket et écoute globale des notifications*/}
                  <SocketInitializer>
                   <MuteProvider>
                     <GlobalNotificationListener />
                      {children}
                   </MuteProvider>
                  </SocketInitializer>
                </CallProvider>
              </NotificationProvider>
            </ThemeProvider>
          </BlockProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
