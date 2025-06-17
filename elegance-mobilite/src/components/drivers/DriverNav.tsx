"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard,
  CarTaxiFront,
  User,
  MapPin,
  CreditCard,
  BarChart3,
  Settings
} from "lucide-react";

// Items de navigation pour les chauffeurs
const driverNavItems = [
  {
    title: "Tableau de bord",
    href: "/driver-portal",
    icon: LayoutDashboard,
  },
  {
    title: "Mes courses",
    href: "/driver-portal/rides",
    icon: CarTaxiFront,
  },
  {
    title: "Navigation",
    href: "/driver-portal/navigation",
    icon: MapPin,
  },
  {
    title: "Gains",
    href: "/driver-portal/earnings",
    icon: CreditCard,
  },
  {
    title: "Statistiques",
    href: "/driver-portal/stats",
    icon: BarChart3,
  },
  {
    title: "Profil",
    href: "/driver-portal/profile",
    icon: User,
  },
];

interface DriverMainNavProps {
  className?: string;
}

export function DriverMainNav({ className }: DriverMainNavProps) {
  const pathname = usePathname();
  
  return (
    <nav className={cn("hidden md:flex items-center space-x-6", className)}>
      {driverNavItems.map(({ title, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-white",
            pathname === href
              ? "text-white"
              : "text-neutral-400"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </Link>
      ))}
    </nav>
  );
}

export function DriverMobileNav() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black border-t border-neutral-800">
      <div className="flex justify-around items-center h-16">
        {driverNavItems.map(({ title, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors hover:text-white",
              pathname === href
                ? "text-white bg-neutral-800"
                : "text-neutral-400"
            )}
        >
            <Icon className="h-5 w-5 mb-1" />
            <span className="truncate">{title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
