import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Elegance Mobilité",
  description: "Service de transport VTC de luxe",
};

/**
 * Root layout component that provides authentication context
 * while preserving the original styling and structure
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          {/* Preserve existing layout structure */}
          <div className="min-h-screen flex flex-col">
            {/* Main content wrapped with auth provider */}
            <main className="flex-grow">{children}</main>

            {/* Keep existing footer */}
            <footer className="bg-gray-100 py-4">
              <div className="container mx-auto px-4 text-center text-gray-600">
                <p>
                  &copy; {new Date().getFullYear()} Elegance Mobilité. Tous
                  droits réservés.
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
