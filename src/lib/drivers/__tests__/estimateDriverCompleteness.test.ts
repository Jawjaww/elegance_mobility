import { estimateDriverCompleteness } from "../estimateDriverCompleteness";

describe("estimateDriverCompleteness", () => {
  it("does not report 0% when identity fields are filled", () => {
    const result = estimateDriverCompleteness(
      {
        first_name: "Jaw",
        last_name: "Ben",
        phone: "0656765678",
        date_of_birth: "1990-01-01",
        address_line1: "1 rue",
        city: "Nice",
        postal_code: "06000",
        vtc_card_number: "VTC1",
        driving_license_number: "LIC1",
        insurance_number: "INS1",
        avatar_url: "avatars/x.jpg",
        emergency_contact_name: "Sam",
        emergency_contact_phone: "0600000000",
      },
      [
        {
          document_type: "driving_license",
          expiry_date: "2030-01-01",
          validation_status: "pending",
        },
        {
          document_type: "vtc_card",
          expiry_date: "2030-01-01",
          validation_status: "pending",
        },
        {
          document_type: "insurance",
          expiry_date: "2030-01-01",
          validation_status: "pending",
        },
        {
          document_type: "id_card",
          expiry_date: "2030-01-01",
          validation_status: "pending",
        },
        {
          document_type: "proof_of_address",
          expiry_date: "2030-01-01",
          validation_status: "pending",
        },
      ],
      true,
    );
    expect(result.completion_percentage).toBeGreaterThan(50);
    expect(result.can_submit).toBe(true);
    expect(result.is_complete).toBe(false);
  });
});
