"use client";

import { UserProvider } from '../context/UserContext';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
