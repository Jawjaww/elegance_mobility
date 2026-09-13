import {
  isOpenRideOffer,
  shouldDropOverlayForOfferStatus,
} from "../offerRealtime";

describe("offerRealtime", () => {
  it("treats unexpired offered rows as open", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(
      isOpenRideOffer({
        ride_id: "r1",
        driver_id: "d1",
        status: "offered",
        expires_at: future,
      }),
    ).toBe(true);
    expect(
      isOpenRideOffer({
        ride_id: "r1",
        driver_id: "d1",
        status: "offered",
        expires_at: null,
      }),
    ).toBe(true);
    expect(
      isOpenRideOffer({
        ride_id: "r1",
        driver_id: "d1",
        status: "timeout",
        expires_at: future,
      }),
    ).toBe(false);
  });

  it("drops overlay when the server times out or assigns elsewhere", () => {
    expect(shouldDropOverlayForOfferStatus("timeout")).toBe(true);
    expect(shouldDropOverlayForOfferStatus("expired_taken")).toBe(true);
    expect(shouldDropOverlayForOfferStatus("declined")).toBe(true);
    expect(shouldDropOverlayForOfferStatus("offered")).toBe(false);
    expect(shouldDropOverlayForOfferStatus("accepted")).toBe(false);
  });
});
