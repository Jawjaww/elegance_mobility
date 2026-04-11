import type { Database } from "@/lib/types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2Icon, TrashIcon } from "lucide-react";

type Rate = Database["public"]["Tables"]["rates"]["Row"];

interface RateCardProps {
  rate: Rate;
  onEdit?: (rate: Rate) => void;
  onDelete?: (rate: Rate) => void;
}

export default function RateCard({ rate, onEdit, onDelete }: RateCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium capitalize">
          {rate.vehicle_type.toLowerCase()}
        </CardTitle>
        <Badge
          variant={rate.vehicle_type === "STANDARD" ? "default" : "secondary"}
        >
          {rate.vehicle_type}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix de base</span>
            <span className="font-medium">{formatPrice(rate.base_price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix/km</span>
            <span className="font-medium">
              {formatPrice(rate.price_per_km)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix minimum</span>
            <span className="font-medium">{formatPrice(rate.min_price)}</span>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-2 mt-4">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(rate)}>
                <Edit2Icon className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(rate)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
