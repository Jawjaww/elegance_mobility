import { buildOperatorRatesView, type OperatorRateRow } from "../ratesView";

const PLATFORM_STANDARD: OperatorRateRow = {
  vehicle_type: "STANDARD",
  base_price: 15,
  price_per_km: 2.5,
  min_price: 20,
  operator_id: null,
};

const PLATFORM_PREMIUM: OperatorRateRow = {
  vehicle_type: "PREMIUM",
  base_price: 30,
  price_per_km: 4,
  min_price: 50,
  operator_id: null,
};

const MY_OPERATOR = "a1000000-0000-4000-8000-000000000001";
const OTHER_OPERATOR = "a1000000-0000-4000-8000-0000000000ff";

describe("buildOperatorRatesView", () => {
  it("affiche le tarif plateforme quand la flotte n'a pas de surcharge", () => {
    const view = buildOperatorRatesView([PLATFORM_STANDARD, PLATFORM_PREMIUM], MY_OPERATOR);

    expect(view).toHaveLength(2);
    expect(view.every((rate) => rate.source === "platform")).toBe(true);
    expect(view.find((rate) => rate.vehicle_type === "STANDARD")?.base_price).toBe(15);
  });

  it("fait gagner la surcharge de la flotte sur le défaut plateforme", () => {
    const myOverride: OperatorRateRow = {
      vehicle_type: "STANDARD",
      base_price: 18,
      price_per_km: 2.9,
      min_price: 22,
      operator_id: MY_OPERATOR,
    };

    const view = buildOperatorRatesView([PLATFORM_STANDARD, myOverride], MY_OPERATOR);

    // Une seule ligne par type de véhicule : la surcharge remplace, elle ne s'ajoute pas.
    expect(view).toHaveLength(1);
    expect(view[0]).toMatchObject({
      vehicle_type: "STANDARD",
      base_price: 18,
      source: "override",
    });
  });

  it("ignore la surcharge d'une autre flotte même si la requête la renvoyait", () => {
    // Défense en profondeur : la RLS ne renvoie pas cette ligne (test 62, politique
    // rates_operator_own_read). Si elle fuitait un jour, l'écran ne doit pas l'afficher pour
    // autant — sinon un opérateur lirait les prix d'un concurrent.
    const foreign: OperatorRateRow = {
      vehicle_type: "PREMIUM",
      base_price: 99,
      price_per_km: 9.9,
      min_price: 199,
      operator_id: OTHER_OPERATOR,
    };

    const view = buildOperatorRatesView([PLATFORM_PREMIUM, foreign], MY_OPERATOR);

    expect(view).toHaveLength(1);
    expect(view[0]).toMatchObject({
      vehicle_type: "PREMIUM",
      base_price: 30,
      source: "platform",
    });
  });

  it("rend un écran vide si la base ne renvoie rien", () => {
    expect(buildOperatorRatesView([], MY_OPERATOR)).toEqual([]);
  });
});
