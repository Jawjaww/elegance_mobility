"use client"

export default function AdminOptionsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-100">
        Options et services additionnels
      </h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-neutral-100">
            Options disponibles
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* TODO: Implement options list */}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-neutral-100">
            Tarifs des options
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* TODO: Implement options pricing */}
          </div>
        </div>
      </div>
    </div>
  )
}