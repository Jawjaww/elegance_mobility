"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type GlassModalProps = {
  children: React.ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
  contentClassName?: string;
  maxWidthClass?: string;
};

export default function GlassModal({
  children,
  onClose,
  dismissible = false,
  className = "",
  contentClassName = "",
  maxWidthClass = "max-w-2xl",
}: GlassModalProps) {
  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissible, onClose]);

  // Lock body scroll while the modal is mounted to prevent background scrolling/flash
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar width to avoid layout shift when hiding overflow
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // Portal container for mounting the modal at the document body root
  const portalElRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!portalElRef.current) portalElRef.current = document.createElement("div");
    const el = portalElRef.current;
    document.body.appendChild(el);

    // Hide main application from assistive tech while modal is open
    const appRoot = document.getElementById("__next");
    const prevAria = appRoot?.getAttribute("aria-hidden");
    if (appRoot) appRoot.setAttribute("aria-hidden", "true");

    return () => {
      if (appRoot) {
        if (!prevAria) appRoot.removeAttribute("aria-hidden");
        else appRoot.setAttribute("aria-hidden", prevAria);
      }
      if (el && document.body.contains(el)) document.body.removeChild(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || !portalElRef.current) return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${className} bg-elegant-gradient`}
      onClick={() => dismissible && onClose?.()}
    >
      {/* Backdrop: use the globals.css elegant vignette and gradient */}
      <div className="absolute inset-0 elegant-vignette pointer-events-none" />

      <div
        className={`relative w-full ${maxWidthClass} overflow-hidden rounded-xl glass-modal__sheet ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner glass overlay kept via CSS */}
        <div className="absolute inset-0 pointer-events-none rounded-xl" />

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, portalElRef.current);
}
