import { ToastProvider } from "@/hooks/useToast"

interface AccountLayoutProps {
  children: React.ReactNode
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <ToastProvider>
      <div className="container py-8 max-w-3xl px-4 md:px-6">
        {/* Contenu principal simplifié */}
        <main>{children}</main>
      </div>
    </ToastProvider>
  )
}
