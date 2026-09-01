import { inspectSupabasePublicEnv } from "../supabase-env-check";

function fakeLocalAnonJwt(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: "supabase-demo", role: "anon" }),
  ).toString("base64url");
  return `${header}.${payload}.local-dev-signature`;
}

describe("inspectSupabasePublicEnv", () => {
  const localUrl = "http://127.0.0.1:54329";
  const localAnonKey = fakeLocalAnonJwt();
  const cloudUrl = "https://iodsddzustunlahxafif.supabase.co";
  const cloudAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZHNkZHp1c3R1bmxhaHhhZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkyMDAwMDAwMH0.signature";

  it("accepts local Supabase stack (supabase-demo issuer)", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const report = inspectSupabasePublicEnv(localUrl, localAnonKey);

    expect(report.ok).toBe(true);
    expect(report.message).toBeNull();
    expect(report.jwtIssuer).toBe("supabase-demo");

    process.env.NODE_ENV = prev;
  });

  it("rejects localhost URL with cloud anon key outside development", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const report = inspectSupabasePublicEnv(localUrl, cloudAnonKey);

    expect(report.ok).toBe(false);
    expect(report.message).toMatch(/localhost/i);

    process.env.NODE_ENV = prev;
  });

  it("accepts matching cloud URL and anon key", () => {
    const report = inspectSupabasePublicEnv(cloudUrl, cloudAnonKey);

    expect(report.ok).toBe(true);
    expect(report.refsMatch).toBe(true);
  });
});
