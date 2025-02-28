import { redirect } from 'next/navigation'

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">
            {searchParams.message || "Une erreur s'est produite"}
          </p>
          <button
            onClick={() => redirect('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  )
}
