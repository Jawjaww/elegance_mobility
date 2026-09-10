/** Mirror of SQL fee snapshot + cancel quote (display amounts only, no Stripe). */

export const FEE_TIER_KINDS = [
  "wait",
  "cancel_en_route",
  "cancel_after_arrival",
  "no_show",
] as const;

export type FeeTierKind = (typeof FEE_TIER_KINDS)[number];

export type FeePolicyTier = {
  id?: string;
  kind: FeeTierKind;
  after_minutes: number;
  fee_flat: number;
  fee_per_minute: number;
};

export type FeePolicySnapshot = {
  policy_id?: string;
  heartbeat_minutes: number;
  silence_expire_minutes: number;
  en_route_before_pickup_minutes: number;
  driver_late_grace_minutes: number;
  wait_grace_minutes: number;
  wait_max_minutes: number;
  no_show_flat: number;
  cancel_after_arrival_flat: number;
  tiers: FeePolicyTier[];
};

export type QuoteActor = "client" | "driver" | "preview" | "no-show";

export type CancelQuote = {
  success: boolean;
  billing: "none" | "client_fee" | "waive";
  amount: number;
  reason_code: string;
  delay_kind?: string | null;
  wait_minutes?: number;
  client_may_cancel: boolean;
  driver_may_release: boolean;
  driver_may_noshow: boolean;
  error?: string;
};

export type QuoteRideInput = {
  status: string;
  driverId: string | null;
  driverArrivedAt: string | null;
  pickupTime: string;
  navUpdatedAt: string | null;
  delayKind?: string | null;
};

export type SimulatorScenario =
  | "matching"
  | "far"
  | "en_route"
  | "driver_late"
  | "wait"
  | "in_progress";

const TIER_KIND_SET = new Set<string>(FEE_TIER_KINDS);

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTier(raw: unknown): FeePolicyTier | null {
  if (!isRecord(raw)) return null;
  const kind = asString(raw.kind);
  if (!kind || !TIER_KIND_SET.has(kind)) return null;
  return {
    kind: kind as FeeTierKind,
    after_minutes: asNumber(raw.after_minutes, 0),
    fee_flat: asNumber(raw.fee_flat, 0),
    fee_per_minute: asNumber(raw.fee_per_minute, 0),
  };
}

export function parseFeePolicySnapshot(raw: unknown): FeePolicySnapshot | null {
  if (!isRecord(raw)) return null;
  const tiersRaw = Array.isArray(raw.tiers) ? raw.tiers : [];
  return {
    policy_id: asString(raw.policy_id) ?? undefined,
    heartbeat_minutes: asNumber(raw.heartbeat_minutes, 20),
    silence_expire_minutes: asNumber(raw.silence_expire_minutes, 20),
    en_route_before_pickup_minutes: asNumber(
      raw.en_route_before_pickup_minutes,
      60,
    ),
    driver_late_grace_minutes: asNumber(raw.driver_late_grace_minutes, 20),
    wait_grace_minutes: asNumber(raw.wait_grace_minutes, 5),
    wait_max_minutes: asNumber(raw.wait_max_minutes, 20),
    no_show_flat: asNumber(raw.no_show_flat, 15),
    cancel_after_arrival_flat: asNumber(raw.cancel_after_arrival_flat, 0),
    tiers: tiersRaw.map(parseTier).filter((t): t is FeePolicyTier => t != null),
  };
}

export function parseCancelQuote(raw: unknown): CancelQuote {
  if (!isRecord(raw)) {
    return {
      success: false,
      billing: "none",
      amount: 0,
      reason_code: "error",
      client_may_cancel: false,
      driver_may_release: false,
      driver_may_noshow: false,
      error: "Réponse invalide",
    };
  }
  const success = raw.success !== false;
  const amount = asNumber(raw.amount, 0);
  const billingRaw = asString(raw.billing) ?? "none";
  const billing =
    billingRaw === "client_fee" || billingRaw === "waive" ? billingRaw : "none";
  return {
    success,
    billing,
    amount,
    reason_code: asString(raw.reason_code) ?? "client_cancel_free",
    delay_kind: asString(raw.delay_kind),
    wait_minutes:
      raw.wait_minutes == null ? undefined : asNumber(raw.wait_minutes, 0),
    client_may_cancel: raw.client_may_cancel !== false,
    driver_may_release: raw.driver_may_release === true,
    driver_may_noshow: raw.driver_may_noshow === true,
    error: asString(raw.error) ?? undefined,
  };
}

