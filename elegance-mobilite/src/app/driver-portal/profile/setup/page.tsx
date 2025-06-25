import DriverProfileSetup from '@/components/drivers/DriverProfileSetup';
import { getServerUser } from '@/lib/database/server';
import { redirect } from 'next/navigation';

export default async function DriverProfileSetupPage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/driver-portal/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <DriverProfileSetup user={user} />
      </div>
    </div>
  );
}
