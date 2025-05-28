import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Fonction pour fusionner les classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatage des montants en euros
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Formatage des durées en heures et minutes
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    // Pas d'heures, on affiche seulement les minutes sans zéro
    return `${remainingMinutes} min`;
  }

  // Si heures ET minutes inférieures à 10, ajout d'un zéro
  return `${hours}h${remainingMinutes < 10 ? `0${remainingMinutes}` : remainingMinutes}min`;
}

