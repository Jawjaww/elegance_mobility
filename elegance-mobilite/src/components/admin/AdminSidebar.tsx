import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, 
  Users, 
  Settings, 
  Map, 
  Calendar, 
  LogOut, 
  Home,
  BarChart,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart,
      exact: true,
    },
    {
      name: 'Réservations',
      href: '/admin/reservations',
      icon: Calendar,
    },
    {
      name: 'Utilisateurs',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Trajets',
      href: '/admin/rides',
      icon: Map,
    },
    {
      name: 'Chauffeurs',
      href: '/admin/drivers',
      icon: Clock,
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-neutral-900 border-r border-neutral-800 p-4 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="mb-6 px-4 py-2">
          <h2 className="text-xl font-bold text-white">Vector Admin</h2>
          <p className="text-sm text-neutral-400">Tableau de bord</p>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-blue-900/20 text-blue-400"
                      : "text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-4 border-t border-neutral-800">
          <Link
            href="/"
            className="flex items-center px-4 py-2 text-sm font-medium text-neutral-300 rounded-md hover:bg-neutral-800/50 hover:text-white"
          >
            <Home className="mr-3 h-5 w-5" />
            Retour au site
          </Link>
          
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-neutral-800/50 hover:text-red-300"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
