/**
 * @jest-environment node
 */
import {
  authenticateCaller,
  requireAdmin,
} from "../admin-auth";

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    getAll: () => [],
    set: jest.fn(),
  })),
}));

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

function jsonOf(res: Response): Promise<{ ok: boolean; error: string }> {
  return res.json() as Promise<{ ok: boolean; error: string }>;
}

describe("authenticateCaller", () => {
  it("returns 401 when no token and cookies have no session", async () => {
    const result = await authenticateCaller(new Request("https://app.local/api"), {
      getUserFromCookies: async () => ({ user: null, error: "no session" }),
    });
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
    expect(await jsonOf(result.error as Response)).toEqual({
      ok: false,
      error: "missing authorization token",
    });
  });

  it("returns 401 when JWT is rejected", async () => {
    const req = new Request("https://app.local/api", {
      headers: { Authorization: "Bearer stale-jwt" },
    });
    const result = await authenticateCaller(req, {
      getUserByJwt: async () => ({ user: null, error: "invalid token" }),
    });
    expect(result.error?.status).toBe(401);
    expect(await jsonOf(result.error as Response)).toEqual({
      ok: false,
      error: "invalid token",
    });
  });

  it("accepts a valid Bearer JWT", async () => {
    const req = new Request("https://app.local/api", {
      headers: { Authorization: "Bearer good-jwt" },
    });
    const result = await authenticateCaller(req, {
      getUserByJwt: async (jwt) => {
        expect(jwt).toBe("good-jwt");
        return {
          user: {
            id: "admin-1",
            app_metadata: { role: "app_admin" },
          },
        };
      },
    });
    expect(result.error).toBeUndefined();
    expect(result.callerId).toBe("admin-1");
  });

  it("falls back to cookies when Authorization is missing", async () => {
    const result = await authenticateCaller(new Request("https://app.local/api"), {
      getUserFromCookies: async () => ({
        user: {
          id: "admin-cookie",
          app_metadata: { role: "app_admin" },
        },
      }),
    });
    expect(result.callerId).toBe("admin-cookie");
  });
});

describe("requireAdmin", () => {
  it("returns 403 when the caller is not an admin", async () => {
    const req = new Request("https://app.local/api", {
      headers: { Authorization: "Bearer driver-jwt" },
    });
    const result = await requireAdmin(req, {
      getUserByJwt: async () => ({
        user: {
          id: "driver-1",
          app_metadata: { role: "app_driver" },
        },
      }),
    });
    expect(result.error?.status).toBe(403);
    expect(await jsonOf(result.error as Response)).toEqual({
      ok: false,
      error: "admin role required",
    });
  });

  it("accepts app_admin", async () => {
    const req = new Request("https://app.local/api", {
      headers: { Authorization: "Bearer admin-jwt" },
    });
    const result = await requireAdmin(req, {
      getUserByJwt: async () => ({
        user: {
          id: "admin-1",
          app_metadata: { role: "app_admin" },
        },
      }),
    });
    expect(result.error).toBeUndefined();
    expect(result.callerId).toBe("admin-1");
  });
});
