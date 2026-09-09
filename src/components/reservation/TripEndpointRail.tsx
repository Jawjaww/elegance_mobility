import { LandPlot, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/** Departure (A) is blue, arrival (B) is green — matches map pins. */
export function TripEndpointRail({
  className,
}: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn("flex w-4 shrink-0 flex-col items-center", className)}
      aria-hidden
    >
      <MapPin className="h-4 w-4 text-blue-400" />
      <span className="my-1 w-px flex-1 bg-gradient-to-b from-blue-400/50 to-emerald-400/50" />
      <LandPlot className="h-4 w-4 text-emerald-400" />
    </div>
  );
}
