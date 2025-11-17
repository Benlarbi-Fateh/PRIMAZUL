//pour que ton AuthContext soit accessible à toute ton application
import { AuthProvider } from "../context/authContext";

export default function Layout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <header>PrimAzul</header>
          {children}
          <footer>© 2025 PrimAzul</footer>
        </AuthProvider>
      </body>
    </html>
  );
}
//le AuthProvider rend user, login, logout accessible partout dans l'application
//c’est lui qui permet à toutes les pages (y compris celle de ma collègue “Profil”) d’accéder au contexte d’authentification (useAuth, donc login/logout/token).
