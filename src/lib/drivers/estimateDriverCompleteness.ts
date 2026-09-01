const PLACEHOLDER = "À compléter";

export type CompletenessEstimate = {
  is_complete: boolean;
  completion_percentage: number;
  missing_fields: string[];
  can_submit: boolean;
  missing_for_submit: string[];
};

type DriverLike = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  vtc_card_number?: string | null;
  driving_license_number?: string | null;
  insurance_number?: string | null;
  avatar_url?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

type DocLike = {
  document_type: string;
  expiry_date?: string | null;
  validation_status?: string | null;
};

function filled(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim();
  return trimmed !== "" && trimmed !== PLACEHOLDER;
}

function phoneFilled(value: string | null | undefined): boolean {
  return filled(value) && value !== "+00000000000";
}

function hasDocWithExpiry(docs: DocLike[], types: string[]): boolean {
  return docs.some(
    (d) => types.includes(d.document_type) && Boolean(d.expiry_date),
  );
}

function hasApprovedValidDoc(docs: DocLike[], types: string[]): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return docs.some(
    (d) =>
      types.includes(d.document_type) &&
      d.validation_status === "approved" &&
      Boolean(d.expiry_date) &&
      (d.expiry_date as string) >= today,
  );
}

/**
 * Local stand-in for check_driver_profile_completeness when the RPC fails.
 * Mirrors the RPC field list so the admin UI does not show a fake 0%.
 */
export function estimateDriverCompleteness(
  driver: DriverLike,
  docs: DocLike[],
  hasPlate?: boolean | null,
): CompletenessEstimate {
  const missingOps: string[] = [];
  const missingSub: string[] = [];
  let checksTotal = 0;
  let completed = 0;

  const checkField = (ok: boolean, label: string) => {
    checksTotal += 1;
    if (ok) completed += 1;
    else {
      missingOps.push(label);
      missingSub.push(label);
    }
  };

  const checkDoc = (
    types: string[],
    submitLabel: string,
    opsLabel: string,
  ) => {
    checksTotal += 1;
    if (hasDocWithExpiry(docs, types)) completed += 1;
    else missingSub.push(submitLabel);
    if (!hasApprovedValidDoc(docs, types)) missingOps.push(opsLabel);
  };

  checkField(filled(driver.first_name), "Prénom");
  checkField(filled(driver.last_name), "Nom");
  checkField(phoneFilled(driver.phone), "Téléphone");
  checkField(Boolean(driver.date_of_birth), "Date de naissance");
  checkField(filled(driver.address_line1), "Adresse");
  checkField(filled(driver.city), "Ville");
  checkField(filled(driver.postal_code), "Code postal");
  checkField(filled(driver.vtc_card_number), "Numéro carte VTC");
  checkField(filled(driver.driving_license_number), "Numéro permis");
  checkField(filled(driver.insurance_number), "Numéro assurance");
  checkField(filled(driver.avatar_url), "Photo de profil");

  checkDoc(
    ["driving_license"],
    "Document permis (avec date)",
    "Document permis (approuvé et valide)",
  );
  checkDoc(
    ["vtc_card"],
    "Document carte VTC (avec date)",
    "Document carte VTC (approuvé et valide)",
  );
  checkDoc(
    ["insurance"],
    "Document assurance (avec date)",
    "Document assurance (approuvé et valide)",
  );
  checkDoc(
    ["id_card", "passport"],
    "Pièce d'identité (avec date)",
    "Pièce d'identité (approuvée et valide)",
  );
  checkDoc(
    ["proof_of_address"],
    "Justificatif de domicile (avec date)",
    "Justificatif de domicile (approuvé et valide)",
  );

  checkField(filled(driver.emergency_contact_name), "Contact d'urgence (nom)");
  checkField(
    phoneFilled(driver.emergency_contact_phone),
    "Contact d'urgence (téléphone)",
  );

  if (hasPlate !== null && hasPlate !== undefined) {
    checkField(hasPlate, "Plaque d'immatriculation (véhicule)");
  }

  const pct =
    checksTotal === 0 ? 0 : Math.round((completed * 100) / checksTotal);

  return {
    is_complete: missingOps.length === 0,
    completion_percentage: pct,
    missing_fields: missingOps,
    can_submit: missingSub.length === 0,
    missing_for_submit: missingSub,
  };
}
