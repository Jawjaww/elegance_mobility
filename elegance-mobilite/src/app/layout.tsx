import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth/useAuth";
import { cn } from "@/lib/utils";
import { MainHeader } from "@/components/layout/MainHeader";

// Imports pour MapLibre GL
import 'maplibre-gl/dist/maplibre-gl.css';
import "@/styles/map.css";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vector Elegans",
  description: "VTC de luxe sur Paris et région parisienne",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={cn(
          "bg-neutral-950 font-sans antialiased min-h-screen text-neutral-100",
          montserrat.className
        )}
      >
        <AuthProvider>
          {/* Ajout du MainHeader dans le layout principal */}
          <MainHeader />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
