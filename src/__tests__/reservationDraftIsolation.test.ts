import fs from "fs";
import path from "path";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { shouldResumeReservationDraft } from "@/lib/reservation/resumeDraft";

/**
 * Le brouillon de réservation ne doit pas survivre à la course qu'il a servie.
 *
 * Le défaut rapporté : les options d'une course précédente restaient cochées et étaient ajoutées
 * à la course suivante, sans que le client les ait choisies. Le store est persisté dans
 * `localStorage` (`reservation-store`) et son `reset()` n'était appelé nulle part — le tunnel
 * relisait donc le brouillon à chaque nouvelle réservation.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");

function readSource(relative: string): string {
  return fs
    .readFileSync(path.join(PROJECT_ROOT, relative), "utf8")
    .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ");
}

describe("le brouillon de réservation", () => {
  it("se vide quand on le réinitialise", () => {
    const store = useReservationStore.getState();
    store.setSelectedOptions(["Siège enfant", "Animaux domestiques"]);
    store.setDeparture({
      lat: 48.8566,
      lon: 2.3522,
      display_name: "Paris",
      address: {},
    });
    expect(useReservationStore.getState().selectedOptions).toHaveLength(2);

    useReservationStore.getState().reset();

    expect(useReservationStore.getState().selectedOptions).toEqual([]);
    expect(useReservationStore.getState().departure).toBeNull();
  });

  it("n'est pas relu par une nouvelle réservation", () => {
    const funnel = readSource("src/hooks/useReservation.ts");

    // La graine locale n'est prise du brouillon que sur une reprise explicite.
    expect(funnel).toContain("shouldResumeReservationDraft");
    expect(funnel).toContain("resumeDraft ? reservationStore : null");
    expect(funnel).toContain("seeded?.selectedOptions");
    // Et un brouillon périmé est effacé au montage du tunnel.
    expect(funnel).toContain("useReservationStore.getState().reset()");
  });
});

describe("la règle de reprise du brouillon", () => {
  it("ne reprend que sur un retour explicite dans le tunnel", () => {
    const input = (overrides: Partial<Parameters<typeof shouldResumeReservationDraft>[0]>) => ({
      modify: null,
      rebook: null,
      editingId: null,
      ...overrides,
    });

    // Une nouvelle réservation : le brouillon de la course précédente est ignoré.
    expect(shouldResumeReservationDraft(input({}))).toBe(false);
    expect(shouldResumeReservationDraft(input({ modify: "0" }))).toBe(false);
    expect(shouldResumeReservationDraft(input({ rebook: "0" }))).toBe(false);

    // Les trois reprises légitimes.
    expect(shouldResumeReservationDraft(input({ modify: "1" }))).toBe(true);
    expect(shouldResumeReservationDraft(input({ rebook: "1" }))).toBe(true);
    expect(
      shouldResumeReservationDraft(input({ editingId: "ride-123" })),
    ).toBe(true);
  });
});

describe("les reprises explicites gardent le brouillon", () => {
  it("« Modifier » demande la reprise", () => {
    const confirmation = readSource(
      "src/components/reservation/ConfirmationDetails.tsx",
    );
    expect(confirmation).toContain('router.push("/reservation?modify=1")');
  });

  it("une réservation aboutie consomme le brouillon", () => {
    const success = readSource(
      "src/app/(client-portal)/my-account/reservations/reservation-success/page.tsx",
    );
    expect(success).toContain("useReservationStore.getState().reset()");
  });
});
