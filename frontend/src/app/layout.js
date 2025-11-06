//pour que ton AuthContext soit accessible à toute ton application
import { AuthProvider } from "../context/authContext";
import Header from "../components/header"; // pour afficher le bouton

export default function Layout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Header />
          <header>PrimAzul</header>
          {children}
          <footer>© 2025 PrimAzul</footer>
        </AuthProvider>
      </body>
    </html>
  );
}
