import { getServerUser } from '@/lib/database/server'
import { redirect } from 'next/navigation'
import { type PropsWithChildren } from 'react'
import { ClientLayout } from '@/components/layout/ClientLayout'

/**
 * Mise en page pour le portail client
 */
export default async function ClientPortalLayout({
  children,
}: PropsWithChildren) {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'app_customer') {
    // Le portail client est réservé aux clients
    redirect('/unauthorized')
  }

  return (
    <ClientLayout user={user}>
      {children}
    </ClientLayout>
  )
}
