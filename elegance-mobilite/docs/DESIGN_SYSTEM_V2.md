# 🎨 Design System V2 - Élégance & Modernité

## Objectifs
- Plus d'élégance et de modernité
- Animations fluides avec Framer Motion
- Conteneurs plus sophistiqués (glassmorphism, gradients)
- Expérience utilisateur premium

---

## 📦 Dépendances à ajouter

```bash
npm install framer-motion
```

---

## 🎭 Principes de design

### 1. Glassmorphism moderne
```tsx
// Avant
<div className="bg-neutral-950 rounded-lg p-6">

// Après
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl"
>
```

### 2. Animations d'entrée
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}
```

### 3. Gradients sophistiqués
```tsx
// Fond premium
<div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-blue-950/30">

// Boutons glow
<button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
```

---

## 🎬 Composants d'animation réutilisables

### FadeInContainer
```tsx
// src/components/motion/FadeInContainer.tsx
'use client'
import { motion } from 'framer-motion'

export function FadeInContainer({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
```

### StaggerContainer
```tsx
// Pour les listes/grilles
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.1 } }
  }}
>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### HoverScale
```tsx
// Pour les cartes interactives
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300 }}
>
```

---

## 🎯 Pages Driver à créer/améliorer

| Page | Statut | Priorité |
|------|--------|----------|
| `/driver-portal/dashboard` | Existe mais basique | 🔴 Haute |
| `/driver-portal/rides` | Liste des courses | 🔴 Haute |
| `/driver-portal/ride/[id]` | Détail d'une course | 🟡 Moyenne |
| `/driver-portal/earnings` | Revenus/statistiques | 🟡 Moyenne |
| `/driver-portal/profile` | Profil chauffeur | 🟢 Basse |
| `/driver-portal/schedule` | Planning | 🟡 Moyenne |
| `/driver-portal/support` | Aide/support | 🟢 Basse |

---

## 🌈 Palette de couleurs premium

```css
/* Primary - Bleu profond élégant */
--primary: 217 91% 60%;
--primary-glow: 217 91% 60% / 0.3;

/* Background - Noir profond avec nuances */
--bg-primary: 0 0% 2%;      /* #050505 */
--bg-secondary: 0 0% 6%;    /* #0f0f0f */
--bg-tertiary: 0 0% 10%;    /* #1a1a1a */

/* Accents */
--accent-gold: 45 93% 47%;
--accent-success: 142 76% 36%;
--accent-warning: 38 92% 50%;
--accent-error: 0 84% 60%;
```

---

## 💡 Idées d'animations

### Page transitions
```tsx
// Layout avec AnimatePresence
<AnimatePresence mode="wait">
  <motion.main
    key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.main>
</AnimatePresence>
```

### Skeleton loading
```tsx
<motion.div
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 1.5, repeat: Infinity }}
  className="bg-white/10 rounded-lg h-20"
/>
```

### Micro-interactions boutons
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.5)" }}
>
```

---

## 📁 Structure proposée

```
src/
├── components/
│   └── motion/
│       ├── FadeIn.tsx
│       ├── SlideIn.tsx
│       ├── StaggerContainer.tsx
│       ├── HoverScale.tsx
│       └── PageTransition.tsx
├── hooks/
│   └── useScrollAnimation.ts
└── lib/
    └── animations/
        ├── variants.ts
        └── transitions.ts
```

---

## 🚀 Prochaines étapes

1. **Installer Framer Motion** : `npm install framer-motion`
2. **Créer les composants motion** de base
3. **Refactor le Driver Dashboard** avec les nouvelles animations
4. **Créer les pages Driver manquantes**
5. **Moderniser les conteneurs** (glassmorphism, gradients)

Qu'est-ce que tu veux attaquer en priorité ? Le driver dashboard ou l'installation de Framer Motion ?
