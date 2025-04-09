'use client'

import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { driverLogin } from '@/app/login/actions'

export function DriverLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await driverLogin(email, password)

    if (error) {
      let message = 'Une erreur est survenue'
      if (typeof error === 'string') {
        message = error
      } else if ('message' in error) {
        message = error.message
      }
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: message,
      })
      setIsLoading(false)
      return
    }

    router.refresh()
    router.push('/driver-portal')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="example@email.com"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  )
}
