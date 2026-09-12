import {
  approveDossierFromServer,
  dossierApproveBlockedMessage,
  mapDossierAdminRpcMessage,
  resolveDossierApprovePath,
  type DossierApproveClient,
} from "../approveDossierFromServer";

function mockClient(options: {
  status: string | null;
  userId?: string | null;
  rpc?: jest.Mock;
}): { client: DossierApproveClient; rpc: jest.Mock } {
  const rpc =
    options.rpc ??
    jest.fn().mockResolvedValue({
      data: [{ success: true, new_status: "active", message: "ok" }],
      error: null,
    });
  const client: DossierApproveClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              status: options.status,
              user_id: options.userId ?? "user-1",
            },
            error: null,
          }),
        }),
      }),
    }),
    rpc,
  };
  return { client, rpc };
}

describe("resolveDossierApprovePath", () => {
  it("validates pending_review without submit", () => {
    expect(resolveDossierApprovePath("pending_review")).toBe("validate_only");
  });

  it("submits then validates unsubmitted statuses", () => {
    expect(resolveDossierApprovePath("draft")).toBe("submit_then_validate");
    expect(resolveDossierApprovePath("rejected")).toBe("submit_then_validate");
    expect(resolveDossierApprovePath("incomplete")).toBe("submit_then_validate");
  });

  it("blocks ops statuses", () => {
    expect(resolveDossierApprovePath("active")).toBe("blocked");
    expect(resolveDossierApprovePath("suspended")).toBe("blocked");
    expect(dossierApproveBlockedMessage("active")).toMatch(/déjà actif/);
  });
});

describe("mapDossierAdminRpcMessage", () => {
  it("maps leftover submit errors to French", () => {
    expect(
      mapDossierAdminRpcMessage(
        "Dossier cannot be submitted from current status",
      ),
    ).toMatch(/déjà en vérification/);
    expect(mapDossierAdminRpcMessage("Dossier already in review")).toMatch(
      /déjà en vérification/,
    );
  });
});

describe("approveDossierFromServer", () => {
  it("does not call submit_driver_dossier when DB status is pending_review", async () => {
    const { client, rpc } = mockClient({ status: "pending_review" });

    await approveDossierFromServer(client, {
      driverId: "driver-1",
      adminUserId: "admin-1",
    });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("validate_driver_dossier", {
      p_driver_id: "driver-1",
      p_admin_user_id: "admin-1",
      p_approved: true,
    });
    expect(rpc.mock.calls.some((call) => call[0] === "submit_driver_dossier")).toBe(
      false,
    );
  });

  it("submits then validates a draft dossier", async () => {
    const rpc = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ success: true, new_status: "pending_review", message: "ok" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ success: true, new_status: "active", message: "ok" }],
        error: null,
      });
    const { client } = mockClient({ status: "draft", rpc });

    await approveDossierFromServer(client, {
      driverId: "driver-1",
      adminUserId: "admin-1",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "submit_driver_dossier", {
      p_driver_id: "driver-1",
      p_user_id: "user-1",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "validate_driver_dossier", {
      p_driver_id: "driver-1",
      p_admin_user_id: "admin-1",
      p_approved: true,
    });
  });

  it("refuses to validate an already active driver", async () => {
    const { client, rpc } = mockClient({ status: "active" });

    await expect(
      approveDossierFromServer(client, {
        driverId: "driver-1",
        adminUserId: "admin-1",
      }),
    ).rejects.toThrow(/déjà actif/);
    expect(rpc).not.toHaveBeenCalled();
  });
});
