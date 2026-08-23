"use client";

import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

type CopyableRefProps = Readonly<{
  value: string;
  /** Short label shown in the UI (defaults to first 8 chars with #). */
  label?: string;
  title?: string;
  toastTitle?: string;
  className?: string;
}>;

export function CopyableRef({
  value,
  label,
  title,
  toastTitle = "Copié",
  className,
}: CopyableRefProps) {
  const { toast } = useToast();
  const display = label ?? `#${value.slice(0, 8)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: toastTitle, description: value });
    } catch {
      toast({
        title: "Copie impossible",
        description: value,
        variant: "destructive",
      });
    }
  };

  return (
    <button
      type="button"
      title={title ?? `Copier : ${value}`}
      onClick={(e) => {
        e.stopPropagation();
        void copy();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void copy();
      }}
      className={cn(
        "font-mono text-[10px] sm:text-xs text-neutral-600 hover:text-neutral-400 tracking-wide select-all transition-colors",
        className,
      )}
    >
      {display}
    </button>
  );
}
