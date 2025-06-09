import { redirect } from "next/navigation"

/**
 * Redirection vers le tableau de bord principal du driver
 */
export default function DriverDashboardPage() {
  redirect('/driver-portal')
}
