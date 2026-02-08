"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id;
    if (id) {
      router.replace(`/backoffice-portal/rides/assign?id=${id}`);
    } else {
      router.replace("/backoffice-portal/rides");
    }
  }, [params, router]);

  return null;
}
