"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type MediaOverlayProps = Readonly<{
  overlay: string;
}>;

function MediaOverlay({ overlay }: MediaOverlayProps) {
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-t ${overlay} via-transparent to-black/20 pointer-events-none`}
    />
  );
}

function snapRoot(node: Element): Element | null {
  const scroller = node.closest("[data-landing-scroll]");
  return scroller instanceof Element ? scroller : null;
}

/**
 * Berline / van clips: a plain <video> with no poster overlay, fade, or warmup.
 * LandingVideo’s Image→video swap re-crops on Android at play() and looks like a zoom jolt.
 */
export function VehicleExperienceVideo({
  video,
  poster,
  overlay,
  children,
}: Readonly<{
  video: string;
  poster: string;
  overlay: string;
  children?: React.ReactNode;
}>) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const wrap = wrapRef.current;
    const el = videoRef.current;
    if (!wrap || !el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");

    const tryPlay = () => {
      el.muted = true;
      void el.play().catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          tryPlay();
        } else {
          el.pause();
        }
      },
      {
        root: snapRoot(wrap),
        // Decode off-screen so any first-frame compositor settle is not visible.
        rootMargin: "100% 0px",
        threshold: 0,
      },
    );
    observer.observe(wrap);

    return () => observer.disconnect();
  }, [reducedMotion, video]);

  return (
    <div
      ref={wrapRef}
      className="relative h-full min-h-0 w-full overflow-hidden bg-neutral-950"
    >
      {reducedMotion ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={video}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 z-[1]">
        <MediaOverlay overlay={overlay} />
        {children}
      </div>
    </div>
  );
}

/** Full-bleed media column: video fills leftover height; copy overlays on mobile. */
export function ExperienceMediaStage({
  video,
  poster,
  overlay,
  children,
}: Readonly<{
  video: string;
  poster: string;
  overlay: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-0 flex-1 md:h-full md:min-h-0 md:flex-none">
      <VehicleExperienceVideo
        video={video}
        poster={poster}
        overlay={overlay}
      >
        <div className="absolute inset-x-0 bottom-0 z-10 md:hidden px-4 pb-5 pt-24 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-transparent">
          {children}
        </div>
      </VehicleExperienceVideo>
    </div>
  );
}
