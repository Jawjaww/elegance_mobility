"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createInstallPromptController,
  isBraveBrowser,
  type InstallOutcome,
  type InstallState,
} from "@/lib/services/installPrompt";

/**
 * Exposes the install state and the browser's install dialog.
 *
 * The state starts at `manual` rather than at the controller's real value: the server
 * renders this component too, and `display-mode` differs between the server (no match)
 * and an installed client, which would be a hydration mismatch.
 */
export function useInstallPrompt() {
  const [controller] = useState(() =>
    typeof window === "undefined"
      ? null
      : createInstallPromptController(window, navigator),
  );
  const [state, setState] = useState<InstallState>("manual");
  // Starts false for the same hydration reason as the state above, then settles in the
  // effect: Brave is chrome we must not advise to a user who cannot benefit from it.
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    setIsBrave(isBraveBrowser(navigator));
  }, []);

  useEffect(() => {
    if (!controller) return;

    setState(controller.getState());
    const unsubscribe = controller.subscribe(() => {
      setState(controller.getState());
    });

    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    return (await controller?.promptInstall()) ?? "unavailable";
  }, [controller]);

  return { state, promptInstall, isBrave };
}
