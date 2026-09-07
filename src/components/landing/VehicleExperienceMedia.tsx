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

/** Looping video with play/pause on visibility. */
export function VehicleExperienceVideo({
  video,
  poster,
  overlay,
}: Readonly<{ video: string; poster: string; overlay: string }>) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reducedMotion || !videoRef.current) return;
    const el = videoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

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
          loop
          playsInline
          preload="none"
          poster={poster}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
      <MediaOverlay overlay={overlay} />
    </div>
  );
}
