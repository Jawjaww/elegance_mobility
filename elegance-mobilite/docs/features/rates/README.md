# Système de tarification

## Vue d'ensemble

Le système de tarification gère dynamiquement les prix des courses, les promotions, et les politiques tarifaires.

## Modèles de données

```typescript
interface Rate {
  id: string;
  name: string;
  vehicleType: VehicleType;
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumPrice: number;
  peakMultiplier: number;
  waitingPrice: number;
  options: RateOption[];
  conditions: RateCondition[];
  validFrom: Date;
  validTo?: Date;
}

interface PromoCode {
  code: string;
  type: 'fixed' | 'percentage' | 'free_options';
  value: number;
  maxUses: number;
  usesPerUser: number;
  validFrom: Date;
  validTo: Date;
  conditions: PromoCondition[];
  metadata: PromoMetadata;
}

interface RateCondition {
  type: 'time' | 'zone' | 'distance' | 'weather';
  value: any;
  multiplier: number;
}

interface PeakHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  multiplier: number;
}
```

## Calcul des prix

### 1. Prix de base

```typescript
// src/lib/services/pricingService.ts
const calculateBasePrice = (
  distance: number,
  duration: number,
  rate: Rate
): number => {
  const distancePrice = distance * rate.pricePerKm;
  const timePrice = duration * rate.pricePerMinute;
  const price = rate.basePrice + distancePrice + timePrice;
  
  return Math.max(price, rate.minimumPrice);
};
```

### 2. Multiplicateurs

```typescript
const applyMultipliers = (
  basePrice: number,
  conditions: RateCondition[]
): number => {
  let finalPrice = basePrice;
  
  for (const condition of conditions) {
    if (checkCondition(condition)) {
      finalPrice *= condition.multiplier;
    }
  }
  
  return finalPrice;
};
```

### 3. Promotions

```typescript
const applyPromotion = (
  price: number,
  promo: PromoCode
): number => {
  switch (promo.type) {
    case 'fixed':
      return Math.max(0, price - promo.value);
    case 'percentage':
      return price * (1 - promo.value / 100);
    default:
      return price;
  }
};
```

## API Routes

```typescript
// Gestion des tarifs
POST /api/rates              // Créer un tarif
GET /api/rates              // Liste des tarifs
GET /api/rates/:id          // Détails d'un tarif
PATCH /api/rates/:id        // Modifier un tarif
DELETE /api/rates/:id       // Supprimer un tarif

// Gestion des promotions
POST /api/promos           // Créer une promotion
GET /api/promos           // Liste des promotions
POST /api/promos/validate // Valider un code promo
```

## Hooks personnalisés

```typescript
// src/hooks/usePrice.ts
const usePrice = (
  distance: number,
  duration: number,
  options: string[]
) => {
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    calculatePrice(distance, duration, options)
      .then(setPrice)
      .finally(() => setLoading(false));
  }, [distance, duration, options]);

  return { price, loading };
};

// src/hooks/usePromoCode.ts
const usePromoCode = (code: string) => {
  const validate = async () => {/* ... */};
  const apply = async (price: number) => {/* ... */};
  
  return { validate, apply };
};
```

## Gestionnaire de tarifs

```typescript
// src/components/rates/RateManager.tsx
const RateManager = () => {
  const { rates, loading } = useRates();
  
  return (
    <div>
      <RateList rates={rates} />
      <PeakHoursEditor />
      <OptionsManager />
      <ConditionsEditor />
    </div>
  );
};
```

## Validation des promotions

```typescript
// src/lib/services/promoValidationService.ts
interface PromoValidation {
  validateCode: (
    code: string,
    userId: string,
    rideDetails: RideDetails
  ) => Promise<ValidationResult>;
  
  checkEligibility: (
    promo: PromoCode,
    user: User
  ) => Promise<boolean>;
  
  trackUsage: (
    promoCode: string,
    userId: string,
    rideId: string
  ) => Promise<void>;
}
```

## Événements système

```typescript
type PricingEvent =
  | { type: 'RATE_CREATED'; rate: Rate }
  | { type: 'RATE_UPDATED'; rate: Rate }
  | { type: 'PROMO_CREATED'; promo: PromoCode }
  | { type: 'PROMO_USED'; promo: PromoCode; userId: string }
  | { type: 'PRICE_CALCULATED'; details: PriceCalculation };
```

## Tests

```typescript
describe('Pricing Service', () => {
  test('calculates base price correctly', () => {
    const price = calculateBasePrice(10, 20, defaultRate);
    expect(price).toBe(/* expected value */);
  });

  test('applies peak hours multiplier', () => {
    const price = applyPeakHours(100, peakHoursConfig);
    expect(price).toBe(/* expected value */);
  });

  test('validates and applies promo codes', async () => {
    const result = await validateAndApplyPromo('CODE10', 100);
    expect(result).toBe(/* expected value */);
  });
});
```

## Administration

### Interface de gestion

```typescript
// src/components/admin/RatesAdmin.tsx
const RatesAdmin = () => {
  return (
    <AdminLayout>
      <RatesList />
      <PromoCodeManager />
      <PricingRules />
      <PeakHoursCalendar />
    </AdminLayout>
  );
};
```

### Audit et historique

```sql
CREATE TABLE price_calculations (
  id UUID PRIMARY KEY,
  ride_id UUID REFERENCES rides(id),
  base_price DECIMAL,
  final_price DECIMAL,
  applied_rules JSONB,
  promo_code UUID REFERENCES promo_codes(id),
  calculated_at TIMESTAMP
);
```

## Documentation associée

- [Guide d'administration](../../guides/rates-admin.md)
- [API de tarification](../../api/rates.md)
- [Politique de prix](../../policies/pricing.md)
