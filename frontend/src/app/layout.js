//pour que ton AuthContext soit accessible à toute ton application
import { AuthProvider } from "../context/authContext";
import LogoutButton from "../components/LogoutButton"; // pour afficher le bouton

export default function Layout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <header>
            PrimAzul
            <LogoutButton />
          </header>
          {children}
          <footer>© 2025 PrimAzul</footer>
        </AuthProvider>
      </body>
    </html>
  );
}
