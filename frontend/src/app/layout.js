
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "PrimaZul - Messagerie Moderne",
  description: "Application de messagerie instantanée moderne et sécurisée",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full m-0 p-0 antialiased">
        {/* Le layout client est rendu APRES hydration → aucun mismatch */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
