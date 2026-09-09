"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PublicAuthActions } from "@/components/landing/PublicAuthActions";
import { cn } from "@/lib/utils";
import { LANDING_BRAND, LANDING_CTA } from "@/components/landing/landingAssets";
import {
  getLandingScroller,
  scrollLandingTo,
} from "@/components/landing/landingPanel";

const NAV_LINKS = [
  { id: "comment-ca-marche", label: "Comment ça marche" },
  { id: "berline", label: "Berline" },
  { id: "van", label: "Van" },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [onFinalCta, setOnFinalCta] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const scroller = getLandingScroller();
    const onScroll = () => {
      const y =
        scroller instanceof HTMLElement ? scroller.scrollTop : window.scrollY;
      setScrolled(y > 24);
    };
    onScroll();
    const html = document.documentElement;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      html.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      target.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const panel = document.getElementById("reserver");
    if (!panel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setOnFinalCta(entry.isIntersecting && entry.intersectionRatio >= 0.4);
      },
      {
        root: getLandingScroller(),
        threshold: [0.4, 0.6],
      },
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const jumpToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id) scrollLandingTo(id, "auto");
    };
    requestAnimationFrame(jumpToHash);
    window.addEventListener("hashchange", jumpToHash);
    return () => window.removeEventListener("hashchange", jumpToHash);
  }, []);

  const goToPanel = (
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    const hash = `#${id}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scrollLandingTo(id, reduceMotion ? "auto" : "smooth");
  };

  const goToTop = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    event.preventDefault();
    if (window.location.hash) {
      history.replaceState(null, "", pathname);
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scrollLandingTo("", reduceMotion ? "auto" : "smooth");
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-neutral-950/85 backdrop-blur-xl border-b border-blue-500/15 shadow-lg shadow-blue-950/20"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          onClick={goToTop}
          className={LANDING_BRAND}
        >
          Vector&nbsp;Elegans
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-300">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(event) => goToPanel(event, link.id)}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <PublicAuthActions />
          {!onFinalCta ? (
            <Button asChild size="sm" className={LANDING_CTA}>
              <Link href="/reservation">Réserver</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
