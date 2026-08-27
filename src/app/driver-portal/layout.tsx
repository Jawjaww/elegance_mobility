import type { Metadata } from "next";
import DriverPortalLayoutClient from "./DriverPortalLayoutClient";

export const metadata: Metadata = {
  manifest: "/manifest.json",
};

export default function DriverPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DriverPortalLayoutClient>{children}</DriverPortalLayoutClient>;
}
