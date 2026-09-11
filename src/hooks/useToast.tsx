"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface ToastContextValue {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ToastProps | null>(null);

  const showToast = useCallback((props: ToastProps) => {
    setCurrent(props);
    setOpen(true);
  }, []);

  const contextValue = useMemo(() => ({ toast: showToast }), [showToast]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setCurrent(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {current && (
          <ToastPrimitives.Root
            open={open}
            onOpenChange={setOpen}
            duration={current.duration ?? 5000}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start overflow-hidden rounded-2xl p-4 shadow-lg shadow-black/40",
              current.variant === "destructive" &&
                "border border-red-500/30 bg-neutral-900 text-white",
              current.variant === "success" &&
                "border border-green-500/30 bg-neutral-900 text-white",
              (!current.variant || current.variant === "default") &&
                "border border-white/10 bg-neutral-900 text-white",
            )}
          >
            <div className="grid min-w-0 flex-1 gap-1">
              {current.title && (
                <ToastPrimitives.Title className="text-sm font-semibold break-words">
                  {current.title}
                </ToastPrimitives.Title>
              )}
              {current.description && (
                <ToastPrimitives.Description className="text-sm opacity-90 break-words">
                  {current.description}
                </ToastPrimitives.Description>
              )}
            </div>
          </ToastPrimitives.Root>
        )}
        <ToastPrimitives.Viewport className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex w-full justify-center px-5 pt-[max(0.75rem,env(safe-area-inset-top))] outline-none sm:inset-x-auto sm:right-5 sm:w-auto sm:max-w-md sm:justify-end sm:px-0" />
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
