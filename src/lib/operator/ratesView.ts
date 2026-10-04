/**
 * Ce que l'écran des tarifs d'une flotte doit montrer : le défaut plateforme, remplacé par la
 * surcharge de la flotte quand elle existe.
 *
 * `rates` porte les deux dans la même table depuis `20261003180000` : `operator_id IS NULL` est
 * le tarif plateforme (lisible par tous, y compris `anon` pour le devis public), et une ligne
 * avec `operator_id` est la surcharge d'une flotte. La RLS ne renvoie à un opérateur que ses
 * propres lignes et les défauts — mais l'écran filtre quand même, parce qu'un écran ne doit pas
 * dépendre d'une politique pour ne pas montrer le prix d'un concurrent.
 */

export interface OperatorRateRow {
  vehicle_type: string;
  base_price: number;
  price_per_km: number;
  min_price: number;
  operator_id: string | null;
}

export interface OperatorRateView extends OperatorRateRow {
  source: "platform" | "override";
}

export function buildOperatorRatesView(
  rows: readonly OperatorRateRow[],
  myOperatorId: string | null | undefined,
): OperatorRateView[] {
  const byVehicleType = new Map<string, OperatorRateView>();

  for (const row of rows) {
    if (row.operator_id === null || row.operator_id === undefined) {
      // Le défaut plateforme ne remplace jamais une surcharge déjà vue, quel que soit l'ordre
      // dans lequel la base renvoie les lignes.
      if (!byVehicleType.has(row.vehicle_type)) {
        byVehicleType.set(row.vehicle_type, { ...row, source: "platform" });
      }
      continue;
    }

    if (row.operator_id === myOperatorId) {
      byVehicleType.set(row.vehicle_type, { ...row, source: "override" });
    }
  }

  // `Array.from` et non un spread d'itérateur : la cible TypeScript du projet est antérieure à
  // es2015, où étaler un `MapIterator` n'est pas compilable.
  return Array.from(byVehicleType.values()).sort((a, b) =>
    a.vehicle_type.localeCompare(b.vehicle_type),
  );
}
