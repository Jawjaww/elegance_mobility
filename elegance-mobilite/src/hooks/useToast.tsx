"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { 
  Toast, 
  ToastProvider as UiToastProvider, 
  ToastTitle, 
  ToastDescription, 
  ToastViewport 
} from "@/components/ui/toast";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

interface ToastContextValue {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ToastProps | null>(null);

  const showToast = useCallback((props: ToastProps) => {
    setCurrent(props);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setCurrent(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      <UiToastProvider swipeDirection="right">
        {children}
        {current && (
          <Toast
            variant={current.variant}
            open={open}
            onOpenChange={setOpen}
            className="fixed z-[100] w-[calc(100%-2rem)] sm:w-auto max-w-md left-1/2 -translate-x-1/2 top-4 sm:left-auto sm:translate-x-0 sm:right-4"
          >
            <div className="grid gap-1">
              {current.title && (
                <ToastTitle className="text-sm font-semibold">
                  {current.title}
                </ToastTitle>
              )}
              {current.description && (
                <ToastDescription className="text-sm opacity-90">
                  {current.description}
                </ToastDescription>
              )}
            </div>
          </Toast>
        )}
        <ToastViewport />
      </UiToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
