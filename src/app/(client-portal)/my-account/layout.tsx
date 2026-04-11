import { ReactNode } from "react"

export default async function CustomerPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
