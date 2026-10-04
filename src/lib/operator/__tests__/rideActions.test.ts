import {
  canOperatorCancel,
  canOperatorReassign,
  OPERATOR_CANCELLABLE_STATUSES,
  OPERATOR_REASSIGNABLE_STATUSES,
  RIDE_STATUS_LABELS,
  rideStatusLabel,
} from "../rideActions";

/**
 * Ces règles sont une COPIE côté client de ce que `_cancel_ride_core` et
 * `_reassign_ride_core` appliquent côté serveur. Elles ne servent qu'à ne pas offrir un bouton
 * qui échouera : le serveur reste l'autorité, et une divergence se traduirait par un bouton mort.
 * D'où ces tests, qui figent les deux listes telles que le SQL les exprime.
 */
describe("operator ride actions", () => {
  it("autorise l'annulation sur les statuts que le serveur accepte", () => {
    expect(canOperatorCancel("pending")).toBe(true);
    expect(canOperatorCancel("scheduled")).toBe(true);
    expect(canOperatorCancel("in-progress")).toBe(true);
    expect(canOperatorCancel("delayed")).toBe(true);
    expect(canOperatorCancel("no-show")).toBe(true);
  });

  it("refuse l'annulation sur les statuts terminaux", () => {
    expect(canOperatorCancel("completed")).toBe(false);
    expect(canOperatorCancel("client-canceled")).toBe(false);
    expect(canOperatorCancel("driver-canceled")).toBe(false);
    expect(canOperatorCancel("admin-canceled")).toBe(false);
  });

  it("n'autorise la réaffectation que sur pending, scheduled et delayed", () => {
    expect(canOperatorReassign("pending")).toBe(true);
    expect(canOperatorReassign("scheduled")).toBe(true);
    expect(canOperatorReassign("delayed")).toBe(true);

    // Le serveur refuse ces trois-là : une course déjà partie ou terminée ne se réaffecte pas.
    expect(canOperatorReassign("in-progress")).toBe(false);
    expect(canOperatorReassign("no-show")).toBe(false);
    expect(canOperatorReassign("completed")).toBe(false);
  });

  it("garde la réaffectation plus stricte que l'annulation", () => {
    // Invariant : tout statut réaffectable est annulable, l'inverse n'est pas vrai. Si un jour
    // quelqu'un élargit la réaffectation sans toucher à l'annulation, ce test le dit.
    for (const status of OPERATOR_REASSIGNABLE_STATUSES) {
      expect(OPERATOR_CANCELLABLE_STATUSES).toContain(status);
    }
  });
});

describe("operator ride status labels", () => {
  // Énumération explicite de l'enum `ride_status` : si le SQL gagne une valeur et que le
  // `Record<RideStatus, string>` suit, ce test rappelle qu'un libellé doit être choisi.
  const ALL_RIDE_STATUSES = [
    "pending",
    "scheduled",
    "in-progress",
    "completed",
    "client-canceled",
    "driver-canceled",
    "admin-canceled",
    "no-show",
    "delayed",
  ] as const;

  it("couvre tous les statuts, sans trou ni surplus", () => {
    for (const status of ALL_RIDE_STATUSES) {
      expect(RIDE_STATUS_LABELS[status]).toBeTruthy();
    }
    expect(Object.keys(RIDE_STATUS_LABELS).sort()).toEqual([...ALL_RIDE_STATUSES].sort());
  });

  it("rend un tiret plutôt qu'undefined quand le statut manque", () => {
    expect(rideStatusLabel(null)).toBe("—");
    expect(rideStatusLabel(undefined)).toBe("—");
  });
});
