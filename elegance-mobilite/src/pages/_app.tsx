import type { AppProps } from 'next/app'

// Cette page est nécessaire pour Next.js 15 même si nous utilisons le App Router
export default function App({ Component, pageProps }: AppProps) {
  return null // Les routes sont gérées par le App Router dans /app
}