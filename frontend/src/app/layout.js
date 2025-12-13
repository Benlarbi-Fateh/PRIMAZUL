import "./globals.css";
import { Providers } from "./providers";
import ClientLayout from "./profile/ClientLayout";
import SplashWrapper from "@/components/SplashScreen/SplashWrapper";
export const metadata = {
  title: "PrimaZul - Messagerie Moderne",
  description: "Application de messagerie instantanée moderne et sécurisée",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="h-full m-0 p-0 antialiased" suppressHydrationWarning>
        <Providers>
          <SplashWrapper>
            <ClientLayout>{children}</ClientLayout>
          </SplashWrapper>
        </Providers>
      </body>
    </html>
  );
}