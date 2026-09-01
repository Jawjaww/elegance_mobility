import {
  driverDocumentStorageCandidates,
  normalizeDriverDocumentPath,
  toStoragePath,
} from "../driverDocumentPath";

describe("normalizeDriverDocumentPath", () => {
  it("strips the bucket prefix from legacy keys", () => {
    expect(
      normalizeDriverDocumentPath(
        "driver-documents/a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card.png",
      ),
    ).toBe("a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card.png");
  });

  it("keeps driver-id/type keys", () => {
    expect(
      normalizeDriverDocumentPath("a4c24faa-f001-4bac-b241-5d543d7fedf0/tax_certificate_1.jpg"),
    ).toBe("a4c24faa-f001-4bac-b241-5d543d7fedf0/tax_certificate_1.jpg");
  });

  it("rejects path traversal", () => {
    expect(normalizeDriverDocumentPath("foo/../secret")).toBeNull();
  });
});

describe("driverDocumentStorageCandidates", () => {
  it("tries normalized then raw when the bucket prefix is present", () => {
    expect(
      driverDocumentStorageCandidates(
        "driver-documents/a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card.png",
      ),
    ).toEqual([
      "a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card.png",
      "driver-documents/a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card.png",
    ]);
  });
});

describe("toStoragePath", () => {
  it("extracts the object key from a signed URL", () => {
    expect(
      toStoragePath(
        "https://example.supabase.co/storage/v1/object/sign/driver-documents/abc/file.jpg?token=x",
      ),
    ).toBe("abc/file.jpg");
  });

  it("strips bucket prefix from a raw path", () => {
    expect(
      toStoragePath("driver-documents/abc/file.jpg"),
    ).toBe("abc/file.jpg");
  });
});
