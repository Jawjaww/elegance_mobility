"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { BRAVE_INSTALL_GUIDANCE } from "@/lib/services/installPrompt";
import { Download, Smartphone } from "lucide-react";

/**
 * Install action for the client portal.
 *
 * Installing is the only lever a web page has over the notification channel: an installed
 * web app gets its own entry in Android's notification settings, where sound and "pop on
 * screen" can be raised. A visited site is stuck with the browser's generic channel.
 *
 * The button only appears when the browser offered `beforeinstallprompt`, because a tap on
 * a button that cannot work is worse than no button — the written path is shown instead.
 */
export function ClientInstallCard() {
  const { state, promptInstall, isBrave } = useInstallPrompt();
  const [outcome, setOutcome] = useState<string | null>(null);

  if (state === "installed") {
    return (
      <div className="flex items-start gap-2 text-sm text-emerald-300">
        <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Application installée. Le son et les fenêtres flottantes se règlent dans les
          réglages de notifications d&apos;Android.
        </span>
      </div>
    );
  }

  // Checked before the two states below, because Brave reaches both of them and can finish
  // neither: it fires `beforeinstallprompt` (so it looks `promptable`) and then fails the
  // install. The green message above still wins, since a Brave user who installed from Chrome
  // is genuinely installed.
  if (isBrave) {
    return (
      <div className="flex items-start gap-2 text-sm text-amber-300">
        <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{BRAVE_INSTALL_GUIDANCE}</span>
      </div>
    );
  }

  if (state === "promptable") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-400">
          Installez l&apos;application pour obtenir sa propre entrée dans les réglages de
          notifications Android — c&apos;est là que s&apos;activent le son et les fenêtres
          flottantes.
        </p>
        {outcome ? <p className="text-sm text-neutral-400">{outcome}</p> : null}
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            void (async () => {
              const result = await promptInstall();
              setOutcome(
                result === "accepted"
                  ? "Installation lancée."
                  : "Installation annulée — le bouton réapparaîtra si le navigateur le permet.",
              );
            })();
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Installer l&apos;application
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-sm text-neutral-400">
      <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
      <span>
        Pour installer l&apos;application, ouvrez le menu du navigateur (⋮) puis
        « Installer l&apos;application » — ou « Ajouter à l&apos;écran d&apos;accueil »
        depuis le menu Partager sur iPhone.
      </span>
    </div>
  );
}
