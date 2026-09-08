"use client";

import { LandingVideo } from "@/components/landing/LandingVideo";

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
  return (
    <LandingVideo
      src={video}
      poster={poster}
      className="h-full min-h-0 w-full"
      sizes="(max-width: 768px) 100vw, 50vw"
    >
      <MediaOverlay overlay={overlay} />
      {children}
    </LandingVideo>
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
