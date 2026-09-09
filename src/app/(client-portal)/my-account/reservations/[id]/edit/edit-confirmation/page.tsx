import { EditConfirmationDetails } from "@/components/reservation/EditConfirmationDetails";
import { LandingDesktopPanel } from "@/components/landing/LandingDesktopPanel";
import { LANDING_PAGE_FLOW } from "@/components/landing/landingSurface";

export function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id: reservationId } = await params;

  if (!reservationId) {
    return (
      <section className={`relative ${LANDING_PAGE_FLOW}`}>
        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <LandingDesktopPanel>
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-bold text-red-500">Erreur</h1>
              <p>Identifiant de réservation manquant</p>
            </div>
          </LandingDesktopPanel>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative ${LANDING_PAGE_FLOW}`}>
      <div className="relative z-10 mx-auto w-full max-w-4xl lg:max-w-6xl">
        <LandingDesktopPanel>
          <EditConfirmationDetails reservationId={reservationId} />
        </LandingDesktopPanel>
      </div>
    </section>
  );
}