export function feeFromTiers(
  snap: FeePolicySnapshot,
  kind: FeeTierKind,
  minutes: number,
): number {
  const matching = snap.tiers
    .filter((tier) => tier.kind === kind && tier.after_minutes <= minutes)
    .sort((a, b) => b.after_minutes - a.after_minutes);
  const tier = matching[0];
  if (!tier) return 0;
  return round2(
    tier.fee_flat + tier.fee_per_minute * Math.max(0, minutes - tier.after_minutes),
  );
}

function quoteOk(partial: Omit<CancelQuote, "success">): CancelQuote {
  return { success: true, ...partial };
}

function billingForAmount(amount: number): "none" | "client_fee" {
  return amount > 0 ? "client_fee" : "none";
}

function resolveArrivedQuote(
  snap: FeePolicySnapshot,
  actor: QuoteActor,
  waitMinutes: number,
): CancelQuote {
  const mayNoshow = waitMinutes >= snap.wait_max_minutes;
  if (waitMinutes < snap.wait_grace_minutes) {
    return quoteOk({
      billing: "none",
      amount: 0,
      reason_code: "client_cancel_free",
      delay_kind: "client_late",
      wait_minutes: round2(waitMinutes),
      client_may_cancel: true,
      driver_may_release: false,
      driver_may_noshow: mayNoshow,
    });
  }

  let amount = feeFromTiers(snap, "wait", waitMinutes);
  let reason = "client_cancel_after_arrival";
  if (actor === "driver" || actor === "no-show") {
    amount +=
      feeFromTiers(snap, "no_show", waitMinutes) + snap.no_show_flat;
    reason = "client_no_show";
  } else {
    amount +=
      feeFromTiers(snap, "cancel_after_arrival", waitMinutes) +
      snap.cancel_after_arrival_flat;
  }
  amount = round2(amount);
  return quoteOk({
    billing: billingForAmount(amount),
    amount,
    reason_code: reason,
    delay_kind: "client_late",
    wait_minutes: round2(waitMinutes),
    client_may_cancel: true,
    driver_may_release: false,
    driver_may_noshow: mayNoshow,
  });
}

export function resolveCancelQuote(
  ride: QuoteRideInput,
  snap: FeePolicySnapshot,
  actor: QuoteActor,
  nowMs: number = Date.now(),
): CancelQuote {
  if (ride.status === "in-progress" && actor === "client") {
    return quoteOk({
      billing: "none",
      amount: 0,
      reason_code: "in_progress_blocked",
      client_may_cancel: false,
      driver_may_release: false,
      driver_may_noshow: false,
    });
  }

  if (!ride.driverId) {
    return quoteOk({
      billing: "none",
      amount: 0,
      reason_code: "client_cancel_free",
      delay_kind: ride.delayKind ?? "matching",
      client_may_cancel: true,
      driver_may_release: false,
      driver_may_noshow: false,
    });
  }

  if (ride.driverArrivedAt) {
    const arrived = new Date(ride.driverArrivedAt).getTime();
    const waitMinutes = (nowMs - arrived) / 60_000;
    return resolveArrivedQuote(snap, actor, waitMinutes);
  }

  const pickup = new Date(ride.pickupTime).getTime();
  const lateMs = snap.driver_late_grace_minutes * 60_000;
  if (pickup + lateMs < nowMs) {
    return quoteOk({
      billing: "none",
      amount: 0,
      reason_code: "client_cancel_driver_late",
      delay_kind: "driver_late",
      client_may_cancel: true,
      driver_may_release: true,
      driver_may_noshow: false,
    });
  }

  const enRouteMs = snap.en_route_before_pickup_minutes * 60_000;
  const isEnRoute =
    ride.navUpdatedAt != null || pickup <= nowMs + enRouteMs;
  if (isEnRoute) {
    const amount = feeFromTiers(snap, "cancel_en_route", 0);
    return quoteOk({
      billing: billingForAmount(amount),
      amount,
      reason_code: "client_cancel_en_route",
      delay_kind: ride.delayKind ?? null,
      client_may_cancel: true,
      driver_may_release: false,
      driver_may_noshow: false,
    });
  }

  return quoteOk({
    billing: "none",
    amount: 0,
    reason_code: "client_cancel_free",
    delay_kind: ride.delayKind ?? null,
    client_may_cancel: true,
    driver_may_release: false,
    driver_may_noshow: false,
  });
}

function isoMinutesFromNow(minutes: number, nowMs: number): string {
  return new Date(nowMs + minutes * 60_000).toISOString();
}

