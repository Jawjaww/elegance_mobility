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
import {
  BRAVE_INSTALL_GUIDANCE,
  shouldOfferDirectInstall,
} from "@/lib/services/installPrompt";
import { LANDING_CTA } from "@/components/landing/landingAssets";

/**
 * Install invitation shown at the bottom of the landing page.
 *
 * The directions live in a dialog rather than in the footer. The landing is a stack of
 * full-viewport snap panels and this footer is pinned to the last one, which clips its
 * overflow, so every line added there is paid for by cutting the bottom of the panel. A
 * dialog costs the footer nothing.
 *
 * The copy is deliberately spare. The footer stays visible behind the overlay, so the dialog
 * first led with "Installer Vector Elegans", then "L'installation …", then the quoted label,
 * then an "Installer directement" button — the footer's own wording four times over, in two
 * blocks the reader takes in at once. The footer itself repeated the action too, pairing a
 * "Installez Vector Elegans" lead-in with an "Installer l'application" button; it is now a
 * single button carrying the wording. The verb `Installer` therefore survives exactly once in
 * this file, inside the quotes, where it is the browser's label to look for rather than our
 * own copy. `landingInstallInvite.test.ts` pins that count.
 *
 * Installing is what gives the notification a name and a channel: a notification from a
 * browser tab is attributed to the browser and the bare origin, which no page can change,
 * whereas one from the installed app carries the manifest's name and gets its own entry in
 * Android's notification settings — the only place sound and "pop on screen" can be
 * raised. See docs/shared/PUSH_SETUP.md.
 */
export function LandingInstallInvite() {
  const { state, promptInstall, isBrave } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  // Nothing to invite once the app is installed, and the footer is a bad place for a
  // reminder of something the user has already done.
  if (state === "installed") return null;

  return (
    <>
      {/* One element, not three. The lead-in text, the subtitle and the button used to sit
          here as a stack, and since this footer stays visible behind the dialog, "Installez
          Vector Elegans" and "Installer l'application" announced the same action twice, a few
          pixels apart. The action now carries the wording on its own; the value proposition
          lives in the dialog. */}
      <div className="max-w-7xl mx-auto flex justify-center">
        <Button
          size="sm"
          className={`h-9 px-5 ${LANDING_CTA}`}
          onClick={() => {
            setOutcome(null);
            setOpen(true);
          }}
        >
          <Download className="h-4 w-4 mr-2" aria-hidden />
          Installez Vector Elegans
        </Button>
      </div>

      {/* Padding and gaps are widened from the component defaults, and each direction is
          split over two lines: the two platforms read as two blocks instead of one dense
          paragraph. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 border-blue-500/25 bg-neutral-950 p-6 text-white sm:p-8">
          {/* `space-y-2` on the header rather than `space-y-0` plus a `mt-2` on the
              description: the `space-y-*` selector outranks a plain `mt-*`, so the margin
              was being overridden and the title sat flush against the description —
              measured at 0px before this was changed. */}
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Ajouter à votre téléphone</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Pour recevoir les notifications avec son et fenêtre flottante.
            </DialogDescription>
          </DialogHeader>

          {/* No web page can open the browser menu or the system settings, so the only
              honest thing to show is where the entry lives on each platform. iOS is named
              because Safari never offers `beforeinstallprompt` at all.

              Brave gets one line instead of both, and it is the same line the account page
              shows: the directions below point at an entry Brave offers and then fails, so
              naming it would be advising a step we know does not work. */}
          {isBrave ? (
            <p className="mt-8 text-sm leading-relaxed text-amber-300">
              {BRAVE_INSTALL_GUIDANCE}
            </p>
          ) : (
            <ul className="mt-8 space-y-7">
              <li>
                <p className="text-xs font-medium uppercase tracking-wider text-blue-300/80">
                  Sur Android
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Menu du navigateur (⋮)
                  <span className="mt-1 block font-medium text-white">
                    → « Installer l&apos;application »
                  </span>
                </p>
              </li>
              <li>
                <p className="text-xs font-medium uppercase tracking-wider text-blue-300/80">
                  Sur iPhone
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                  Partager
                  <span className="mt-1 block font-medium text-white">
                    → « Sur l&apos;écran d&apos;accueil »
                  </span>
                </p>
              </li>
            </ul>
          )}

          {/* Offered only when the browser actually captured an install prompt *and* can
              finish one: it is then one tap instead of a trip through the menu. Never shown
              as a dead button, since `promptInstall` would answer `unavailable` on a browser
              that did not offer the event, and Brave fails the install after accepting it. */}
          {shouldOfferDirectInstall(state, isBrave) ? (
            <Button
              className={`mt-8 w-full ${LANDING_CTA}`}
              onClick={() => {
                void (async () => {
                  const result = await promptInstall();
                  setOutcome(
                    result === "accepted"
                      ? "Ajout lancé."
                      : "Ajout annulé — vous pouvez réessayer depuis le menu du navigateur.",
                  );
                })();
              }}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden />
              Ajouter directement
            </Button>
          ) : null}

          {outcome ? <p className="mt-4 text-sm text-neutral-400">{outcome}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
