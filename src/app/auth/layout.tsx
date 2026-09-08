import { PublicPageShell } from "@/components/landing/PublicPageShell";

export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <PublicPageShell>
      <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-10">
        {children}
      </div>
    </PublicPageShell>
  );
}
