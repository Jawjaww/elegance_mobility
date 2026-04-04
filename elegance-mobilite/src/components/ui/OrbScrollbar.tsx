"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Shared hook for scroll tracking
// =============================================================================

function useScrollTracker(
  containerRef: React.RefObject<HTMLElement | null>,
  direction: "horizontal" | "vertical",
  deps: React.DependencyList = [],
) {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isScrollable, setIsScrollable] = React.useState(false);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const scrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      if (direction === "horizontal") {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        const maxScroll = scrollWidth - clientWidth;
        setIsScrollable(maxScroll > 0);
        setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
      } else {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const maxScroll = scrollHeight - clientHeight;
        setIsScrollable(maxScroll > 0);
        setScrollProgress(maxScroll > 0 ? scrollTop / maxScroll : 0);
      }
    };

    const handleScroll = () => {
      updateScrollState();
      setIsScrolling(true);
      setIsVisible(true);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 600);
    };

    updateScrollState();
    container.addEventListener("scroll", handleScroll);
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, direction, ...deps]);

  return { scrollProgress, isScrollable, isScrolling, isVisible, setIsVisible };
}

// =============================================================================
// Horizontal Scrollbar
// =============================================================================

export interface OrbScrollbarHProps {
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
  /** Dependencies that should trigger a recalculation of scrollability */
  deps?: React.DependencyList;
  /** Show edge fade gradients */
  showEdgeFade?: boolean;
  /** Custom fade gradient color (defaults to 'accent') */
  fadeColor?: string;
}

