"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { setupCardEffects } from '../lib/cardEffects';
import { useEffect } from 'react';
import { MapProvider } from '../components/MapProvider';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <MapProvider>
          {children}
        </MapProvider>
      </body>
    </html>
  );
}
