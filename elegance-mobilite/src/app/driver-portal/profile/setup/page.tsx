import ModernDriverProfileSetup from '@/components/drivers/ModernDriverProfileSetup';
import { getServerUser } from '@/lib/database/server';
import { redirect } from 'next/navigation';

export default async function DriverProfileSetupPage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/driver-portal/login');
  }

  return <ModernDriverProfileSetup userId={user.id} />;
}
