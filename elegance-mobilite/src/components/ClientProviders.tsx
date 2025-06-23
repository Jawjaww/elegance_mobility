"use client";

import { ThemeProvider } from "./ThemeProvider";
import { ReactNode } from "react";
import { ToastProvider } from "@/hooks/useToast";
import { QueryProvider } from "./providers/QueryProvider";

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
      <QueryProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}