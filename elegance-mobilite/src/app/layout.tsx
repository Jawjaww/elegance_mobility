import { Plus_Jakarta_Sans } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap', // Améliore les performances de chargement
  preload: true,   // Explicitement preload
  fallback: ['system-ui', 'arial'] // Fallback amélioré
});

export const metadata = {
  title: "Vector Elegans",
  description: "Service de transport VTC de luxe",
};

/**
 * Layout racine minimal qui contient uniquement les providers
 * Les layouts spécifiques (client/admin) sont gérés dans leurs routes respectives
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${plusJakarta.variable} font-plus-jakarta`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
