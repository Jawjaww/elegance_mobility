import type { Metadata } from "next";
import DriverPortalLayoutClient from "./DriverPortalLayoutClient";

/**
 * One origin, one installable app.
 *
 * The driver portal used to declare its own manifest, whose `scope: "/driver-portal"` sat
 * **inside** the client manifest's `scope: "/"`. Chrome does not treat two manifests on one
 * origin as two apps when their scopes overlap — it respects the broader one — and the
 * overlap is an explicitly documented anti-pattern (web.dev, "building multiple PWAs on the
 * same domain" requires non-overlapping paths). The two-manifest arrangement is what made
 * installation fail for this origin while an unrelated PWA installed fine from the same
 * device. The driver portal is therefore a route of the same app, not a second app: a
 * genuinely separate driver app belongs on its own origin, not on a nested path here.
 */
export const metadata: Metadata = {
  manifest: "/manifest-client.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vector Elegans Driver",
  },
};

export default function DriverPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DriverPortalLayoutClient>{children}</DriverPortalLayoutClient>;
}
