import { Html, Head, Main, NextScript } from 'next/document'

// Cette page est nécessaire pour Next.js 15 même si nous utilisons le App Router
export default function Document() {
  return (
    <Html lang="fr">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}