"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type LandingVideoProps = Readonly<{
  src: string;
  poster: string;
  /** Hero: decode immediately. Other clips wait until they enter the snap viewport. */
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

/**
 * Poster stays on screen until the decoder paints a real frame, then native
 * `loop` takes over. Manual seek / poster-cover loops flash black on Android.
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
  const [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const wrap = wrapRef.current;
    const el = videoRef.current;
    if (!wrap || !el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;

    const playIfVisible = () => {
      el.muted = true;
      void el.play().catch(() => undefined);
    };

    if (eager) playIfVisible();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          playIfVisible();
        } else {
          el.pause();
          setHasFrame(false);
        }
      },
      {
        root: snapRoot(wrap),
        threshold: eager ? 0.01 : 0.35,
      },
    );
    observer.observe(wrap);

    return () => observer.disconnect();
  }, [reducedMotion, eager, src]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative overflow-hidden bg-neutral-950", className)}
    >
      {reducedMotion ? null : (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          autoPlay={eager}
          preload={eager ? "auto" : "none"}
          poster={poster}
          disablePictureInPicture
          disableRemotePlayback
          onPlaying={() => setHasFrame(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            hasFrame ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      <Image
        src={poster}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "pointer-events-none z-[1] object-cover",
          hasFrame && !reducedMotion ? "opacity-0" : "opacity-100",
        )}
      />
      {children ? (
        <div className="absolute inset-0 z-[2]">{children}</div>
      ) : null}
    </div>
  );
}
