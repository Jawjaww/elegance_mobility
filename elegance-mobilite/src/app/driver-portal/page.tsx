export default function DriverDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Mes courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-800 p-6 rounded-lg shadow border border-emerald-700">
          <h2 className="text-xl font-semibold mb-4 text-emerald-200">
            Courses à venir
          </h2>
          {/* Contenu du tableau de bord */}
          <p className="text-emerald-300">Contenu à implémenter</p>
        </div>

        <div className="bg-emerald-800 p-6 rounded-lg shadow border border-emerald-700">
          <h2 className="text-xl font-semibold mb-4 text-emerald-200">
            Courses en attente d'acceptation
          </h2>
          {/* Contenu du tableau de bord */}
          <p className="text-emerald-300">Contenu à implémenter</p>
        </div>
      </div>
    </div>
  );
}
