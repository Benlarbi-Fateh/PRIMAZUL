import { AuthProvider } from "@/context/AuthProvider";
import { BlockProvider } from "@/context/BlockContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CallProvider } from "@/context/Callcontext";
import "./globals.css";

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
              <CallProvider> {children}</CallProvider>
            </ThemeProvider>
          </BlockProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
