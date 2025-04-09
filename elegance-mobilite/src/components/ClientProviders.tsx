"use client";

import { ThemeProvider } from "./ThemeProvider";
import { ReactNode } from "react";
import { ToastProvider } from "@/hooks/useToast";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
