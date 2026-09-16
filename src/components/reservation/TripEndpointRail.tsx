import { Flag, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Departure (A) / arrival (B) rail shown next to the reservation inputs.
 *
 * Colours come from the `--ve-map-*` custom properties declared in
 * `src/app/globals.css` so the rail stays in sync with the map markers
 * (blue departure, green arrival) from a single place.
 */
export function TripEndpointRail({
  className,
}: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn("flex w-4 shrink-0 flex-col items-center", className)}
      aria-hidden
    >
      <MapPin className="h-4 w-4 text-[color:var(--ve-map-departure)]" />
      <span
        className="my-1 w-px flex-1"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--ve-map-departure), var(--ve-map-arrival))",
        }}
      />
      <Flag className="h-4 w-4 text-[color:var(--ve-map-arrival)]" />
    </div>
  );
}
