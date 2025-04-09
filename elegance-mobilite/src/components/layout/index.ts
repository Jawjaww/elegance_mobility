// faut mettre tout les liens necessaires contenus dans le dossier pour faciliter la navigation dans le projet let que ClientHeader.ts sachant qu'on utilise nextjs 15 et son systeme de routage moderne
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AuthUser } from "@/lib/database/server"
import { Button } from "@/components/ui/button"
import ClientMobileMenu from "./ClientMobileNav"   