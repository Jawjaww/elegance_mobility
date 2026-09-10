import { supabase } from "@/lib/database/client";
import type { Database, Json } from "@/lib/types/database.types";
import {
  buildFeePolicySnapshot,
  parseCancelQuote,
  parseFeePolicySnapshot,
  type CancelQuote,
  type FeePolicySnapshot,
  type FeePolicyTier,
  type FeeTierKind,
} from "@/lib/rides/rideFeePolicy";

type PolicyRow = Database["public"]["Tables"]["ride_fee_policies"]["Row"];
type PolicyUpdate = Database["public"]["Tables"]["ride_fee_policies"]["Update"];
type TierRow = Database["public"]["Tables"]["ride_fee_policy_tiers"]["Row"];
type TierInsert = Database["public"]["Tables"]["ride_fee_policy_tiers"]["Insert"];

export type RideFeePolicyBundle = {
  policy: PolicyRow;
  tiers: FeePolicyTier[];
};

function rowToTier(row: TierRow): FeePolicyTier {
  return {
    id: row.id,
    kind: row.kind as FeeTierKind,
    after_minutes: row.after_minutes,
    fee_flat: Number(row.fee_flat),
    fee_per_minute: Number(row.fee_per_minute),
  };
}

export async function loadPlatformFeePolicy(): Promise<RideFeePolicyBundle> {
  const { data: policy, error } = await supabase
    .from("ride_fee_policies")
    .select("*")
    .eq("scope_kind", "platform")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!policy) throw new Error("Politique plateforme introuvable");

  const { data: tierRows, error: tierError } = await supabase
    .from("ride_fee_policy_tiers")
    .select("*")
    .eq("policy_id", policy.id)
    .order("kind", { ascending: true })
    .order("after_minutes", { ascending: true });

  if (tierError) throw new Error(tierError.message);

  return {
    policy,
    tiers: (tierRows ?? []).map(rowToTier),
  };
}

export async function savePlatformFeePolicy(
  policyId: string,
  fields: PolicyUpdate,
  tiers: FeePolicyTier[],
): Promise<RideFeePolicyBundle> {
  const { error: updateError } = await supabase
    .from("ride_fee_policies")
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", policyId);

  if (updateError) throw new Error(updateError.message);

  const { error: deleteError } = await supabase
    .from("ride_fee_policy_tiers")
    .delete()
    .eq("policy_id", policyId);

  if (deleteError) throw new Error(deleteError.message);

  const payload: TierInsert[] = tiers.map((tier) => ({
    policy_id: policyId,
    kind: tier.kind,
    after_minutes: tier.after_minutes,
    fee_flat: tier.fee_flat,
    fee_per_minute: tier.fee_per_minute,
  }));

  if (payload.length > 0) {
    const { error: insertError } = await supabase
      .from("ride_fee_policy_tiers")
      .insert(payload);
    if (insertError) throw new Error(insertError.message);
  }

  return loadPlatformFeePolicy();
}

export function snapshotFromPolicyFields(
  policyId: string,
  fields: {
    heartbeat_minutes: number;
    silence_expire_minutes: number;
    en_route_before_pickup_minutes: number;
    driver_late_grace_minutes: number;
    wait_grace_minutes: number;
    wait_max_minutes: number;
    no_show_flat: number;
    cancel_after_arrival_flat: number;
  },
  tiers: FeePolicyTier[],
): FeePolicySnapshot {
  return buildFeePolicySnapshot({ id: policyId, ...fields }, tiers);
}

export function snapshotFromBundle(
  bundle: RideFeePolicyBundle,
): FeePolicySnapshot {
  return snapshotFromPolicyFields(
    bundle.policy.id,
    {
      heartbeat_minutes: bundle.policy.heartbeat_minutes,
      silence_expire_minutes: bundle.policy.silence_expire_minutes,
      en_route_before_pickup_minutes:
        bundle.policy.en_route_before_pickup_minutes,
      driver_late_grace_minutes: bundle.policy.driver_late_grace_minutes,
      wait_grace_minutes: bundle.policy.wait_grace_minutes,
      wait_max_minutes: bundle.policy.wait_max_minutes,
      no_show_flat: Number(bundle.policy.no_show_flat),
      cancel_after_arrival_flat: Number(
        bundle.policy.cancel_after_arrival_flat,
      ),
    },
    bundle.tiers,
  );
}

export async function previewRideCancelQuote(
  rideId: string,
): Promise<CancelQuote> {
  const { data, error } = await supabase.rpc(
    "preview_ride_cancel_quote" as never,
    { p_ride_id: rideId } as never,
  );
  if (error) throw new Error(error.message);
  return parseCancelQuote(data);
}

export async function adminSetRideFeeSnapshot(
  rideId: string,
  snapshot: FeePolicySnapshot,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    "admin_set_ride_fee_snapshot" as never,
    {
      p_ride_id: rideId,
      p_snapshot: snapshot as unknown as Json,
    } as never,
  );
  if (error) throw new Error(error.message);
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    data.success === false
  ) {
    const message =
      "error" in data && typeof data.error === "string"
        ? data.error
        : "Mise à jour du snapshot impossible";
    throw new Error(message);
  }
}

export async function reapplyPlatformSnapshotToRide(
  rideId: string,
): Promise<FeePolicySnapshot> {
  const bundle = await loadPlatformFeePolicy();
  const snapshot = snapshotFromBundle(bundle);
  await adminSetRideFeeSnapshot(rideId, snapshot);
  return snapshot;
}

export async function patchRideFeeSnapshot(
  rideId: string,
  current: unknown,
  patch: Partial<FeePolicySnapshot>,
): Promise<FeePolicySnapshot> {
  const parsed = parseFeePolicySnapshot(current) ?? snapshotFromBundle(
    await loadPlatformFeePolicy(),
  );
  const next: FeePolicySnapshot = { ...parsed, ...patch, tiers: parsed.tiers };
  await adminSetRideFeeSnapshot(rideId, next);
  return next;
}
