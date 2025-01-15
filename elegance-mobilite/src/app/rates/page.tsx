import { MINIMUM_FARE, PREMIUM_MINIMUM_FARE } from '../../lib/rates'

export default function Rates() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Nos Tarifs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Standard Rates */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Service Standard</h2>
            <p className="text-gray-600 mb-4">Tarif minimum : {MINIMUM_FARE}€</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Heures Creuses (20h-7h & week-end)</h3>
                <ul className="text-sm text-gray-600">
                  <li>Tarif de base : 1.50€/km</li>
                  <li>Tarif minute : 0.50€/min</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">Heures Pleines (7h-20h en semaine)</h3>
                <ul className="text-sm text-gray-600">
                  <li>Tarif de base : 1.80€/km</li>
                  <li>Tarif minute : 0.60€/min</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Premium Rates */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Service Premium</h2>
            <p className="text-gray-600 mb-4">Tarif minimum : {PREMIUM_MINIMUM_FARE}€</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Heures Creuses (20h-7h & week-end)</h3>
                <ul className="text-sm text-gray-600">
                  <li>Tarif de base : 2.00€/km</li>
                  <li>Tarif minute : 0.70€/min</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">Heures Pleines (7h-20h en semaine)</h3>
                <ul className="text-sm text-gray-600">
                  <li>Tarif de base : 2.30€/km</li>
                  <li>Tarif minute : 0.80€/min</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          * Les tarifs sont calculés en fonction de la distance parcourue et du temps de course.
          Le prix final ne peut être inférieur au tarif minimum réglementaire.
        </p>
      </div>
    </main>
  )
}
