import { AuthProvider } from '@/context/AuthProvider';
import './globals.css';

export const metadata = {
  title: 'WhatsApp Clone',
  description: 'Messagerie instantanée',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}