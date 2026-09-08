import { PublicPageShell } from "@/components/landing/PublicPageShell";
import { LANDING_PAGE_MAIN } from "@/components/landing/landingSurface";

export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <PublicPageShell>
      <div className={LANDING_PAGE_MAIN}>{children}</div>
    </PublicPageShell>
  );
}
