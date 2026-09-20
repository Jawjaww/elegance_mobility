import { ReactNode } from "react";

/**
 * Pass-through flex column, so a page can ask for the remaining height with `flex-1`
 * (confirmation screens) instead of stacking its own viewport-sized block inside the shell's.
 * `flex-1` on the outer div requires `ClientLayout`'s `main` to be a flex column too.
 */
export default async function CustomerPortalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col bg-neutral-950 text-white">
      <main className="container mx-auto flex flex-1 flex-col px-4 py-4 pb-24 md:pb-6 md:py-5">
        {children}
      </main>
    </div>
  );
}
