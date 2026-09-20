"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { LANDING_CTA } from "@/components/landing/landingAssets";

/**
 * Install invitation shown at the bottom of the landing page.
 *
 * Placed in the footer on purpose: the landing is a stack of full-viewport snap panels and
 * the footer is pinned to the last one, so this is visible without an extra scroll — and
 * without adding height to a panel that is already exactly one screen tall, which an
 * `overflow-hidden` panel would clip on a short phone.
 *
 * Installing is what gives the notification a name and a channel: a notification coming
 * from a browser tab is attributed to the browser and the bare origin ("Chrome • host"),
 * which no page can change, whereas one coming from the installed app carries the
 * manifest's name and gets its own entry in Android's notification settings — the only
 * place sound and "pop on screen" can be raised. See docs/shared/PUSH_SETUP.md.
 *
 * The button only appears when the browser actually offered an install prompt, because a
 * button that cannot work is worse than instructions.
 */
export function LandingInstallInvite() {
  const { state, promptInstall } = useInstallPrompt();
  const [outcome, setOutcome] = useState<string | null>(null);

  // Already installed: there is nothing to invite, and the footer is a bad place for a
  // reminder of something the user has already done.
  if (state === "installed") return null;

  return (
    <div className="border-t border-blue-500/10 pt-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <p className="text-sm text-neutral-300">
            Installez <span className="font-semibold text-white">Vector Elegans</span>
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Suivi de course et notifications, même application fermée.
          </p>
        </div>

        {state === "promptable" ? (
          <Button
            size="sm"
            className={`h-9 px-5 shrink-0 ${LANDING_CTA}`}
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
            Installer
          </Button>
        ) : (
          // iOS never fires `beforeinstallprompt`, and Chrome may not either: the browser
          // menu is then the only way in, so it is spelled out rather than left to guess.
          <p className="text-xs text-neutral-500 text-center sm:text-right shrink-0">
            Menu du navigateur (⋮) → « Installer l&apos;application »
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            iPhone : Partager → « Sur l&apos;écran d&apos;accueil »
          </p>
        )}
      </div>
      {outcome ? (
        <p className="max-w-7xl mx-auto text-xs text-neutral-400 mt-2 text-center sm:text-right">
          {outcome}
        </p>
      ) : null}
    </div>
  );
}
