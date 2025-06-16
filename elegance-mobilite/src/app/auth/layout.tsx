"use client"

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid">
      <div className="lg:p-8">
        <div className="mx-auto max-w-[450px]">
          {children}
        </div>
      </div>
    </div>
  )
}