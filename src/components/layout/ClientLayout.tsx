'use client'

import { ClientHeader } from "./ClientHeader"
import ClientMobileNav from "./ClientMobileNav"

interface ClientLayoutProps {
  children: React.ReactNode
}

/**
 * Client portal shell.
 *
 * `min-h-[100dvh]`, not `min-h-screen`: `100vh` is the viewport height *without* the mobile
 * address bar, so a 100vh shell is always a few dozen pixels taller than what the user can
 * see. Every short page — notifications, account, a confirmation screen — then scrolls by
 * exactly the height of the browser chrome, revealing nothing. `dvh` tracks the visible
 * viewport instead, which is what "at least fill the screen" actually means.
 *
 * The column layout is what makes the `flex-1` below do something. It was already written
 * but inert, because a `flex-1` child of a `display:block` parent grows to nothing. Now a
 * page can claim the space left between the header and the bottom nav (a centered success
 * screen does exactly that) instead of declaring a second full viewport of its own.
 */
export function ClientLayout({ children }: Readonly<ClientLayoutProps>) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-neutral-950 text-white">
      <ClientHeader />
      <main className="flex flex-1 flex-col">
        {children}
      </main>
      <ClientMobileNav />
    </div>
  )
}
