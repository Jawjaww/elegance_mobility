import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

/**
 * The landing is where a customer first meets the product, so it is the page that must be
 * installable: without a manifest link the browser has no app to offer, and the footer's
 * install invitation would have nothing to trigger. It links the client manifest — the
 * same one the account pages use, so installing from here and from `/my-account` yields a
 * single app rather than two.
 *
 * Kept as a server component so it can export metadata.
 */
export const metadata: Metadata = {
  manifest: "/manifest-client.json",
};

export default function Page() {
  return <LandingPage />;
}
