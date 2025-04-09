"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

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
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {current && (
          <ToastPrimitives.Root
            open={open}
            onOpenChange={setOpen}
            className={cn(
              "fixed z-[100] flex items-center justify-between space-x-4 rounded-md p-4 shadow-lg transition-all w-[calc(100%-2rem)] sm:w-auto max-w-md", // Adjusted padding and width
              "left-1/2 -translate-x-1/2 top-4 sm:left-auto sm:translate-x-0 sm:right-4", // Position top-center (mobile) / top-right (desktop)
              current.variant === "destructive" && "border border-red-800 bg-red-900 text-white", // Darker solid red
              current.variant === "success" && "border border-green-700 bg-green-800 text-white", // Adjusted success color
              (!current.variant || current.variant === "default") && "border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900" // Default style
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
        {/* Viewport positioning is less critical now as Root handles positioning */}
        <ToastPrimitives.Viewport className="fixed top-0 right-0 z-[100] flex flex-col p-4 gap-2 w-full sm:w-auto m-0" />
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
