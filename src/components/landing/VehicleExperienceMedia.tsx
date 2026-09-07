"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
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

/**
 * Looping video. `pingPong` plays forward then scrubs back so a Ken Burns
 * clip does not jump when it would otherwise loop.
 */
export function VehicleExperienceVideo({
  video,
  poster,
  overlay,
  pingPong = false,
  children,
}: Readonly<{
  video: string;
  poster: string;
  overlay: string;
  pingPong?: boolean;
  children?: React.ReactNode;
}>) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reducedMotion || !videoRef.current) return;
    const el = videoRef.current;
    let raf = 0;
    let reversing = false;
    let last = 0;
    let inView = false;

    const cancelRaf = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };

    const reverseTick = (now: number) => {
      if (!inView || !reversing) return;
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 1 / 24);
      last = now;
      const duration = el.duration;
      if (!duration || !Number.isFinite(duration)) {
        reversing = false;
        return;
      }
      const next = el.currentTime - dt;
      if (next <= 0.04) {
        reversing = false;
        last = 0;
        el.currentTime = 0;
        void el.play().catch(() => undefined);
        return;
      }
      el.currentTime = next;
      raf = requestAnimationFrame(reverseTick);
    };

    const onEnded = () => {
      if (!inView || !pingPong) return;
      reversing = true;
      last = 0;
      el.pause();
      cancelRaf();
      raf = requestAnimationFrame(reverseTick);
    };

    if (pingPong) el.addEventListener("ended", onEnded);

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        if (inView) {
          if (pingPong && reversing) {
            raf = requestAnimationFrame(reverseTick);
          } else {
            void el.play().catch(() => undefined);
          }
        } else {
          reversing = false;
          cancelRaf();
          el.pause();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      inView = false;
      reversing = false;
      cancelRaf();
      if (pingPong) el.removeEventListener("ended", onEnded);
      observer.disconnect();
    };
  }, [reducedMotion, pingPong]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-neutral-900">
      {reducedMotion ? (
        <Image
          src={poster}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <video
          ref={videoRef}
          muted
          loop={!pingPong}
          playsInline
          preload={pingPong ? "auto" : "none"}
          poster={poster}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
      <MediaOverlay overlay={overlay} />
      {children}
    </div>
  );
}

/** Full-bleed media column: video fills leftover height; copy overlays on mobile. */
export function ExperienceMediaStage({
  video,
  poster,
  overlay,
  pingPong,
  children,
}: Readonly<{
  video: string;
  poster: string;
  overlay: string;
  pingPong?: boolean;
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-0 flex-1 md:h-full md:min-h-0 md:flex-none">
      <VehicleExperienceVideo
        video={video}
        poster={poster}
        overlay={overlay}
        pingPong={pingPong}
      >
        <div className="absolute inset-x-0 bottom-0 z-10 md:hidden px-4 pb-5 pt-24 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-transparent">
          {children}
        </div>
      </VehicleExperienceVideo>
    </div>
  );
}

