import DriverLoginForm from "./login-form";
import { getCurrentUser } from "@/lib/database/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Élégance Mobilité | Portail Chauffeur",
  description: "Espace chauffeur Élégance Mobilité",
};

export default async function DriverLoginPage() {
  // Vérifier si l'utilisateur est déjà connecté avec le bon rôle
  const user = await getCurrentUser();
  if (user && user.role === 'app_driver') {
    redirect('/driver-portal');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-950 to-neutral-950 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="/images/logo-white.png"
          alt="Élégance Mobilité"
        />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-900 border border-neutral-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <DriverLoginForm />
        </div>
      </div>
    </div>
  );
}
