import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountPageHeaderProps = Readonly<{
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}>;

export function AccountPageHeader({
  title,
  description,
  backHref,
  action,
  className,
}: AccountPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {backHref ? (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0 text-neutral-400 hover:text-white hover:bg-blue-500/10"
          >
            <Link href={backHref} aria-label="Retour">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-neutral-400">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0 sm:pt-0.5">{action}</div> : null}
    </div>
  );
}
