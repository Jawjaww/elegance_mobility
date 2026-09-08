"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Let the decoder pass the first dropped frames before showing the clip. */
const PLAYBACK_WARMUP_MS = 280;

type LandingVideoProps = Readonly<{
  src: string;
  poster: string;
  /** Hero: decode after first paint. Other clips wait until they enter the snap viewport. */
  eager?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
}>;

function snapRoot(node: Element): Element | null {
  const scroller = node.closest("[data-landing-scroll]");
  return scroller instanceof Element ? scroller : null;
}

function afterFirstPaint(run: () => void): () => void {
  const id = requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
  return () => cancelAnimationFrame(id);
}

/**
 * Poster covers a full-size video that never moves or fades.
 * Previous approaches stuttered on Android: Ken Burns / opacity on <video>,
 * poster-loop seeks, and sliding the element from off-screen into place.
 */
export function LandingVideo({
  src,
  poster,
  eager = false,
  className,
  sizes = "100vw",
  priority = false,
  children,
}: LandingVideoProps) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inViewRef = useRef(eager);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [showClip, setShowClip] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const enableLoad = () => setShouldLoad(true);
    const cancelPaint = eager ? afterFirstPaint(enableLoad) : undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        inViewRef.current = visible;
        if (visible) enableLoad();
        const el = videoRef.current;
        if (!el) return;
        if (visible) {
          el.muted = true;
          void el.play().catch(() => undefined);
        } else {
          el.pause();
        }
      },
      {
        root: snapRoot(wrap),
        threshold: eager ? 0.01 : 0.35,
      },
    );
    observer.observe(wrap);

    return () => {
      cancelPaint?.();
      observer.disconnect();
    };
  }, [reducedMotion, eager]);

  useEffect(() => {
    if (reducedMotion || !shouldLoad) return;
    const el = videoRef.current;
    if (!el) return;

    let warmup = 0;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");

    const onPlaying = () => {
      window.clearTimeout(warmup);
      warmup = window.setTimeout(() => setShowClip(true), PLAYBACK_WARMUP_MS);
    };

    el.addEventListener("playing", onPlaying);
    if (inViewRef.current) {
      void el.play().catch(() => undefined);
    }

    return () => {
      window.clearTimeout(warmup);
      el.removeEventListener("playing", onPlaying);
    };
  }, [reducedMotion, shouldLoad, src]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative overflow-hidden bg-neutral-950", className)}
    >
      {!reducedMotion && shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload={eager ? "auto" : "metadata"}
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <Image
        src={poster}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "pointer-events-none z-[1] object-cover",
          showClip && !reducedMotion ? "hidden" : "block",
        )}
      />
      {children ? (
        <div className="absolute inset-0 z-[2]">{children}</div>
      ) : null}
    </div>
  );
}
