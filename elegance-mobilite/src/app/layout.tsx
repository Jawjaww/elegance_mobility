"use client"

import "leaflet/dist/leaflet.css";
import "leaflet.awesome-markers/dist/leaflet.awesome-markers.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth/useAuth";
import { MainHeader } from "@/components/layout/MainHeader";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        <AuthProvider>
          <MainHeader />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
