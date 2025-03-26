"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/admin/UserNav";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Réserver", href: "/reservation" },
  { name: "Tarifs", href: "/rates" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-black/50">
      <nav className="container flex h-16 items-center">
        <div className="flex flex-1 items-center justify-between">
          <Link href="/" className="font-medium">
            Élégance Mobilité
          </Link>
          {!isAdmin && (
            <div className="hidden md:flex md:gap-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors hover:text-neutral-50",
                    pathname === item.href
                      ? "text-neutral-50"
                      : "text-neutral-400"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <UserNav />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
                <Link href="/reservation">
                  <Button size="sm">Réserver</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
