"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User2 } from "lucide-react";
import { supabase } from "@/lib/database/client";
import { cn } from "@/lib/utils";

export function PublicAuthActions({
  hideLoginLink = false,
  loginButtonClassName,
}: Readonly<{
  hideLoginLink?: boolean;
  loginButtonClassName?: string;
}>) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setUserEmail(user?.email ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUserEmail(session?.user?.email ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

  const avatarFallback = userEmail?.[0]?.toUpperCase() ?? "C";

  let authAction: ReactNode = null;
  if (userEmail) {
    authAction = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full"
            aria-label="Menu compte"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src="/avatars/client.png"
                alt="Avatar"
                onError={(e) => {
                  e.currentTarget.src = "/avatars/default-avatar.png";
                }}
              />
              <AvatarFallback className="bg-blue-600 text-white">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] p-2">
          <DropdownMenuItem asChild>
            <Link href="/my-account" className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              <span>Mon compte</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-red-500"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } else if (!hideLoginLink) {
    authAction = (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn(
          "text-neutral-300 hover:bg-white/10 hover:text-white",
          loginButtonClassName,
        )}
      >
        <Link href="/auth/login">Connexion</Link>
      </Button>
    );
  }

  return authAction;
}
