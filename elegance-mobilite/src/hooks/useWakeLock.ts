/**
 * Hook useWakeLock
 * Empêche l'écran de s'éteindre pendant que le chauffeur travaille
 */
"use client";

import { useEffect, useRef, useCallback } from "react";

export function useWakeLock(enabled: boolean) {
  // Use `any` to avoid conflicts with differing lib.dom definitions across TS versions
  const wakeLock = useRef<any | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !(navigator as any).wakeLock) {
      console.log("[WakeLock] API not supported");
      return;
    }

    try {
      // Use dynamic access to avoid TS augmentation conflicts
      wakeLock.current = await (navigator as any).wakeLock.request("screen");
      console.log("[WakeLock] Acquired");

      if (
        wakeLock.current &&
        typeof wakeLock.current.addEventListener === "function"
      ) {
        wakeLock.current.addEventListener("release", () => {
          console.log("[WakeLock] Released");
        });
      } else if (wakeLock.current) {
        // Fallback to onrelease if available
        try {
          (wakeLock.current as any).onrelease = () =>
            console.log("[WakeLock] Released");
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error("[WakeLock] Failed to acquire:", err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock.current && !wakeLock.current.released) {
      try {
        await wakeLock.current.release();
      } catch (e) {
        // ignore
      }
      wakeLock.current = null;
    }
  }, []);

  // Activer/désactiver selon l'état
  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [enabled, requestWakeLock, releaseWakeLock]);

  // Réacquérir si l'utilisateur revient sur l'app
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, requestWakeLock]);

  return { isLocked: !!wakeLock.current };
}
