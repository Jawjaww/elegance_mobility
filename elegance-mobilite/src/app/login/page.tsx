import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/database/server' // Utiliser getServerUser
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const user = await getServerUser()

  if (user) {
    // Rediriger vers la page d'accueil appropriée si déjà connecté
    // (Cette logique pourrait être affinée en fonction des rôles)
    redirect('/my-account') 
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center text-2xl font-bold">Connexion Client</h1>
        <LoginForm />
      </div>
    </div>
  )
}
