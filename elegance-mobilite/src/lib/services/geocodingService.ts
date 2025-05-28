// "use client";

// interface GeocodingResult {
//   place_id: number;
//   licence: string;
//   osm_type: string;
//   osm_id: number;
//   boundingbox: string[];
//   lat: string;
//   lon: string;
//   display_name: string;
//   class: string;
//   type: string;
//   importance: number;
//   address: {
//     road?: string;
//     suburb?: string;
//     city?: string;
//     county?: string;
//     state?: string;
//     postcode?: string;
//     country?: string;
//     country_code?: string;
//   };
// }

// type CacheEntry = {
//   data: GeocodingResult[];
//   timestamp: number;
// };

// class GeocodingService {
//   private cache: Map<string, CacheEntry>;
//   private requests: Map<string, number>;
//   private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
//   private readonly RATE_LIMIT = 1000; // 1 second between requests
//   private readonly MAX_REQUESTS_PER_MINUTE = 45; // OpenStreetMap limit

//   constructor() {
//     this.cache = new Map();
//     this.requests = new Map();
//   }

//   private shouldThrottle(): boolean {
//     const now = Date.now();
//     const recentRequests = Array.from(this.requests.values()).filter(
//       (timestamp) => now - timestamp < 60000
//     ).length;
//     return recentRequests >= this.MAX_REQUESTS_PER_MINUTE;
//   }

//   private addRequest(key: string): void {
//     this.requests.set(key, Date.now());
//     // Nettoyer les anciennes requêtes
//     const oneMinuteAgo = Date.now() - 60000;
//     for (const [key, timestamp] of this.requests.entries()) {
//       if (timestamp < oneMinuteAgo) {
//         this.requests.delete(key);
//       }
//     }
//   }

//   private getCacheKey(query: string): string {
//     return `geocoding:${query.toLowerCase().trim()}`;
//   }

//   private getFromCache(key: string): GeocodingResult[] | null {
//     const cached = this.cache.get(key);
//     if (!cached) return null;

//     if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
//       this.cache.delete(key);
//       return null;
//     }

//     return cached.data;
//   }

//   private setCache(key: string, data: GeocodingResult[]): void {
//     this.cache.set(key, {
//       data,
//       timestamp: Date.now(),
//     });
//   }

//   async searchAddress(query: string): Promise<GeocodingResult[]> {
//     if (!query.trim()) return [];

//     const cacheKey = this.getCacheKey(query);
//     const cachedResult = this.getFromCache(cacheKey);
//     if (cachedResult) return cachedResult;

//     if (this.shouldThrottle()) {
//       throw new Error("Too many requests. Please try again later.");
//     }

//     // Ajouter un délai entre les requêtes
//     const lastRequest = Array.from(this.requests.values()).sort().pop();
//     if (lastRequest) {
//       const timeSinceLastRequest = Date.now() - lastRequest;
//       if (timeSinceLastRequest < this.RATE_LIMIT) {
//         await new Promise((resolve) =>
//           setTimeout(resolve, this.RATE_LIMIT - timeSinceLastRequest)
//         );
//       }
//     }

//     try {
//       this.addRequest(cacheKey);

//       const params = new URLSearchParams({
//         format: "json",
//         addressdetails: "1",
//         limit: "5",
//         q: query,
//       });

//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/search?${params}`,
//         {
//           headers: {
//             "User-Agent": "Elegance-Mobilite/1.0",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch address suggestions");
//       }

//       const data = await response.json() as GeocodingResult[];
//       this.setCache(cacheKey, data);

//       return data;
//     } catch (error) {
//       console.error("Geocoding error:", error);
//       throw error;
//     }
//   }

//   clearCache(): void {
//     this.cache.clear();
//   }
// }

// // Export une instance singleton
// export const geocodingService = new GeocodingService();