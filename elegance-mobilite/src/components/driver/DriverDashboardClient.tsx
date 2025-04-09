"use client";

import { Car } from "lucide-react";

interface DriverDashboardClientProps {
  children: React.ReactNode;
  user: any;
}

export default function DriverDashboardClient({
  children,
  user,
}: DriverDashboardClientProps) {
  return (
    <div className="flex h-screen bg-neutral-900">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-800 text-white p-4">
        <h1 className="text-xl font-bold mb-6 flex items-center">
          <Car className="mr-2" />
          Portail Chauffeur
        </h1>
        <nav className="space-y-1">
          <a
            href="/driver/dashboard"
            className="block py-2 px-4 rounded hover:bg-neutral-700"
          >
            Tableau de bord
          </a>
          <a
            href="/driver/courses"
            className="block py-2 px-4 rounded hover:bg-neutral-700"
          >
            Mes courses
          </a>
          <a
            href="/driver/profile"
            className="block py-2 px-4 rounded hover:bg-neutral-700"
          >
            Mon profil
          </a>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-neutral-950 text-white">
        {children}
      </div>
    </div>
  );
}