export function simulateQuote(
  snap: FeePolicySnapshot,
  scenario: SimulatorScenario,
  waitMinutes: number,
  actor: QuoteActor = "client",
  nowMs: number = Date.now(),
): CancelQuote {
  const farPickup = isoMinutesFromNow(
    snap.en_route_before_pickup_minutes + 30,
    nowMs,
  );
  const latePickup = isoMinutesFromNow(
    -(snap.driver_late_grace_minutes + 1),
    nowMs,
  );
  const arrivedAt = isoMinutesFromNow(-Math.max(0, waitMinutes), nowMs);

  const base: QuoteRideInput = {
    status: "scheduled",
    driverId: "driver",
    driverArrivedAt: null,
    pickupTime: farPickup,
    navUpdatedAt: null,
    delayKind: null,
  };

  if (scenario === "matching") {
    return resolveCancelQuote(
      { ...base, status: "delayed", driverId: null, delayKind: "matching" },
      snap,
      actor,
      nowMs,
    );
  }
  if (scenario === "far") {
    return resolveCancelQuote(base, snap, actor, nowMs);
  }
  if (scenario === "en_route") {
    return resolveCancelQuote(
      { ...base, navUpdatedAt: new Date(nowMs).toISOString() },
      snap,
      actor,
      nowMs,
    );
  }
  if (scenario === "driver_late") {
    return resolveCancelQuote(
      { ...base, pickupTime: latePickup },
      snap,
      actor,
      nowMs,
    );
  }
  if (scenario === "wait") {
    return resolveCancelQuote(
      { ...base, driverArrivedAt: arrivedAt, pickupTime: latePickup },
      snap,
      actor,
      nowMs,
    );
  }
  return resolveCancelQuote(
    { ...base, status: "in-progress" },
    snap,
    actor,
    nowMs,
  );
}

export function buildFeePolicySnapshot(
  policy: Omit<FeePolicySnapshot, "tiers"> & { id?: string },
  tiers: FeePolicyTier[],
): FeePolicySnapshot {
  return {
    policy_id: policy.id ?? policy.policy_id,
    heartbeat_minutes: policy.heartbeat_minutes,
    silence_expire_minutes: policy.silence_expire_minutes,
    en_route_before_pickup_minutes: policy.en_route_before_pickup_minutes,
    driver_late_grace_minutes: policy.driver_late_grace_minutes,
    wait_grace_minutes: policy.wait_grace_minutes,
    wait_max_minutes: policy.wait_max_minutes,
    no_show_flat: policy.no_show_flat,
    cancel_after_arrival_flat: policy.cancel_after_arrival_flat,
    tiers: tiers.map((tier) => ({
      kind: tier.kind,
      after_minutes: tier.after_minutes,
      fee_flat: tier.fee_flat,
      fee_per_minute: tier.fee_per_minute,
    })),
  };
}

export const DEFAULT_PLATFORM_SNAPSHOT: FeePolicySnapshot = {
  policy_id: "a1000000-0000-4000-8000-000000000001",
  heartbeat_minutes: 20,
  silence_expire_minutes: 20,
  en_route_before_pickup_minutes: 60,
  driver_late_grace_minutes: 20,
  wait_grace_minutes: 5,
  wait_max_minutes: 20,
  no_show_flat: 15,
  cancel_after_arrival_flat: 0,
  tiers: [
    { kind: "wait", after_minutes: 5, fee_flat: 0, fee_per_minute: 1 },
    { kind: "cancel_en_route", after_minutes: 0, fee_flat: 10, fee_per_minute: 0 },
    {
      kind: "cancel_after_arrival",
      after_minutes: 0,
      fee_flat: 0,
      fee_per_minute: 0,
    },
    { kind: "no_show", after_minutes: 0, fee_flat: 15, fee_per_minute: 0 },
  ],
};

export function formatFeeEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export const TIER_KIND_LABELS: Record<FeeTierKind, string> = {
  wait: "Palier attente",
  cancel_en_route: "Palier en route",
  cancel_after_arrival: "Palier après arrivée",
  no_show: "Palier no-show",
};

export const SIMULATOR_SCENARIO_LABELS: Record<SimulatorScenario, string> = {
  matching: "Personne n’a pris la course",
  far: "Chauffeur assigné, encore loin",
  en_route: "Chauffeur déjà parti",
  driver_late: "Chauffeur en retard",
  wait: "Chauffeur arrivé, on attend",
  in_progress: "Course commencée",
};
