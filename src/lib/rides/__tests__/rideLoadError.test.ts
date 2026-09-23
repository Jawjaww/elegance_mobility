// Non-vacuity tests for the admin rides load failure surface.
//
// The surface itself is the point: the rides list used to answer a failed load with
// "Impossible de charger les courses." and nothing else, so the cause stayed invisible
// and the operator had no way to retry. These tests pin both halves — the extraction of
// the real message, and the wiring that renders it next to a retry button.
//
// The extraction is asserted over the shapes that actually reach it (a PostgrestError, a
// network TypeError, a thrown string, and the degenerate cases). The wiring is asserted
// over the source, because an extraction that nothing renders fixes nothing.

import { readFileSync } from "fs";
import {
  describeRideLoadError,
  UNKNOWN_RIDE_LOAD_ERROR,
} from "@/lib/rides/rideLoadError";

const COMPONENT = "src/components/admin/rides/RidesList.tsx";

function readSource(relativePath: string): string {
  return (readFileSync as (p: string, e: string) => string)(
    `${process.cwd()}/${relativePath}`,
    "utf8",
  );
}

/** Mirrors @supabase/postgrest-js: a class extending Error, plus `code`. */
class StubPostgrestError extends Error {
  code: string;
  details: string;
  hint: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PostgrestError";
    this.code = code;
    this.details = "";
    this.hint = "";
  }
}

describe("describeRideLoadError — the real cause reaches the operator", () => {
  it("surfaces a PostgREST message together with its SQLSTATE code", () => {
    const error = new StubPostgrestError(
      "permission denied for table rides",
      "42501",
    );

    expect(describeRideLoadError(error)).toBe(
      "permission denied for table rides (42501)",
    );
  });

  it("keeps the code when PostgREST returns no message", () => {
    expect(
      describeRideLoadError(new StubPostgrestError("", "PGRST301")),
    ).toBe("Code PGRST301");
  });

  it("surfaces a bare network failure, which is an Error but not a PostgREST one", () => {
    expect(describeRideLoadError(new TypeError("Failed to fetch"))).toBe(
      "Failed to fetch",
    );
  });

  it("accepts a plain object, since not every throw is an Error instance", () => {
    expect(describeRideLoadError({ message: "boom", code: "XX000" })).toBe(
      "boom (XX000)",
    );
  });

  it("accepts a thrown string", () => {
    expect(describeRideLoadError("  réseau indisponible  ")).toBe(
      "réseau indisponible",
    );
  });

  it("always returns something readable, never an empty line", () => {
    const degenerate = [null, undefined, "", "   ", {}, { message: "  " }];

    for (const value of degenerate) {
      const described = describeRideLoadError(value);
      expect(described.trim()).not.toBe("");
    }
  });

  it("names the absence of a cause instead of inventing one", () => {
    expect(describeRideLoadError(null)).toBe(UNKNOWN_RIDE_LOAD_ERROR);
    expect(describeRideLoadError(undefined)).toBe(UNKNOWN_RIDE_LOAD_ERROR);
  });

  it("does not throw on a self-referencing object", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => describeRideLoadError(circular)).not.toThrow();
    expect(describeRideLoadError(circular).trim()).not.toBe("");
  });
});

describe("RidesList — the failure surface is wired, not just available", () => {
  const source = readSource(COMPONENT);

  it("renders the extracted cause in the error branch", () => {
    expect(source).toContain("describeRideLoadError(query.error)");
    expect(source).toMatch(/import\s+\{\s*describeRideLoadError\s*\}/);
  });

  it("offers a way out of the dead end", () => {
    // A retry button only helps if it actually refetches.
    expect(source).toContain("query.refetch()");
    expect(source).toMatch(/Réessayer/);
  });

  it("keeps the generic sentence, so the branch still reads as a failure", () => {
    expect(source).toContain("Impossible de charger les courses.");
  });
});

// The same principle, one component over: a dashboard that could not count must say so rather
// than render a confident zero. Both surfaces were reachable dead ends.
describe("backoffice failure surfaces — none of them may guess", () => {
  it("gives the dashboard a way out instead of an endless skeleton", () => {
    const source = readSource("src/components/admin/AdminDashboardClient.tsx");

    // Pin the two distinct states, not the syntax that expresses them: a chain of ternaries was
    // replaced by early returns, and that refactor must not break this test.
    expect(source).toMatch(/if \(loading\) \{[\s\S]*?<DashboardSkeleton \/>/);
    expect(source).toMatch(/if \(!metrics\) \{[\s\S]*?<DashboardUnavailable/);
    expect(source).toContain("Tableau de bord indisponible.");
    expect(source).toContain("loadError");
    expect(source).toMatch(/Réessayer/);
    // The retry must actually reload, not just re-render.
    expect(source).toContain("onRetry={retry}");
    expect(source).toMatch(/void load\(\)/);
  });

  it("refuses to paint a failed queue count as a number", () => {
    const source = readSource(
      "src/components/admin/rides/RidesQueueSummary.tsx",
    );

    expect(source).toContain("preview.failed");
    expect(source).toContain("Indisponible");
    // The catch path must not fall back to "0 / Aucune".
    expect(source).toContain("FAILED_QUEUE_PREVIEW");
  });

  it("names the counters the dashboard could not read", () => {
    const source = readSource("src/lib/services/dashboard.ts");

    // A silent `.count || 0` on a failed request is exactly what produced the wrong answer.
    expect(source).toContain("collectCountFailure");
    expect(source).toMatch(/throw new Error\(`Compteurs indisponibles/);
  });
});
