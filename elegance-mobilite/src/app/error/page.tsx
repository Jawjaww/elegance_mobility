'use client';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
        <p className="text-gray-600 mt-4">Une erreur s'est produite.</p>
      </div>
    </div>
  );
}
