export const LANDING_ASSETS = {
  heroVideo: "/videos/hero-vtc.mp4",
  heroPoster: "/images/landing/hero-poster.jpg",
  berlineVideo: "/videos/berline-vtc.mp4",
  berlinePoster: "/images/landing/berline-poster.jpg",
  vanVideo: "/videos/van-vtc.mp4",
  vanPoster: "/images/landing/van-poster.jpg",
} as const;

/** Shared CTA classes aligned with app blue gradient identity */
export const LANDING_CTA =
  "bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 shadow-lg shadow-blue-950/40";

/** Wordmark / logo lockup — one line on mobile, extrabold, tight tracking */
export const LANDING_BRAND =
  "inline-block shrink-0 whitespace-nowrap text-sm font-extrabold tracking-[-0.035em] sm:text-base md:text-lg bg-gradient-to-r from-blue-200 via-blue-400 to-sky-300 bg-clip-text text-transparent transition-opacity hover:opacity-90";
