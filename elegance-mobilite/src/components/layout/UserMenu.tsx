'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/login/actions';
import type { AuthUser } from '@/lib/database/server';
import { isAdmin } from '@/lib/utils/roles';
import { User, Settings, LogOut, Shield } from 'lucide-react'; // Importation des icônes

interface UserMenuProps {
  user?: AuthUser | null;
}

// Fonction pour générer une couleur dynamique
const generateColor = (email: string | undefined) => {
  const colors = ['#4F46E5', '#059669', '#D97706', '#EA580C', '#9333EA'];
  const index = email ? email.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.refresh();
    router.push('/login');
  };

  if (!user) return null;

  const isAdminUser = isAdmin(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 focus:outline-none">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full font-semibold uppercase"
            style={{
              backgroundColor: generateColor(user.email), // Couleur dynamique basée sur l'email
              color: '#FFFFFF',
            }}
          >
            {(user.user_metadata?.name?.[0] || user.email?.[0] || '').toUpperCase()}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mr-4">
        <div className="px-3 py-2">
          <p className="text-sm font-medium leading-none">{user.user_metadata?.name || user.email}</p>
          <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/my-account')}>
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/my-account/settings')}>
          <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
          Paramètres
        </DropdownMenuItem>
        {isAdminUser && (
          <DropdownMenuItem onClick={() => router.push('/backoffice-portal')}>
            <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
            Administration
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleLogout()}>
          <LogOut className="mr-2 h-4 w-4 text-red-500" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
