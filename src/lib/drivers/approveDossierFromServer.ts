/**
 * Admin "Valider" must follow the live DB status, not a stale React row.
 * pending_review → validate_driver_dossier only (never submit).
 */

const UNSUBMITTED_STATUSES = new Set(["draft", "rejected", "incomplete"]);

export type DossierApprovePath =
  | "validate_only"
  | "submit_then_validate"
  | "blocked";

export type DossierApproveClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { status: string | null; user_id: string | null } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
};

export function resolveDossierApprovePath(
  status: string | null | undefined,
): DossierApprovePath {
  if (status === "pending_review") return "validate_only";
  if (status && UNSUBMITTED_STATUSES.has(status)) return "submit_then_validate";
  return "blocked";
}

export function dossierApproveBlockedMessage(
  status: string | null | undefined,
): string {
  switch (status) {
    case "active":
      return "Ce dossier est déjà actif.";
    case "suspended":
      return "Ce chauffeur est suspendu. Réactivez-le ou remettez le dossier en vérification.";
    case "on_vacation":
      return "Ce chauffeur est en congé. Réactivez-le ou remettez le dossier en vérification.";
    case "inactive":
      return "Ce chauffeur est inactif. Remettez le dossier en vérification avant de le valider.";
    case "pending_validation":
      return "Statut obsolète. Remettez le dossier en vérification.";
    default:
      return "Ce dossier ne peut pas être validé dans son statut actuel.";
  }
}

export function mapDossierAdminRpcMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("cannot be submitted from current status")) {
    return "Le dossier est déjà en vérification. Validez-le sans le resoumettre, ou approuvez d’abord les documents remplacés.";
  }
  if (lower.includes("already in review")) {
    return "Le dossier est déjà en vérification.";
  }
  if (lower.includes("not authorized")) {
    return "Action non autorisée.";
  }
  if (lower.startsWith("dossier incomplete")) {
    return `Dossier incomplet : ${raw.replace(/^Dossier incomplete:\s*/i, "")}`;
  }
  if (lower.includes("nest pas en attente de validation")) {
    return "Le dossier n’est pas en attente de validation.";
  }
  return raw;
}

function tableRpcFailure(data: unknown): string | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return "Réponse RPC invalide";
  if ((row as { success?: boolean }).success === false) {
    const message =
      (row as { message?: string }).message ||
      (row as { error?: string }).error ||
      "Action refusée";
    return mapDossierAdminRpcMessage(message);
  }
  return null;
}

async function callTableRpc(
  client: DossierApproveClient,
  fn: "submit_driver_dossier" | "validate_driver_dossier",
  args: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await client.rpc(fn, args);
  if (error) {
    throw new Error(
      mapDossierAdminRpcMessage(error.message || "Erreur RPC"),
    );
  }
  const failed = tableRpcFailure(data);
  if (failed) throw new Error(failed);
}

export async function approveDossierFromServer(
  client: DossierApproveClient,
  params: { driverId: string; adminUserId: string },
): Promise<void> {
  const { data, error } = await client
    .from("drivers")
    .select("status, user_id")
    .eq("id", params.driverId)
    .maybeSingle();

  if (error) {
    throw new Error(mapDossierAdminRpcMessage(error.message));
  }
  if (!data?.status) {
    throw new Error("Chauffeur introuvable.");
  }

  const path = resolveDossierApprovePath(data.status);
  if (path === "blocked") {
    throw new Error(dossierApproveBlockedMessage(data.status));
  }

  if (path === "submit_then_validate") {
    if (!data.user_id) {
      throw new Error("Chauffeur sans compte utilisateur");
    }
    await callTableRpc(client, "submit_driver_dossier", {
      p_driver_id: params.driverId,
      p_user_id: data.user_id,
    });
  }

  await callTableRpc(client, "validate_driver_dossier", {
    p_driver_id: params.driverId,
    p_admin_user_id: params.adminUserId,
    p_approved: true,
  });
}
