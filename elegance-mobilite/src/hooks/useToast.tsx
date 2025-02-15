"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
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
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {current && (
          <ToastPrimitives.Root
            open={open}
            onOpenChange={setOpen}
            className={cn(
              "fixed bottom-4 right-4 z-50 flex items-center justify-between space-x-4 rounded-md border border-neutral-200 bg-white p-6 shadow-lg transition-all dark:border-neutral-800 dark:bg-neutral-900",
              current.variant === "destructive" && "border-red-600 bg-red-600 text-white"
            )}
          >
            <div className="grid gap-1">
              {current.title && (
                <ToastPrimitives.Title className="text-sm font-semibold">
                  {current.title}
                </ToastPrimitives.Title>
              )}
              {current.description && (
                <ToastPrimitives.Description className="text-sm opacity-90">
                  {current.description}
                </ToastPrimitives.Description>
              )}
            </div>
          </ToastPrimitives.Root>
        )}
        <ToastPrimitives.Viewport className="fixed bottom-0 right-0 z-[100] flex flex-col p-6 gap-2 w-[390px] m-0" />
      </ToastPrimitives.Provider>
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