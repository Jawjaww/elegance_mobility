"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Lock,
  Bell,
  CalendarClock,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";
import {
  ACCOUNT_CARD,
  ACCOUNT_ICON_WRAP,
  ACCOUNT_PAGE,
  ACCOUNT_ROW,
} from "@/components/account/accountUi";
import { supabase } from "@/lib/database/client";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  {
    href: "/my-account/reservations",
    icon: CalendarClock,
    title: "Mes réservations",
    description: "Consultez l'historique et le statut de vos courses",
  },
  {
    href: "/my-account/personal-info",
    icon: UserIcon,
    title: "Informations personnelles",
    description: "Nom, téléphone",
  },
  {
    href: "/my-account/email",
    icon: Mail,
    title: "Adresse email",
    description: "Modifier votre email",
  },
  {
    href: "/my-account/password",
    icon: Lock,
    title: "Mot de passe",
    description: "Changer votre mot de passe",
  },
  {
    href: "/my-account/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Gérer vos préférences de notification",
  },
  {
    href: "/my-account/settings",
    icon: Settings,
    title: "Paramètres",
    description: "Préférences générales",
  },
] as const;

export default function MyAccount() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/auth/login?redirectTo=/my-account");
          return;
        }
        setUser(user);
      } catch (err) {
        console.error("Erreur récupération user client-side", err);
        router.replace("/auth/login?redirectTo=/my-account");
      } finally {
        setIsChecking(false);
      }
    };
    check();
  }, [router]);

  if (isChecking || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const firstName = user?.user_metadata?.first_name || user?.first_name || "";
  const lastName = user?.user_metadata?.last_name || user?.last_name || "";
  const displayName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : user.email?.split("@")[0] || "";

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return user.email ? user.email.split("@")[0][0].toUpperCase() : "?";
  };

  const userAvatar = user.avatar_url || user.user_metadata?.avatar_url || null;

  return (
    <div className={cn(ACCOUNT_PAGE, "space-y-3")}>
      <div className={cn(ACCOUNT_CARD, "p-4")}>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-blue-500/30 bg-neutral-900">
            {userAvatar ? <AvatarImage src={userAvatar} alt="" /> : null}
            <AvatarFallback className="bg-blue-500/15 text-lg font-semibold text-blue-200">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-neutral-100">
              {displayName}
            </h1>
            <p className="truncate text-sm text-neutral-400">{user.email}</p>
          </div>
        </div>
      </div>

      <StaggerContainer className="grid gap-2">
        {MENU_ITEMS.map((item) => (
          <StaggerItem key={item.href}>
            <Link href={item.href} className={cn(ACCOUNT_ROW, "py-3")}>
              <div className={ACCOUNT_ICON_WRAP}>
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-neutral-100">{item.title}</h2>
                <p className="text-sm text-neutral-400">{item.description}</p>
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-neutral-500"
                aria-hidden
              />
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
