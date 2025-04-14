"use client"

import { Card } from "@/components/ui/card"

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid">
      <div className="lg:p-8">
        <Card className="mx-auto max-w-[450px] bg-neutral-900 border-neutral-800">
          {children}
        </Card>
      </div>
    </div>
  )
}