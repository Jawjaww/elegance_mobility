export const metadata = {
  title: 'Elegance Driver - Dashboard',
  description: 'Tableau de bord chauffeur',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-full overflow-hidden bg-neutral-950">
      {children}
    </div>
  )
}
