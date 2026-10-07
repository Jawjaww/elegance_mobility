import {
  availablePaymentMethods,
  ONLINE_PAYMENT_DISABLED_NOTICE,
  ONLINE_PAYMENT_UNAVAILABLE_LABEL,
  PAYMENT_METHOD_LABELS,
  paymentMethodNotice,
  resolvePaymentMethod,
} from "../paymentChoice";

/**
 * Le choix de paiement décide d'une promesse faite au client. Deux erreurs sont possibles, et les
 * deux se paient cher :
 *
 *  - proposer « payer en ligne » sans pouvoir débiter → le client croit avoir payé, le chauffeur
 *    part sans réclamer ;
 *  - enregistrer une carte sur une course alors que l'option est fermée → le chauffeur voit « carte,
 *    rien à encaisser » et ne réclame rien non plus.
 */
describe("paymentChoice", () => {
  const OFF = { onlineEnabled: false };
  const ON = { onlineEnabled: true };

  it("ne propose que les espèces quand le paiement en ligne est fermé", () => {
    expect(availablePaymentMethods(OFF)).toEqual(["cash"]);
  });

  it("propose les deux quand il est ouvert, les espèces d'abord", () => {
    expect(availablePaymentMethods(ON)).toEqual(["cash", "card"]);
  });

  it("retombe sur les espèces quand aucun choix n'a été fait", () => {
    expect(resolvePaymentMethod(null, ON)).toBe("cash");
    expect(resolvePaymentMethod(undefined, OFF)).toBe("cash");
  });

  it("n'enregistre JAMAIS un mode qui n'est pas proposé", () => {
    // Le cas réel : le client avait choisi « payer en ligne », le réglage a été éteint entre-temps
    // (ou l'écran vient d'un état plus ancien). On enregistre les espèces, pas une carte fantôme.
    expect(resolvePaymentMethod("card", OFF)).toBe("cash");
    expect(availablePaymentMethods(OFF)).not.toContain("card");
  });

  it("respecte un choix valide", () => {
    expect(resolvePaymentMethod("card", ON)).toBe("card");
    expect(resolvePaymentMethod("cash", ON)).toBe("cash");
    expect(resolvePaymentMethod("cash", OFF)).toBe("cash");
  });

  it("étiquette les cartes en un mot", () => {
    expect(PAYMENT_METHOD_LABELS.cash).toBe("Espèces");
    expect(PAYMENT_METHOD_LABELS.card).toBe("En ligne");
    expect(PAYMENT_METHOD_LABELS.cash).not.toMatch(/à bord/i);
  });

  it("dit Indisponible quand le paiement en ligne est fermé — pas une phrase", () => {
    const notice = paymentMethodNotice("cash", OFF);

    expect(notice).toBe(ONLINE_PAYMENT_DISABLED_NOTICE);
    expect(notice).toBe(ONLINE_PAYMENT_UNAVAILABLE_LABEL);
    expect(notice).not.toContain("serez débité");
    expect(notice.split(/\s+/)).toHaveLength(1);
  });

  it("annonce un débit court quand il est ouvert et choisi", () => {
    expect(paymentMethodNotice("card", ON)).toContain("Débit");
    expect(paymentMethodNotice("card", ON)).not.toMatch(/chauffeur n'aura/);
  });

  it("ne rajoute rien sous Espèces quand l'option en ligne est ouverte", () => {
    expect(paymentMethodNotice("cash", ON)).toBe("");
  });
});

/**
 * Le câblage, pas la règle : une règle juste que rien n'appelle ne protège personne.
 */
describe("paymentChoice wiring", () => {
  const { readFileSync } = require("fs") as {
    readFileSync: (path: string, encoding: string) => string;
  };
  const { join } = require("path") as { join: (...parts: string[]) => string };
  const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

  const confirmation = read(join("src", "components", "reservation", "ConfirmationDetails.tsx"));
  const vehicle = read(join("src", "components", "reservation", "VehicleStep.tsx"));
  const hook = read(join("src", "hooks", "useOnlinePaymentEnabled.ts"));
  const choice = read(join("src", "components", "reservation", "PaymentMethodChoice.tsx"));

  it("le mode choisi est enregistré sur la course, résolu contre le réglage", () => {
    expect(confirmation).toContain("payment_method: input.paymentMethod");
    expect(confirmation).toContain("resolvePaymentMethod(paymentMethod");
    expect(vehicle).toContain("PaymentMethodChoice");
  });

  it("le tunnel lit le réglage, et son défaut est fermé", () => {
    expect(hook).toContain("online_payment_enabled");
    expect(hook).toContain("useState(false)");
    expect(vehicle).toContain("useOnlinePaymentEnabled");
  });

  it("montre toujours les deux cartes, et grise En ligne quand elle n'est pas offerte", () => {
    expect(choice).toContain("availablePaymentMethods(context)");
    expect(choice).toContain("ONLINE_PAYMENT_UNAVAILABLE_LABEL");
    expect(choice).toContain("Euro");
    expect(choice).toContain("CreditCard");
    expect(choice).toContain("aria-disabled");
    expect(choice).toContain("disabled={disabled}");
    expect(choice).not.toContain("Espèces à bord");
  });
});
