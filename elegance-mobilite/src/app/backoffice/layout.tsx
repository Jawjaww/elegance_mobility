import { BackofficeHeader } from "@/components/backoffice/BackofficeHeader";

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Ce layout doit avoir son propre header au lieu du MainHeader */}
      <BackofficeHeader />
      <main className="container mx-auto py-4">
        {children}
      </main>
    </>
  );
}