export function OrbScrollbarH({
  containerRef,
  className,
  deps = [],
  showEdgeFade = true,
  fadeColor = "accent",
}: OrbScrollbarHProps) {
  const { scrollProgress, isScrollable, isScrolling } = useScrollTracker(
    containerRef,
    "horizontal",
    deps,
  );

  if (!isScrollable) return null;

  return (
    <>
      {/* Scroll indicator track */}
      <div
        className={cn(
          "absolute left-6 right-6 h-[2px] flex items-center",
          className,
        )}
      >
        {/* Track background */}
        <div className="absolute inset-0 rounded-full bg-primary/5" />

        {/* Left edge neon glow */}
        <div
          className="absolute left-0 top-1/2 -trangray-y-1/2 rounded-full transition-all duration-300"
          style={{
            width: `${4 + scrollProgress * 8}px`,
            height: "2px",
            background: "linear-gradient(90deg, var(--primary), transparent)",
            boxShadow:
              scrollProgress > 0.02
                ? `0 0 ${2 + scrollProgress * 6}px var(--primary), 0 0 ${4 + scrollProgress * 12}px var(--primary)`
                : "none",
            opacity: scrollProgress * 0.9,
          }}
        />

        {/* Right edge neon glow */}
        <div
          className="absolute right-0 top-1/2 -trangray-y-1/2 rounded-full transition-all duration-300"
          style={{
            width: `${4 + (1 - scrollProgress) * 8}px`,
            height: "2px",
            background: "linear-gradient(-90deg, var(--primary), transparent)",
            boxShadow:
              scrollProgress < 0.98
                ? `0 0 ${2 + (1 - scrollProgress) * 6}px var(--primary), 0 0 ${4 + (1 - scrollProgress) * 12}px var(--primary)`
                : "none",
            opacity: (1 - scrollProgress) * 0.9,
          }}
        />

        {/* Orb indicator */}
        <div
          className="absolute top-1/2 -trangray-y-1/2 transition-all duration-200 ease-out"
          style={{ left: `calc(${scrollProgress * 100}% - 2px)` }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200"
            style={{
              boxShadow: isScrolling
                ? "0 0 3px var(--primary), 0 0 6px var(--primary)"
                : "0 0 2px var(--primary)",
              transform: isScrolling ? "scale(1.2)" : "scale(1)",
              opacity: isScrolling ? 1 : 0.8,
            }}
          />
        </div>
      </div>

      {/* Edge fade gradients */}
      {showEdgeFade && (
        <>
          <div
            className={cn(
              "absolute top-0 left-0 bottom-1 w-6 pointer-events-none",
              `bg-gradient-to-r from-${fadeColor} to-transparent`,
            )}
          />
          <div
            className={cn(
              "absolute top-0 right-0 bottom-1 w-6 pointer-events-none",
              `bg-gradient-to-l from-${fadeColor} to-transparent`,
            )}
          />
        </>
      )}
    </>
  );
}

// =============================================================================
// Vertical Scrollbar
// =============================================================================

export interface OrbScrollbarVProps {
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
  /** Dependencies that should trigger a recalculation of scrollability */
  deps?: React.DependencyList;
  /** Auto-hide after scrolling stops (ms). Set to 0 to always show. */
  autoHideDelay?: number;
  /** Orb size: 'sm' = 1x1, 'md' = 1.5x1.5 */
  orbSize?: "sm" | "md";
}

export function OrbScrollbarV({
  containerRef,
  className,
  deps = [],
  autoHideDelay = 600,
  orbSize = "sm",
}: OrbScrollbarVProps) {
  const { scrollProgress, isScrollable, isScrolling, isVisible } =
    useScrollTracker(containerRef, "vertical", deps);

  const shouldShow = autoHideDelay === 0 || isVisible;
  const orbSizeClass = orbSize === "sm" ? "w-1 h-1" : "w-1.5 h-1.5";
  const orbOffset = orbSize === "sm" ? "-0.5px" : "-2px";

  if (!isScrollable) return null;

  return (
    <div
      className={cn(
        "absolute w-[2px] flex flex-col items-center transition-opacity duration-500 ease-in-out",
        className,
      )}
      style={{ opacity: shouldShow ? 1 : 0 }}
    >
      {/* Track background */}
      <div className="absolute inset-0 rounded-full bg-primary/5" />

      {/* Top edge neon glow */}
      <div
        className="absolute top-0 left-1/2 -trangray-x-1/2 rounded-full transition-all duration-300"
        style={{
          height: `${4 + scrollProgress * 8}px`,
          width: "2px",
          background: "linear-gradient(180deg, var(--primary), transparent)",
          boxShadow:
            scrollProgress > 0.02
              ? `0 0 ${2 + scrollProgress * 6}px var(--primary), 0 0 ${4 + scrollProgress * 12}px var(--primary)`
              : "none",
          opacity: scrollProgress * 0.9,
        }}
      />

      {/* Bottom edge neon glow */}
      <div
        className="absolute bottom-0 left-1/2 -trangray-x-1/2 rounded-full transition-all duration-300"
        style={{
          height: `${4 + (1 - scrollProgress) * 8}px`,
          width: "2px",
          background: "linear-gradient(0deg, var(--primary), transparent)",
          boxShadow:
            scrollProgress < 0.98
              ? `0 0 ${2 + (1 - scrollProgress) * 6}px var(--primary), 0 0 ${4 + (1 - scrollProgress) * 12}px var(--primary)`
              : "none",
          opacity: (1 - scrollProgress) * 0.9,
        }}
      />

      {/* Orb indicator */}
      <div
        className="absolute left-1/2 -trangray-x-1/2 transition-all duration-200 ease-out"
        style={{ top: `calc(${scrollProgress * 100}% + ${orbOffset})` }}
      >
        <div
          className={cn(
            "rounded-full bg-primary transition-all duration-200",
            orbSizeClass,
          )}
          style={{
            boxShadow: isScrolling
              ? "0 0 2px var(--primary), 0 0 4px var(--primary)"
              : "0 0 1px var(--primary)",
            transform: isScrolling ? "scale(1.15)" : "scale(1)",
            opacity: isScrolling ? 1 : 0.8,
          }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Combined export
// =============================================================================

export const OrbScrollbar = {
  Horizontal: OrbScrollbarH,
  Vertical: OrbScrollbarV,
};

export default OrbScrollbar;
