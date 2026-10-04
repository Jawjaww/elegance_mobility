import {
  availablePaymentMethods,
  ONLINE_PAYMENT_DISABLED_NOTICE,
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

  it("dit au client qu'il réglera le chauffeur quand le paiement en ligne est fermé", () => {
    const notice = paymentMethodNotice("cash", OFF);

    expect(notice).toBe(ONLINE_PAYMENT_DISABLED_NOTICE);
    expect(notice).toContain("chauffeur");
    // Et surtout : la phrase ne doit pas laisser croire à un paiement en ligne.
    expect(notice).not.toContain("serez débité");
  });

  it("annonce le débit en ligne quand il est ouvert et choisi", () => {
    expect(paymentMethodNotice("card", ON)).toContain("débité");
    expect(paymentMethodNotice("card", ON)).toContain("rien à encaisser");
  });

  it("dit qu'on paie le chauffeur quand les espèces sont choisies et l'option ouverte", () => {
    const notice = paymentMethodNotice("cash", ON);

    expect(notice).toContain("chauffeur");
    expect(notice).not.toContain("débité");
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
  const choice = read(join("src", "components", "reservation", "PaymentMethodChoice.tsx"));

  it("le mode choisi est enregistré sur la course, résolu contre le réglage", () => {
    expect(confirmation).toContain("payment_method: input.paymentMethod");
    expect(confirmation).toContain("resolvePaymentMethod(paymentMethod");
  });

  it("le tunnel lit le réglage, et son défaut est fermé", () => {
    expect(confirmation).toContain("online_payment_enabled");
    expect(confirmation).toContain("useState(false)");
  });

  it("l'écran n'affiche que les modes proposés, et dit toujours ce qui va se passer", () => {
    expect(choice).toContain("availablePaymentMethods(context)");
    expect(choice).toContain("paymentMethodNotice(value, context)");
  });
});
