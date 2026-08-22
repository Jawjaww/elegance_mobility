import DriverFolderAdmin from "@/components/admin/drivers/DriverFolderAdmin";

export default async function DriverDocumentsPage({
  params,
}: Readonly<{
  params?: Promise<{ id: string }>;
}>) {
  const resolvedParams = await (params as Promise<{ id: string }>);
  const id = resolvedParams.id;

  return <DriverFolderAdmin driverId={id} />;
}
