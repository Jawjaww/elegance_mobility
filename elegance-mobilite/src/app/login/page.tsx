import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string; redirectedFrom?: string }
}) {
  const redirectedFrom = await Promise.resolve(searchParams?.redirectedFrom)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Vérifier si l'utilisateur est admin/superadmin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: { user: fullUser } } = await supabase.auth.getUser()
    const isAdmin = userData?.role === 'admin'
    const isSuperAdmin = fullUser?.user_metadata?.is_super_admin === true

    if (isAdmin || isSuperAdmin) {
      redirect(redirectedFrom || '/admin')
    } else {
      redirect('/')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="p-8 rounded-lg border border-neutral-800 bg-neutral-900/90 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-100 text-center">
            Connexion
          </h2>
          <form>
            <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-neutral-400"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-neutral-400"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  formAction={login}
                  className="flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-100 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
                >
                  Se connecter
                </button>

                <button
                  formAction={signup}
                  className="flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-blue-400 bg-neutral-800 border border-blue-500/20 hover:bg-neutral-800/80 hover:border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-neutral-900"
                >
                  {"S'inscrire"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
