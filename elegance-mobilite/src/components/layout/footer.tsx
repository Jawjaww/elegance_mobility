export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-black/50">
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold mb-4">Vector Elegans</h3>
            <p className="text-sm text-neutral-400">
              Service de transport VTC de luxe pour vos déplacements professionnels
              et privés.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>Téléphone: +33 1 XX XX XX XX</li>
              <li>Email: contact@vector-elegans.fr</li>
              <li>Adresse: Paris, France</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Informations légales</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>SIRET: XXX XXX XXX XXXXX</li>
              <li>Licence VTC: XXXXXXXX</li>
              <li>© 2024 Vector Elegans. Tous droits réservés.</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}