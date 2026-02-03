/**
 * Hook usePWA
 * Gestion de l'installation et du Service Worker
 */
"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false); // SSR-safe: false
  const [isStandalone, setIsStandalone] = useState(false); // SSR-safe: false
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Détecter si déjà installée (standalone) - client only
  useEffect(() => {
    // iOS Safari
    const isIOSStandalone =
      typeof window !== "undefined" &&
      (window.navigator as any).standalone === true;
    // Android Chrome
    const isAndroidStandalone =
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(isIOSStandalone || isAndroidStandalone);
    setIsInstalled(isIOSStandalone || isAndroidStandalone);

    if (typeof window !== "undefined") {
      // Écouter l'événement beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      // Détecter installation
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);
      return () => {
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt,
        );
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  // Enregistrer le Service Worker - client only
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] SW registered:", registration.scope);
        setSwRegistration(registration);
      })
      .catch((err) => {
        console.error("[PWA] SW registration failed:", err);
      });

    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("[PWA] Message from SW:", event.data);
    });
  }, []);

  // Proposer l'installation
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  // Demander permission notifications
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window))
      return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }, []);

  // Envoyer message au SW
  const sendMessageToSW = useCallback((message: any) => {
    if (typeof window !== "undefined" && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }, []);

  return {
    isInstalled,
    isStandalone,
    canInstall: !!deferredPrompt,
    install,
    requestNotificationPermission,
    swRegistration,
    sendMessageToSW,
  };
}
