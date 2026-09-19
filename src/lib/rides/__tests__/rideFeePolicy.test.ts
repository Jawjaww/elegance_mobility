import {
  DEFAULT_PLATFORM_SNAPSHOT,
  feeFromTiers,
  heartbeatMinutesOf,
  parseCancelQuote,
  parseFeePolicySnapshot,
  simulateQuote,
} from "../rideFeePolicy";

describe("rideFeePolicy", () => {
  it("parses snapshot and applies wait tier after grace", () => {
    const snap = parseFeePolicySnapshot(DEFAULT_PLATFORM_SNAPSHOT);
    expect(snap?.heartbeat_minutes).toBe(25);
    expect(snap?.gps_wave1_max_age_seconds).toBe(86400);
    expect(snap?.dispatch_include_offline_from_wave).toBe(3);
    expect(feeFromTiers(DEFAULT_PLATFORM_SNAPSHOT, "wait", 5)).toBe(0);
    expect(feeFromTiers(DEFAULT_PLATFORM_SNAPSHOT, "wait", 8)).toBe(3);
    expect(feeFromTiers(DEFAULT_PLATFORM_SNAPSHOT, "cancel_en_route", 0)).toBe(
      10,
    );
  });

  it("quotes matching, far, en-route and driver-late", () => {
    expect(
      simulateQuote(DEFAULT_PLATFORM_SNAPSHOT, "matching", 0).reason_code,
    ).toBe("client_cancel_free");
    expect(simulateQuote(DEFAULT_PLATFORM_SNAPSHOT, "far", 0).amount).toBe(0);
    expect(simulateQuote(DEFAULT_PLATFORM_SNAPSHOT, "en_route", 0).amount).toBe(
      10,
    );
    const late = simulateQuote(DEFAULT_PLATFORM_SNAPSHOT, "driver_late", 0);
    expect(late.reason_code).toBe("client_cancel_driver_late");
    expect(late.driver_may_release).toBe(true);
  });

  it("quotes wait and no-show after arrival", () => {
    const wait = simulateQuote(DEFAULT_PLATFORM_SNAPSHOT, "wait", 8);
    expect(wait.amount).toBe(3);
    expect(wait.reason_code).toBe("client_cancel_after_arrival");
    const noshow = simulateQuote(
      DEFAULT_PLATFORM_SNAPSHOT,
      "wait",
      20,
      "no-show",
    );
    expect(noshow.driver_may_noshow).toBe(true);
    expect(noshow.amount).toBe(45);
    expect(noshow.reason_code).toBe("client_no_show");
  });

  it("blocks client cancel while in progress", () => {
    const quote = simulateQuote(DEFAULT_PLATFORM_SNAPSHOT, "in_progress", 0);
    expect(quote.client_may_cancel).toBe(false);
    expect(quote.reason_code).toBe("in_progress_blocked");
  });

  it("parses RPC quote payloads", () => {
    const quote = parseCancelQuote({
      success: true,
      billing: "client_fee",
      amount: 10,
      reason_code: "client_cancel_en_route",
      client_may_cancel: true,
    });
    expect(quote.amount).toBe(10);
    expect(quote.billing).toBe("client_fee");
  });

  // The matching window is granted by the server (ride_heartbeat_interval) and
  // advertised by the incentive panel. Both must read the same number, and a UI
  // copy that hardcodes it survives a policy change and starts lying — which is
  // exactly what happened when heartbeat_minutes moved 20 -> 25.
  describe("heartbeatMinutesOf", () => {
    it("reads the ride's own policy, not a hardcoded window", () => {
      expect(heartbeatMinutesOf({ heartbeat_minutes: 25 })).toBe(25);
    });

    it("follows a policy that differs from the platform default", () => {
      expect(heartbeatMinutesOf({ heartbeat_minutes: 40 })).toBe(40);
    });

    it("falls back to the default when the key is absent", () => {
      expect(heartbeatMinutesOf({ offer_batch_size: 3 })).toBe(
        DEFAULT_PLATFORM_SNAPSHOT.heartbeat_minutes,
      );
    });

    it("falls back to the default when there is no snapshot", () => {
      expect(heartbeatMinutesOf(null)).toBe(
        DEFAULT_PLATFORM_SNAPSHOT.heartbeat_minutes,
      );
      expect(heartbeatMinutesOf(undefined)).toBe(
        DEFAULT_PLATFORM_SNAPSHOT.heartbeat_minutes,
      );
    });

    it("falls back to the default on a malformed value", () => {
      expect(heartbeatMinutesOf("not-a-snapshot")).toBe(
        DEFAULT_PLATFORM_SNAPSHOT.heartbeat_minutes,
      );
      expect(heartbeatMinutesOf({ heartbeat_minutes: "abc" })).toBe(
        DEFAULT_PLATFORM_SNAPSHOT.heartbeat_minutes,
      );
    });
  });

  // The dispatch score mix became a policy setting in 20260920010000. Two properties
  // matter to the backoffice form: an absent key must fall back to the column default
  // rather than to zero (which would silently switch a criterion off), and an explicit
  // zero must survive (an admin may legitimately want to ignore a criterion).
  describe("dispatch score weights", () => {
    it("reads the mix from the ride's own policy", () => {
      const snap = parseFeePolicySnapshot({
        dispatch_weight_distance: 0.4,
        dispatch_weight_accept: 0.3,
        dispatch_weight_rating: 0.25,
        dispatch_weight_online: 0.05,
      });
      expect(snap?.dispatch_weight_distance).toBe(0.4);
      expect(snap?.dispatch_weight_accept).toBe(0.3);
      expect(snap?.dispatch_weight_rating).toBe(0.25);
      expect(snap?.dispatch_weight_online).toBe(0.05);
    });

    it("falls back to the platform defaults when the keys are absent", () => {
      const snap = parseFeePolicySnapshot({ heartbeat_minutes: 25 });
      expect(snap?.dispatch_weight_distance).toBe(0.5);
      expect(snap?.dispatch_weight_accept).toBe(0.25);
      expect(snap?.dispatch_weight_rating).toBe(0.2);
      expect(snap?.dispatch_weight_online).toBe(0.05);
    });

    it("keeps an explicit zero instead of replacing it with the default", () => {
      const snap = parseFeePolicySnapshot({
        dispatch_weight_distance: 0,
        dispatch_weight_online: 0,
      });
      expect(snap?.dispatch_weight_distance).toBe(0);
      expect(snap?.dispatch_weight_online).toBe(0);
    });
  });
});
