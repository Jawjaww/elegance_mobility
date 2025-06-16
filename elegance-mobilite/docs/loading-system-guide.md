# Guide d'utilisation du système de Loading

## Composants disponibles

### 1. `LoadingSpinner` (Composant principal)
```tsx
import LoadingSpinner from '@/components/ui/loading';

// Usage basique
<LoadingSpinner />

// Avec options
<LoadingSpinner 
  size="lg" 
  variant="ring" 
  text="Chargement des données..." 
/>
```

**Props :**
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` (défaut: `'md'`)
- `variant`: `'spinner' | 'dots' | 'pulse' | 'bars' | 'ring'` (défaut: `'spinner'`)
- `text`: string (optionnel)
- `inline`: boolean (défaut: `false`)
- `className`: string (optionnel)

### 2. `PageLoading` (Page complète)
```tsx
import { PageLoading } from '@/components/ui/loading';

<PageLoading text="Chargement de l'application..." />
```

### 3. `ButtonLoading` (Dans les boutons)
```tsx
import { ButtonLoading } from '@/components/ui/loading';

<Button disabled={loading}>
  {loading ? <ButtonLoading /> : 'Créer'}
</Button>
```

### 4. `SectionLoading` (Sections/Cards)
```tsx
import { SectionLoading } from '@/components/ui/loading';

<SectionLoading text="Chargement des données..." />
```

### 5. `LoadingOverlay` (Overlay modal)
```tsx
import { LoadingOverlay } from '@/components/ui/loading';

<LoadingOverlay show={isLoading} text="Sauvegarde..." />
```

## Variantes disponibles

### `spinner` (Défaut)
Animation de rotation classique et élégante

### `dots`
Trois points qui rebondissent

### `pulse`
Animation de pulsation

### `bars`
Barres animées qui ondulent

### `ring`
Double anneau en rotation (le plus élégant)

## Tailles disponibles

- `xs`: 12px (3x3)
- `sm`: 16px (4x4) 
- `md`: 24px (6x6) - défaut
- `lg`: 32px (8x8)
- `xl`: 48px (12x12)

## Exemples d'usage par contexte

### Boutons
```tsx
<Button disabled={loading}>
  {loading ? <ButtonLoading size="sm" /> : 'Sauvegarder'}
</Button>
```

### Pages
```tsx
if (loading) {
  return <PageLoading text="Chargement..." />;
}
```

### Inline
```tsx
<LoadingSpinner size="sm" variant="dots" inline text="Envoi..." />
```

### Cards/Sections
```tsx
{loading ? (
  <SectionLoading text="Chargement des données..." />
) : (
  <DataComponent />
)}
```

### Overlay modal
```tsx
<LoadingOverlay show={isSaving} text="Sauvegarde en cours..." />
```

## Migration des anciens loadings

### Remplacer les spinners simples :
```tsx
// ❌ Ancien
<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>

// ✅ Nouveau
<ButtonLoading size="sm" />
```

### Remplacer les loadings de page :
```tsx
// ❌ Ancien
<div className="flex items-center justify-center min-h-screen">
  <div className="animate-spin..."></div>
</div>

// ✅ Nouveau
<PageLoading text="Chargement..." />
```

## Classes CSS personnalisées

Le fichier `globals.css` inclut des animations personnalisées :
- `.animate-elegant-spin` : Animation de rotation avec transition fluide
- `.animate-fade-in` : Animation d'apparition
- `.animate-scale-in` : Animation de zoom

## Notes importantes

1. **Performance** : Les composants sont optimisés et utilisent `React.memo` quand nécessaire
2. **Accessibilité** : Inclut les attributs ARIA appropriés
3. **Thème** : S'adapte automatiquement au thème sombre de l'application
4. **Responsive** : Les tailles s'adaptent aux différents écrans

## Uniformisation dans le projet

Remplacer tous les anciens loadings par ces nouveaux composants pour :
- ✅ Cohérence visuelle
- ✅ Maintenance simplifiée  
- ✅ Performance optimisée
- ✅ Accessibilité améliorée
