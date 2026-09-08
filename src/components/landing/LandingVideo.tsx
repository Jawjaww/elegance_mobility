"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Keep in sync with the poster `duration-*` class. */
const LOOP_FADE_MS = 550;

type LandingVideoProps = Readonly<{
  src: string;
  poster: string;
  /** Hero: start after first paint. Other clips wait until near the snap viewport. */
  eager?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
}>;

type VideoEl = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
};

function snapRoot(node: Element): Element | null {
  const scroller = node.closest("[data-landing-scroll]");
  return scroller instanceof Element ? scroller : null;
}

function revealOnFirstFrame(el: VideoEl, reveal: () => void) {
  if (typeof el.requestVideoFrameCallback === "function") {
    el.requestVideoFrameCallback(() => reveal());
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(reveal));
}

function scheduleAfterFirstPaint(run: () => void): () => void {
  const ric = window.requestIdleCallback?.bind(window);
  if (ric) {
    const id = ric(run, { timeout: 280 });
    return () => window.cancelIdleCallback(id);
  }
  const t = window.setTimeout(run, 120);
  return () => window.clearTimeout(t);
}

/**
 * Crossfade a loop by covering the last frames with the poster (first frame)
 * before seeking — avoids the hard cut of native `loop` and a second decoder.
 */
function attachFadeLoop(
  el: VideoEl,
  options: {
    inView: () => boolean;
    setCover: (cover: boolean) => void;
  },
): () => void {
  const { inView, setCover } = options;
  let busy = false;
  let fadeTimer = 0;
  let seekFallback = 0;

  const clearTimers = () => {
    window.clearTimeout(fadeTimer);
    window.clearTimeout(seekFallback);
    fadeTimer = 0;
    seekFallback = 0;
  };

  const reset = () => {
    busy = false;
    clearTimers();
    setCover(false);
  };

  const uncover = () => {
    setCover(false);
    busy = false;
  };

  const restartFromStart = () => {
    if (!inView()) {
      reset();
      return;
    }

    let settled = false;
    const afterSeek = () => {
      if (settled) return;
      settled = true;
      el.removeEventListener("seeked", afterSeek);
      window.clearTimeout(seekFallback);
      seekFallback = 0;
      el.muted = true;
      void el.play().catch(() => undefined);
      revealOnFirstFrame(el, uncover);
    };

    el.addEventListener("seeked", afterSeek);
    seekFallback = window.setTimeout(afterSeek, 280);
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      afterSeek();
    }
  };

  const beginCover = () => {
    if (busy || !inView()) return;
    const duration = el.duration;
    if (!duration || !Number.isFinite(duration)) return;
    busy = true;
    setCover(true);
    fadeTimer = window.setTimeout(restartFromStart, LOOP_FADE_MS);
  };

  const onTimeUpdate = () => {
    if (busy || !inView()) return;
    const duration = el.duration;
    if (!duration || !Number.isFinite(duration)) return;
    const fadeS = Math.min(LOOP_FADE_MS / 1000, duration * 0.22);
    if (duration - el.currentTime <= fadeS) beginCover();
  };

  const onEnded = () => beginCover();

  el.addEventListener("timeupdate", onTimeUpdate);
  el.addEventListener("ended", onEnded);

  return () => {
    reset();
    el.removeEventListener("timeupdate", onTimeUpdate);
    el.removeEventListener("ended", onEnded);
  };
}

/**
 * Poster-first background video. Android Chrome glitches when a <video>
 * paints a black decoder frame, sits under a CSS transform, or shares the
 * (tiny) hardware decoder pool with off-screen clips — so we keep the poster
 * covering the element until a real frame exists, load src lazily, and pause
 * anything that leaves the snap viewport.
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
  const [showVideo, setShowVideo] = useState(false);
  const [loopCover, setLoopCover] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const enableLoad = () => setShouldLoad(true);
    const cancelEager = eager ? scheduleAfterFirstPaint(enableLoad) : undefined;

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
          setLoopCover(false);
          el.pause();
        }
      },
      {
        root: snapRoot(wrap),
        threshold: eager ? 0.05 : 0.35,
        rootMargin: "0px",
      },
    );
    observer.observe(wrap);

    return () => {
      cancelEager?.();
      observer.disconnect();
    };
  }, [reducedMotion, eager]);

  useEffect(() => {
    if (reducedMotion || !shouldLoad) return;
    const el = videoRef.current;
    if (!el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");

    const reveal = () => setShowVideo(true);
    const onPlaying = () => revealOnFirstFrame(el, reveal);

    el.addEventListener("playing", onPlaying);
    if (inViewRef.current) {
      void el.play().catch(() => undefined);
    }

    return () => {
      el.removeEventListener("playing", onPlaying);
    };
  }, [reducedMotion, shouldLoad, src]);

  useEffect(() => {
    if (reducedMotion || !shouldLoad || !showVideo) return;
    const el = videoRef.current;
    if (!el) return;
    return attachFadeLoop(el, {
      inView: () => inViewRef.current,
      setCover: setLoopCover,
    });
  }, [reducedMotion, shouldLoad, showVideo, src]);

  const posterVisible = reducedMotion || !showVideo || loopCover;

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
          playsInline
          preload={eager ? "auto" : "metadata"}
          disablePictureInPicture
          disableRemotePlayback
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            showVideo ? "visible" : "invisible",
          )}
        />
      ) : null}
      <Image
        src={poster}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "pointer-events-none z-[1] object-cover transition-opacity ease-in-out",
          posterVisible ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${LOOP_FADE_MS}ms` }}
      />
      {children ? (
        <div className="absolute inset-0 z-[2]">{children}</div>
      ) : null}
    </div>
  );
}
