"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DriverProfileSetup from "@/components/drivers/DriverProfileSetup";
import { MobileStepperHeader, SECTIONS } from "@/components/drivers/MobileStepperHeader";
import { supabase } from "@/lib/database/client";
import type { User } from "@supabase/supabase-js";

export default function DriverProfileSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);

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
    <>
      {/* Mobile Stepper Header - Fixed at top */}
      <MobileStepperHeader currentSection={currentSection} sections={SECTIONS} />
      
      {/* Main Content with padding for mobile header */}
      <div className="min-h-screen pt-[72px] md:pt-0">
        <DriverProfileSetup 
          user={user} 
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        />
      </div>
    </>
  );
}
