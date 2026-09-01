import {
  BACKOFFICE_DEFAULT_PATH,
  BACKOFFICE_LOGIN_PATH,
  buildBackofficeLoginUrl,
  isBackofficeLoginPath,
  isBackofficeProtectedPath,
  resolveBackofficePostLoginPath,
  sanitizeBackofficeNextPath,
} from "@/lib/auth/backoffice-auth";

describe("isBackofficeLoginPath", () => {
  it("matches login path with or without query", () => {
    expect(isBackofficeLoginPath(BACKOFFICE_LOGIN_PATH)).toBe(true);
    expect(isBackofficeLoginPath(`${BACKOFFICE_LOGIN_PATH}?next=%2Ffoo`)).toBe(
      true,
    );
  });

  it("does not match other backoffice routes", () => {
    expect(isBackofficeLoginPath("/backoffice-portal/dashboard")).toBe(false);
    expect(isBackofficeLoginPath(null)).toBe(false);
  });
});

describe("isBackofficeProtectedPath", () => {
  it("protects backoffice routes except login", () => {
    expect(isBackofficeProtectedPath("/backoffice-portal/dashboard")).toBe(true);
    expect(isBackofficeProtectedPath("/backoffice-portal/drivers")).toBe(true);
    expect(isBackofficeProtectedPath(BACKOFFICE_LOGIN_PATH)).toBe(false);
    expect(isBackofficeProtectedPath("/auth/login")).toBe(false);
  });
});

describe("sanitizeBackofficeNextPath", () => {
  it("allows internal backoffice paths", () => {
    expect(sanitizeBackofficeNextPath("/backoffice-portal/drivers")).toBe(
      "/backoffice-portal/drivers",
    );
  });

  it("rejects external, login, and protocol-relative paths", () => {
    expect(sanitizeBackofficeNextPath("https://evil.com")).toBeNull();
    expect(sanitizeBackofficeNextPath("//evil.com")).toBeNull();
    expect(sanitizeBackofficeNextPath(BACKOFFICE_LOGIN_PATH)).toBeNull();
    expect(sanitizeBackofficeNextPath(null)).toBeNull();
  });
});

describe("buildBackofficeLoginUrl", () => {
  it("encodes next for protected paths", () => {
    expect(buildBackofficeLoginUrl("/backoffice-portal/dashboard")).toBe(
      `${BACKOFFICE_LOGIN_PATH}?next=%2Fbackoffice-portal%2Fdashboard`,
    );
  });

  it("falls back to bare login for invalid return paths", () => {
    expect(buildBackofficeLoginUrl(BACKOFFICE_LOGIN_PATH)).toBe(
      BACKOFFICE_LOGIN_PATH,
    );
  });
});

describe("resolveBackofficePostLoginPath", () => {
  it("uses sanitized next or dashboard default", () => {
    expect(
      resolveBackofficePostLoginPath("/backoffice-portal/drivers/pending"),
    ).toBe("/backoffice-portal/drivers/pending");
    expect(resolveBackofficePostLoginPath("https://evil.com")).toBe(
      BACKOFFICE_DEFAULT_PATH,
    );
    expect(resolveBackofficePostLoginPath(undefined)).toBe(
      BACKOFFICE_DEFAULT_PATH,
    );
  });
});
