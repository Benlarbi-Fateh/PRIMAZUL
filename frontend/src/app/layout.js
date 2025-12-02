import "./globals.css";
import ClientLayout from "./profile/ClientLayout";
import { AuthProvider } from "@/context/AuthProvider";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationsProvider } from "@/context/NotificationsContext";

// ✅ Métadonnées sans viewport ni themeColor
export const metadata = {
  title: "PrimaZul - Messagerie Moderne",
  description: "Application de messagerie instantanée moderne et sécurisée",
  icons: {
    icon: "/favicon.ico",
  },
};

// ✅ NOUVEAU : Export séparé pour viewport et themeColor
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1e40af",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full m-0 p-0 antialiased">
        {/* Le layout client est rendu APRES hydration → aucun mismatch */}
        <ClientLayout>
          <ThemeProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </ThemeProvider>
        </ClientLayout>
      </body>
    </html>
  );
}
