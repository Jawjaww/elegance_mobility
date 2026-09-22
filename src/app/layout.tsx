import { Outfit } from "next/font/google";
import Script from "next/script";
import { ClientProviders } from "@/components/ClientProviders";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { STRIP_EXTENSION_DOM_ATTRS_SCRIPT } from "@/lib/strip-extension-dom-attrs";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Vector Elegans",
  description: "Service de transport VTC de luxe",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
  viewportFit: "cover" as const,
  /**
   * Android Chrome keeps the layout viewport at its full height when the keyboard opens
   * (its default, `resizes-visual`) and only shrinks the *visual* viewport. `dvh` is resolved
   * against the layout viewport, so it keeps reporting the old height: a dialog anchored to
   * the bottom of `dvh` stays exactly where the keyboard now covers it. Asking for
   * `resizes-content` makes the layout viewport shrink with the keyboard, which is what the
   * mobile dialog anchoring in `components/ui/dialog.tsx` relies on.
   */
  interactiveWidget: "resizes-content" as const,
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
      {/* `100dvh` rather than `min-h-screen` (100vh): on mobile, `100vh` is the height of the
          viewport *without* the address bar, so a 100vh body is always taller than what the
          user actually sees and every short page becomes scrollable by the height of the
          browser chrome — scrolling that reveals nothing. `dvh` follows the visible viewport. */}
      <body
        className={`${outfit.variable} font-outfit antialiased min-h-[100dvh]`}
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

        <ClientProviders>
          {/* Mounted here rather than in a portal layout so the landing page, the client
              portal and the driver portal all get a worker: Android will not install the
              app without one handling `fetch`, and the landing is where the install entry
              lives. */}
          <ServiceWorkerRegistrar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
