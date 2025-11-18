import { AuthProvider } from '@/context/AuthProvider';
import './globals.css';

export const metadata = {
  title: 'PrimaZul - Messagerie Moderne',
  description: 'Application de messagerie instantanée moderne et sécurisée',
  icons: {
    icon: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#1e40af',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="h-full m-0 p-0 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}