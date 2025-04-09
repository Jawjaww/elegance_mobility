'use client'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Composant conteneur de page qui applique les marges et le padding standards
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`content-container py-6 ${className}`}>
      {children}
    </div>
  )
}