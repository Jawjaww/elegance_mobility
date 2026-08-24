import { ReactNode } from "react";

export default async function CustomerPortalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="bg-neutral-950 text-white">
      <main className="container mx-auto px-4 py-4 pb-24 md:pb-6 md:py-5">
        {children}
      </main>
    </div>
  );
}
