import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { ClientProviders } from "@/components/ClientProviders";
import { STRIP_EXTENSION_DOM_ATTRS_SCRIPT } from "@/lib/strip-extension-dom-attrs";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata = {
  title: "Vector Elegans",
  description: "Service de transport VTC de luxe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vector Elegans",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};

/**
 * Layout racine (Tauri-Ready)
 * Protection client-side des routes gérée individuellement par les pages
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-plus-jakarta min-h-screen`}
        suppressHydrationWarning
      >
        <Script
          id="strip-extension-dom-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_DOM_ATTRS_SCRIPT }}
        />
        {/* Fixed decorative background behind all content to avoid rendering issues
            with backdrop-filter / stacking contexts. It's pointer-events-none so
            it never interferes with interaction. */}
        <div aria-hidden className="fixed inset-0 pointer-events-none -z-50">
          <div className="bg-elegant-gradient w-full h-full" />
        </div>

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
