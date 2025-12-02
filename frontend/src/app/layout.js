import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";
import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="fr" className="h-full">
      <body className="h-full m-0 p-0 antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}