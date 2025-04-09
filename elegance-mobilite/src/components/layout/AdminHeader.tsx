"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from '@/lib/database/client';
import { adminLogout } from "@/app/auth/admin-actions";
import { Layout, Users, Settings, Car, ChevronDown } from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/backoffice/dashboard",
    label: "Tableau de bord",
    icon: Layout,
  },
  {
    href: "/backoffice/rides",
    label: "Réservations",
    icon: Car,
  },
  {
    href: "/backoffice/drivers",
    label: "Chauffeurs",
    icon: Users,
  },
  {
    href: "/backoffice/users",
    label: "Utilisateurs",
    icon: Users,
  },
];

type AdminHeaderProps = {
  adminLevel?: string;
};

export function AdminHeader({ adminLevel = "standard" }: AdminHeaderProps) {
  const pathname = usePathname() || '';
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const user = useUser();

  // Obtenir les deux premières lettres de l'email
  const getInitials = (email?: string | null) => {
    if (!email) return 'AD';
    return email.substring(0, 2).toUpperCase();
  };

  const isSuperAdmin = adminLevel === "super";

  const menuItems = [
    ...NAV_ITEMS,
    ...(isSuperAdmin ? [{
      href: "/backoffice/settings",
      label: "Paramètres",
      icon: Settings,
    }] : []),
  ];

  return (
    <header className="border-b border-neutral-800 bg-neutral-900 text-white sticky top-0 z-50">
      <div className="content-container flex items-center h-14">
        <Link href="/backoffice" className="flex items-center mr-8">
          <span className="text-base font-medium">VECTOR ELEGANS - Administration</span>
          {isSuperAdmin && (
            <span className="ml-2 bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-500/20">
              Super Admin
            </span>
          )}
        </Link>

        {/* Navigation principale - Style LinkedIn */}
        <nav className="hidden md:flex flex-1 space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-4 py-1 rounded-md hover:bg-neutral-800 transition-colors ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "text-blue-400"
                  : "text-neutral-300"
              }`}
            >
              <item.icon className="h-4 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Menu utilisateur */}
        <div className="relative ml-auto">
         <button
           onClick={() => setIsProfileOpen(!isProfileOpen)}
           className={cn(
             "flex items-center gap-3 rounded-md transition-all duration-200",
             "hover:bg-neutral-800/50 hover:shadow-sm",
             isProfileOpen ? "bg-neutral-800/30" : ""
           )}
         >
           <div className="relative group flex items-center p-0">
             <Avatar className={cn(
               "h-8 w-8 transition-all duration-300 m-0",
               isProfileOpen
                 ? "ring-2 ring-blue-400/50 shadow-[0_0_8px_0_rgba(96,165,250,0.3)]"
                 : "group-hover:ring-1 group-hover:ring-blue-400/30"
             )}>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="hidden md:flex items-center">
              <div className="flex flex-col items-start">
                <span className="text-sm text-neutral-200 font-medium">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-neutral-400">
                  {adminLevel === 'super' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 ml-2 text-neutral-400 transition-all duration-300",
                isProfileOpen ? "rotate-180 text-blue-400" : ""
              )} />
            </div>
          </button>

          {isProfileOpen && (
            <div className={cn(
              "absolute right-0 mt-2 w-56 bg-neutral-900/95 backdrop-blur-sm border border-neutral-700/50 rounded-lg shadow-xl shadow-black/30 py-1 overflow-hidden transition-all duration-300 ease-out",
              "before:content-[''] before:absolute before:-top-2 before:right-3 before:w-4 before:h-4 before:bg-neutral-900 before:border-t before:border-l before:border-neutral-700/50 before:rotate-45 before:z-0",
              isProfileOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1 pointer-events-none"
            )}>
              <form action={adminLogout}>
                <button
                  type="submit"
                  className="flex w-full items-center px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  <span>Déconnexion</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
