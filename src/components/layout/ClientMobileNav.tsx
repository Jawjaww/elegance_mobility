"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Car, Calendar, Home, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/database/client";
import { isCustomer } from "@/lib/utils/roles";
import { getUserRole } from "@/lib/utils/auth-helpers";
import { resolveActiveNavHref } from "@/lib/utils/bottomNavActive";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/reservation", label: "Réserver", Icon: Car },
  { href: "/my-account/reservations", label: "Mes réservations", Icon: Calendar },
  { href: "/my-account", label: "Compte", Icon: UserIcon },
] as const;

const NAV_HREFS = NAV_ITEMS.map((item) => item.href);

export default function ClientMobileNav() {
  const pathname = usePathname() || "";
  const [isCustomerRole, setIsCustomerRole] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsCustomerRole(isCustomer(getUserRole(user)));
    };
    checkRole();
  }, []);

  if (!isCustomerRole) return null;

  // One answer for the whole bar, rather than one comparison per entry: `Compte` (`/my-account`)
  // is the parent of `Mes réservations` (`/my-account/reservations`), so a per-entry prefix test
  // lit both of them on the reservations page. `bottomNavActive.ts` holds the rule — the longest
  // declared prefix wins — and why.
  const activeHref = resolveActiveNavHref(pathname, NAV_HREFS);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-blue-500/15 bg-neutral-950/85 backdrop-blur-xl md:hidden">
      <div className="h-20 px-6 flex justify-evenly items-center">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={activeHref === href ? "page" : undefined}
            className={cn(
              "flex flex-col items-center transition-transform duration-300 ease-in-out",
              activeHref === href
                ? "text-blue-400 scale-110"
                : "text-neutral-300 hover:text-neutral-100 hover:scale-105",
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
