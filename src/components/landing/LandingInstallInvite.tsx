"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { LANDING_CTA } from "@/components/landing/landingAssets";

/**
 * Install invitation shown at the bottom of the landing page.
 *
 * The instructions live in a dialog rather than in the footer. The landing is a stack of
 * full-viewport snap panels and this footer is pinned to the last one, so every line added
 * here eats the height the CTA card needs — the panel clips its overflow, and on a phone
 * (where `100svh` is already reduced by the visible browser chrome) three lines of menu
 * directions were enough to cut the block off the bottom of the screen. A dialog has room
 * for the directions and costs the footer nothing.
 *
 * Installing is what gives the notification a name and a channel: a notification coming
 * from a browser tab is attributed to the browser and the bare origin ("Chrome • host"),
 * which no page can change, whereas one coming from the installed app carries the
 * manifest's name and gets its own entry in Android's notification settings — the only
 * place sound and "pop on screen" can be raised. See docs/shared/PUSH_SETUP.md.
 */
export function LandingInstallInvite() {
  const { state, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  // Nothing to invite once the app is installed, and the footer is a bad place for a
  // reminder of something the user has already done.
  if (state === "installed") return null;

  return (
    <>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-300 truncate">
            Installez <span className="font-semibold text-white">Vector Elegans</span>
          </p>
          <p className="text-xs text-neutral-500 truncate">
            Suivi de course et notifications, même application fermée.
          </p>
        </div>
        <Button
          size="sm"
          className={`h-9 px-4 shrink-0 ${LANDING_CTA}`}
          onClick={() => {
            setOutcome(null);
            setOpen(true);
          }}
        >
          <Download className="h-4 w-4 mr-2" aria-hidden />
          Installer l&apos;application
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-blue-500/25 bg-neutral-950 text-white">
          <DialogHeader>
            <DialogTitle>Installer Vector Elegans</DialogTitle>
            <DialogDescription className="text-neutral-400">
              L&apos;installation donne à l&apos;application sa propre entrée dans les
              réglages de notifications Android — c&apos;est là que s&apos;activent le son
              et les fenêtres flottantes.
            </DialogDescription>
          </DialogHeader>

          {/* No web page can open the browser menu or the system settings, so the only
              honest thing to show is where the entry lives on each platform. iOS is named
              because Safari never offers `beforeinstallprompt` at all. */}
          <ul className="space-y-2 text-sm text-neutral-300">
            <li>
              <span className="font-medium text-white">Sur Android :</span> Menu du
              navigateur (⋮) → « Installer l&apos;application »
            </li>
            <li>
              <span className="font-medium text-white">Sur iPhone :</span> Partager →
              « Sur l&apos;écran d&apos;accueil »
            </li>
          </ul>

          {/* Offered only when the browser actually captured an install prompt: it is
              then one tap instead of a trip through the menu. Never shown as a dead
              button, since `promptInstall` would answer `unavailable`. */}
          {state === "promptable" ? (
            <Button
              className={`w-full ${LANDING_CTA}`}
              onClick={() => {
                void (async () => {
                  const result = await promptInstall();
                  setOutcome(
                    result === "accepted"
                      ? "Installation lancée."
                      : "Installation annulée — vous pouvez réessayer depuis le menu du navigateur.",
                  );
                })();
              }}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden />
              Installer directement
            </Button>
          ) : null}

          {outcome ? <p className="text-sm text-neutral-400">{outcome}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
