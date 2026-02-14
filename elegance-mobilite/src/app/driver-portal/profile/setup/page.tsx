"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DriverProfileSetup from "@/components/drivers/DriverProfileSetup";
import { supabase } from "@/lib/database/client";
import type { User } from "@supabase/supabase-js";

export default function DriverProfileSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/auth/login?from=driver");
        return;
      }

      setUser(user);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgba(74,119,168,0.9)]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <DriverProfileSetup user={user} />
    </div>
  );
}
