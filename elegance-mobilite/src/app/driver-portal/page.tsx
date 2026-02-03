import { redirect } from "next/navigation"

/**
 * Redirection vers le tableau de bord driver
 */
export default function DriverPortalIndex() {
  redirect('/driver-portal/dashboard')
}
