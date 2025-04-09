import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { MobileAdminNav } from "@/components/layout/MobileAdminNav";
import { getCurrentUser, hasAdminAccess } from "@/lib/database/server";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/admin-login");
  }

  const isAdmin = await hasAdminAccess();
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <AdminHeader adminLevel={user.role} />
      <div className="content-container py-6 flex-grow pb-20 md:pb-6">
        {children}
      </div>
      <MobileAdminNav />
    </div>
  );
}
