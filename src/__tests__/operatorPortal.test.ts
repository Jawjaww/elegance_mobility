import { readFileSync } from "fs";
import { join } from "path";

/**
 * LE PORTAIL OPÉRATEUR — ce qui doit rester vrai, et ce qui l'était déjà.
 *
 * Le backlog portait « Reste d'OP-05 : les écrans /operator-portal ». C'était **périmé** : les
 * quatre écrans, la garde et les deux RPC existaient. Ce fichier ne les reconstruit donc pas, il
 * tient ce qui les rend corrects — et il est né d'une vérification, pas d'une relecture.
 *
 * La règle centrale est celle de l'isolation, et elle a une forme précise dans ce dépôt : **la
 * portée est la politique RLS, pas un filtre**. Un `.eq("operator_id", …)` écrit ici serait une
 * seconde réponse à « à qui sont ces courses », c'est-à-dire exactement l'endroit où les deux
 * réponses finiraient par diverger. L'écran des courses de l'app chauffeur a déjà tranché ce point
 * dans le même sens ; ce test l'applique au portail.
 */
const ROOT = join(process.cwd(), "src", "app", "operator-portal");

/**
 * Les commentaires sont RETIRÉS avant tout scan, et c'est la technique du dépôt pour cette classe
 * de test. Mes deux premières assertions ont échoué à cause d'eux : la garde ne mentionne
 * `operator_members` que dans un commentaire qui explique la doctrine, et le portail ne portait
 * `operator_id` qu'en annotation de type et en colonne sélectionnée. Un test qui lit la prose juge
 * la prose.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function read(relative: string): string {
  return stripComments(readFileSync(join(ROOT, relative), "utf8"));
}

const SCREENS = ["page.tsx", "drivers/page.tsx", "vehicles/page.tsx", "rides/page.tsx", "rates/page.tsx"];

describe("the operator portal", () => {
  it("garde ses cinq écrans", () => {
    for (const screen of SCREENS) {
      expect(read(screen).length).toBeGreaterThan(400);
    }
  });

  it("passe par une porte de rôle, et laisse la portée au SQL", () => {
    const layout = read("layout.tsx");
    const guard = stripComments(
      readFileSync(
        join(process.cwd(), "src", "components", "auth", "OperatorAuthGuard.tsx"),
        "utf8",
      ),
    );

    // Le portail est monté derrière la garde…
    expect(layout).toContain("OperatorAuthGuard");
    // …et la garde ne décide que de la PORTE : le rôle du JWT.
    expect(guard).toContain("isUserOperator");
    // L'appartenance à une flotte est lue par la PAGE, pas par la garde : celle-ci ne doit pas
    // interroger la table, sinon la décision de portée vivrait à deux endroits.
    expect(guard).not.toContain('from("operator_members")');
    // Le pendant positif : la portée est bien lue quelque part, depuis la table.
    expect(read(join("_components", "useOperatorTenant.ts"))).toContain(
      'from("operator_members")',
    );
  });

  it("n'écrit jamais de filtre de portée : c'est la politique RLS qui répond", () => {
    for (const screen of SCREENS) {
      const source = read(screen);
      // Une seconde réponse à « à qui est cette ligne » est le défaut que ce test interdit.
      expect(source).not.toMatch(/\.eq\(\s*["']operator_id["']/);
      // Un filtre peut aussi s'écrire en objet (`{ operator_id: id }`) ou via `match`.
      expect(source).not.toMatch(/\.match\(\s*\{[^}]*operator_id/);
      expect(source).not.toMatch(/\.filter\(\s*["']operator_id["']/);
    }
  });

  it("appelle les deux RPC d'exploitation, sans les réimplémenter", () => {
    const rides = read("rides/page.tsx");

    // « peut affecter dans cette flotte » : les deux gestes d'exploitation passent par les
    // enveloppes d'autorisation de la base (« wrap, do not fork »).
    expect(rides).toContain('rpc("operator_cancel_ride"');
    expect(rides).toContain('rpc("operator_reassign_ride"');
    // Réécrire l'annulation ici serait la deuxième copie que la roadmap interdit.
    expect(rides).not.toContain("_cancel_ride_core");
    expect(rides).not.toContain("_reassign_ride_core");
  });

  it("ne propose aucun geste de dossier chauffeur : la portée est en lecture seule", () => {
    // D-09 : validate_driver_dossier reste réservée à l'admin plateforme. Un écran opérateur qui
    // l'appellerait ne serait pas une fonctionnalité manquante, ce serait une décision inversée.
    for (const screen of SCREENS) {
      const source = read(screen);
      expect(source).not.toContain("validate_driver_dossier");
      expect(source).not.toContain("admin_set_driver_status");
    }
  });
});
