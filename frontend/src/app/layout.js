import './globals.css'
export default function Layout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header>PrimAzul</header>
        {children}
        <footer>© 2025 PrimAzul</footer>
      </body>
    </html>
  );
}
