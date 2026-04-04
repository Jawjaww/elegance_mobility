import DriverFolderAdmin from "@/components/admin/drivers/DriverFolderAdmin";

export default async function DriverDocumentsPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await (params as Promise<{ id: string }>);
  const id = resolvedParams.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">
        Dossier du chauffeur
      </h1>
      <DriverFolderAdmin driverId={id} />
    </div>
  );
}
