import {
  DEFAULT_PLATFORM_SNAPSHOT,
  feeFromTiers,
  parseCancelQuote,
  parseFeePolicySnapshot,
  simulateQuote,
} from "../rideFeePolicy";

describe("rideFeePolicy", () => {
  it("parses snapshot and applies wait tier after grace", () => {
    const snap = parseFeePolicySnapshot(DEFAULT_PLATFORM_SNAPSHOT);
    expect(snap?.heartbeat_minutes).toBe(20);
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
});
