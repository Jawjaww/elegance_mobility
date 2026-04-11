"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard,
  CarTaxiFront,
  Users,
  Car,
  CreditCard,
  Settings,
  Shield,
  UserCog,
  PackageOpen
} from "lucide-react";

// Items de navigation communs à tous les admins
const commonNavItems = [
  {
    title: "Tableau de bord",
    href: "/backoffice",
    icon: LayoutDashboard,
  },
  {
    title: "Courses",
    href: "/backoffice/rides",
    icon: CarTaxiFront,
  },
  {
    title: "Chauffeurs",
    href: "/backoffice/drivers",
    icon: Users,
  },
  {
    title: "Véhicules",
    href: "/backoffice/vehicles",
    icon: Car,
  },
  {
    title: "Tarifs",
    href: "/backoffice/rates",
    icon: CreditCard,
  },
  {
    title: "Options",
    href: "/backoffice/options",
    icon: PackageOpen,
  }
];

// Items de navigation réservés aux super admins
const superAdminNavItems = [
  {
    title: "Utilisateurs",
    href: "/backoffice/system/users",
    icon: UserCog,
  },
  {
    title: "Rôles",
    href: "/backoffice/system/roles",
    icon: Shield,
  },
  {
    title: "Configuration",
    href: "/backoffice/system/settings",
    icon: Settings,
  }
];

interface MainNavProps {
  isSuperAdmin: boolean;
}

export function MainNav({ isSuperAdmin }: MainNavProps) {
  const pathname = usePathname();
  
  const navItems = [
    ...commonNavItems,
    ...(isSuperAdmin ? superAdminNavItems : [])
  ];
  
  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map(({ title, href, icon: Icon }) => (
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

interface MobileNavProps {
  isSuperAdmin: boolean;
}

export function MobileNav({ isSuperAdmin }: MobileNavProps) {
  const pathname = usePathname();
  
  const navItems = [
    ...commonNavItems,
    ...(isSuperAdmin ? superAdminNavItems : [])
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black border-t border-neutral-800">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ title, href, icon: Icon }) => (
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
            <span>{title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
