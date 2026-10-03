"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/database/client";

/** Ligne de public.operator_members qui rattache le compte à une flotte. */
type Membership = {
  operator_id: string;
  role: string;
};

/**
 * Quatre états possibles, jamais combinés : on charge, on a échoué, le compte
 * n'est rattaché à rien, ou il l'est. Un « compte non rattaché » n'est pas une
 * erreur — c'est l'état normal d'un rôle app_operator posé avant la flotte.
 */
type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "unlinked" }
  | { status: "linked"; membership: Membership };

function PageShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-5 lg:space-y-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">
          Tableau de bord opérateur
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Rattachement de votre compte à une flotte.
        </p>
      </div>
      {children}
    </div>
  );
}

export default function OperatorPortalPage() {
  const [state, setState] = useState<PageState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({
          status: "error",
          message: "Session introuvable. Reconnectez-vous.",
        });
        return;
      }

      // La policy operator_members_self_select n'expose que sa propre ligne :
      // le filtre user_id est la lecture attendue, pas un contournement.
      //
      // limit(1) : rien n'interdit à un compte d'être membre de plusieurs
      // flottes. Choisir laquelle afficher est un écran à part entière ; cette
      // coquille montre la première ligne et rien de plus.
      const { data, error } = await supabase
        .from("operator_members")
        .select("operator_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        setState({ status: "unlinked" });
        return;
      }

      setState({ status: "linked", membership: data });
    } catch (error) {
      console.error("[OperatorPortal] lecture du rattachement impossible:", error);
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Lecture du rattachement impossible.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <PageShell>
        <Card className="h-[188px] animate-pulse border-neutral-800 bg-neutral-900/50" />
      </PageShell>
    );
  }

  if (state.status === "error") {
    return (
      <PageShell>
        <Card className="w-full p-6 text-center sm:p-8">
          <p className="text-sm text-neutral-400 sm:text-base">
            Rattachement indisponible.
          </p>
          <p className="mt-2 break-words text-xs text-neutral-500 sm:text-sm">
            {state.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            className="mt-4 min-h-11 w-full px-8 sm:w-auto"
          >
            Réessayer
          </Button>
        </Card>
      </PageShell>
    );
  }

  if (state.status === "unlinked") {
    return (
      <PageShell>
        <Card className="w-full p-6 sm:p-8">
          <h2 className="text-base font-semibold text-neutral-100">
            Compte non rattaché à un opérateur
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Votre compte porte bien le rôle opérateur, mais aucune ligne
            d&apos;operator_members ne le relie à une flotte. Demandez à un
            administrateur de vous rattacher, puis actualisez cette page.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            className="mt-4 min-h-11 w-full px-8 sm:w-auto"
          >
            Actualiser
          </Button>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Card className="p-6 sm:p-8">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Opérateur
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-neutral-200">
              {state.membership.operator_id}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Rôle dans la flotte
            </dt>
            <dd className="mt-1">
              <Badge variant="secondary">{state.membership.role}</Badge>
            </dd>
          </div>
        </dl>
        <p className="mt-6 border-t border-neutral-800 pt-4 text-xs leading-relaxed text-neutral-500">
          Aucune donnée de flotte sur cet écran : les chauffeurs, les véhicules et
          les courses de l&apos;opérateur arriveront dans un prochain lot. Ici on
          confirme seulement le rattachement.
        </p>
      </Card>
    </PageShell>
  );
}
