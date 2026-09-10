"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { LANDING_CTA } from "@/components/landing/landingAssets";
import {
  DelayPolicyFields,
  FeesPolicyFields,
  MatchingPolicyFields,
  policyRowToForm,
  withStableTierIds,
  type PolicyFormValues,
} from "@/components/admin/ride-policies/RideFeePolicyForm";
import { RideFeePolicySimulator } from "@/components/admin/ride-policies/RideFeePolicySimulator";
import { PolicyChip } from "@/components/admin/ride-policies/policyLayout";
import {
  loadPlatformFeePolicy,
  savePlatformFeePolicy,
  snapshotFromPolicyFields,
} from "@/lib/services/rideFeePolicyAdminService";
import { formatFeeEuro } from "@/lib/rides/rideFeePolicy";
import type { FeePolicyTier, QuoteActor, SimulatorScenario } from "@/lib/rides/rideFeePolicy";
import type { Database } from "@/lib/types/database.types";

type PolicyUpdate = Database["public"]["Tables"]["ride_fee_policies"]["Update"];
type PolicyTab = "heartbeat" | "cancel" | "examples";

function formToUpdate(values: PolicyFormValues): PolicyUpdate {
  return {
    name: values.name.trim() || "Politique plateforme",
    heartbeat_minutes: values.heartbeat_minutes,
    silence_expire_minutes: values.silence_expire_minutes,
    en_route_before_pickup_minutes: values.en_route_before_pickup_minutes,
    driver_late_grace_minutes: values.driver_late_grace_minutes,
    wait_grace_minutes: values.wait_grace_minutes,
    wait_max_minutes: values.wait_max_minutes,
    no_show_flat: values.no_show_flat,
    cancel_after_arrival_flat: values.cancel_after_arrival_flat,
  };
}

function minutesLabel(value: number): string {
  return `${value} min`;
}

export default function RidePoliciesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<PolicyTab>("heartbeat");
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [values, setValues] = useState<PolicyFormValues | null>(null);
  const [tiers, setTiers] = useState<FeePolicyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scenario, setScenario] = useState<SimulatorScenario>("en_route");
  const [waitMinutes, setWaitMinutes] = useState(8);
  const [actor, setActor] = useState<QuoteActor>("client");

  const load = useCallback(async () => {
    try {
      const bundle = await loadPlatformFeePolicy();
      setPolicyId(bundle.policy.id);
      setValues(policyRowToForm(bundle.policy));
      setTiers(withStableTierIds(bundle.tiers));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Impossible de charger la politique",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = useMemo(() => {
    if (!values || !policyId) return null;
    return snapshotFromPolicyFields(policyId, values, tiers);
  }, [policyId, values, tiers]);

  const handleSave = async () => {
    if (!policyId || !values) return;
    setSaving(true);
    try {
      const bundle = await savePlatformFeePolicy(
        policyId,
        formToUpdate(values),
        tiers,
      );
      setValues(policyRowToForm(bundle.policy));
      setTiers(withStableTierIds(bundle.tiers));
      toast({
        title: "Politique enregistrée",
        description:
          "Les nouvelles courses prennent un snapshot. Les courses existantes restent inchangées.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de l'enregistrement",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">
            Politique courses
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-400">
            Ces durées s&apos;appliquent aux <strong className="font-medium text-neutral-300">nouvelles</strong>{" "}
            courses. Une course déjà créée garde ses règles. Rien n&apos;est
            débité tout seul.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            disabled={loading || saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Actualiser
          </Button>
          <Button
            size="sm"
            className={LANDING_CTA}
            disabled={loading || saving || !values}
            onClick={() => void handleSave()}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {loading || !values ? (
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-neutral-800/80" />
          <div className="h-48 animate-pulse rounded-xl bg-neutral-800/80" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <PolicyChip
              tone="matching"
              label="Heartbeat"
              gloss="Cycle de recherche"
              value={minutesLabel(values.heartbeat_minutes)}
            />
            <PolicyChip
              tone="matching"
              label="Silence"
              gloss="Sans réponse après pause"
              value={minutesLabel(values.silence_expire_minutes)}
            />
            <PolicyChip
              tone="delays"
              label="Grâce chauffeur"
              gloss="Retard, pas encore arrivé"
              value={minutesLabel(values.driver_late_grace_minutes)}
            />
            <PolicyChip
              tone="fees"
              label="No-show"
              gloss="Client absent"
              value={formatFeeEuro(values.no_show_flat)}
            />
          </div>

          <Tabs
            value={tab}
            onValueChange={(next) => setTab(next as PolicyTab)}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
              <TabsTrigger value="heartbeat">Heartbeat</TabsTrigger>
              <TabsTrigger value="cancel">Retards et frais</TabsTrigger>
              <TabsTrigger value="examples">Exemples</TabsTrigger>
            </TabsList>
            <TabsContent value="heartbeat" className="mt-4">
              <MatchingPolicyFields values={values} onChange={setValues} />
            </TabsContent>
            <TabsContent value="cancel" className="mt-4 space-y-4">
              <DelayPolicyFields values={values} onChange={setValues} />
              <FeesPolicyFields
                values={values}
                tiers={tiers}
                onChange={setValues}
                onTiersChange={setTiers}
              />
            </TabsContent>
            <TabsContent value="examples" className="mt-4">
              {snapshot ? (
                <RideFeePolicySimulator
                  snapshot={snapshot}
                  scenario={scenario}
                  waitMinutes={waitMinutes}
                  actor={actor}
                  onScenarioChange={setScenario}
                  onWaitChange={setWaitMinutes}
                  onActorChange={setActor}
                />
              ) : null}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
