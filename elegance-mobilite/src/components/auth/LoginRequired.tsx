import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogIn } from "lucide-react"

interface LoginRequiredProps {
  title?: string
  description?: string
  loginUrl?: string
  loginText?: string
}

export function LoginRequired({
  title = "Connexion requise",
  description = "Veuillez vous connecter pour accéder à cette page.",
  loginUrl = "/auth/login",
  loginText = "Se connecter"
}: LoginRequiredProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={loginUrl}>{loginText}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
