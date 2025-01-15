import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-neutral-900/50">
        <nav className="p-4">
          <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
          <ul className="space-y-2">
            <li><a href="/admin/rates" className="hover:text-blue-500">Rates</a></li>
            <li><a href="/admin/chauffeurs" className="hover:text-blue-500">Chauffeurs</a></li>
            <li><a href="/admin/vehicules" className="hover:text-blue-500">Véhicules</a></li>
            <li><a href="/admin/courses" className="hover:text-blue-500">Courses</a></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}