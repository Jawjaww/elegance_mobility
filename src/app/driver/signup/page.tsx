import { redirect } from 'next/navigation'

// Route de redirection pour correspondre au pattern attendu par Supabase
export default function DriverSignupRedirect() {
  // Redirection vers notre vraie page de signup
  redirect('/auth/signup/driver')
}
