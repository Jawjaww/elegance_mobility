// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { formatDuration } from "@/lib/utils";
// import { 
//   Card, 
//   CardContent, 
//   CardFooter, 
//   CardHeader, 
//   CardTitle 
// } from '@/components/ui/card';
// import { StatusBadge } from '@/components/reservation/StatusBadge';
// import { 
//   Badge, 
//   Calendar, 
//   Clock, 
//   MapPin, 
//   Car, 
//   ArrowRight, 
//   Euro, 
//   Info, 
//   X 
// } from 'lucide-react';
// import { 
//   Dialog, 
//   DialogContent, 
//   DialogDescription, 
//   DialogFooter, 
//   DialogHeader, 
//   DialogTitle 
// } from '@/components/ui/dialog';
// import { Separator } from '@/components/ui/separator';
// import { formatCurrency } from '@/lib/utils';
// import { format } from 'date-fns';
// import { fr } from 'date-fns/locale';
// import Link from 'next/link';

// // Type pour les données de réservation
// interface Reservation {
//   id: string;
//   pickup_address: string;
//   dropoff_address: string;
//   pickup_time: string;
//   vehicle_type: string;
//   status: string;
//   estimated_price: number;
//   distance: number;
//   duration: number;
//   created_at: string;
//   options?: string[];
// }

// interface ReservationCardProps {
//   reservation: Reservation;
//   onCancel?: () => void;
//   onEdit?: () => void; // Ajouter la prop onEdit
//   isPast?: boolean;
// }

// // Fonction pour traduire le statut
// const translateStatus = (status: string) => {
//   const statusMap: Record<string, { label: string, color: string }> = {
//     'pending': { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-500' },
//     'confirmed': { label: 'Confirmée', color: 'bg-green-500/20 text-green-500' },
//     'assigned': { label: 'Chauffeur assigné', color: 'bg-blue-500/20 text-blue-500' },
//     'in_progress': { label: 'En cours', color: 'bg-purple-500/20 text-purple-500' },
//     'completed': { label: 'Terminée', color: 'bg-neutral-500/20 text-neutral-400' },
//     'canceled': { label: 'Annulée', color: 'bg-red-500/20 text-red-400' }, // 'canceled' au lieu de 'canceled'
//   };
  
//   return statusMap[status] || { label: status, color: 'bg-neutral-500/20 text-neutral-400' };
// };

// export function ReservationCard({ reservation, onCancel, onEdit, isPast = false }: ReservationCardProps) {
//   const [showDetails, setShowDetails] = useState(false);
//   const [confirmCancel, setConfirmCancel] = useState(false);
  
//   const formattedDate = format(
//     new Date(reservation.pickup_time),
//     'd MMMM yyyy à HH:mm',
//     { locale: fr }
//   );
  
//   const status = translateStatus(reservation.status);
//   // Utiliser 'canceled' au lieu de 'canceled' et vérifier si la réservation est modifiable
//   const canCancel = ['pending', 'confirmed'].includes(reservation.status) && !isPast;
//   const canEdit = ['pending', 'confirmed'].includes(reservation.status) && !isPast && onEdit;

//   return (
//     <>
//       <Card className="bg-neutral-900 border border-neutral-800 overflow-hidden transition-all hover:border-neutral-700">
//         <CardHeader className="pb-3">
//           <div className="flex justify-between items-start">
//             <div className="flex flex-col">
//               <CardTitle className="text-lg font-semibold">Trajet VTC</CardTitle>
//               <p className="text-sm text-neutral-400">
//                 {formattedDate}
//               </p>
//             </div>
//             <StatusBadge 
//               status={reservation.status} 
//               className="px-2 py-1 rounded-md text-xs font-medium"
//             />
//           </div>
//         </CardHeader>
        
//         <CardContent className="pb-3">
//           <div className="space-y-4">
//             {/* Adresses */}
//             <div className="flex items-start gap-3">
//               <div className="flex flex-col items-center mt-1">
//                 <div className="h-6 w-6 rounded-full bg-blue-900/30 flex items-center justify-center">
//                   <MapPin className="h-3 w-3 text-blue-500" />
//                 </div>
//                 <div className="h-8 border-l border-dashed border-neutral-700"></div>
//                 <div className="h-6 w-6 rounded-full bg-blue-900/30 flex items-center justify-center">
//                   <MapPin className="h-3 w-3 text-blue-500" />
//                 </div>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-neutral-400">Départ</p>
//                   <p className="text-white truncate max-w-xs">{reservation.pickup_address}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-neutral-400">Destination</p>
//                   <p className="text-white truncate max-w-xs">{reservation.dropoff_address}</p>
//                 </div>
//               </div>
//             </div>
            
//             {/* Détails véhicule */}
//             <div className="flex gap-4">
//               <div className="flex items-center gap-2">
//                 <Car className="h-4 w-4 text-neutral-400" />
//                 <span className="text-white capitalize">
//                   {reservation.vehicle_type?.toLowerCase() || 'Standard'}
//                 </span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Euro className="h-4 w-4 text-neutral-400" />
//                 <span className="text-white">
//                   {formatCurrency(reservation.estimated_price || 0)}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </CardContent>
        
//         <CardFooter className="pt-3">
//           <div className="w-full flex justify-between items-center">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setShowDetails(true)}
//               className="text-neutral-300 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-700 hover:text-neutral-300"
//             >
//               <Info className="mr-2 h-4 w-4" />
//               Détails
//             </Button>
            
//             <div className="flex gap-2">
//               {canCancel && onCancel && (
//                 <Button
//                   variant="destructive"
//                   size="sm"
//                   onClick={() => setConfirmCancel(true)}
//                   className="bg-red-900/20 text-red-400 hover:bg-red-900/40"
//                 >
//                   <X className="mr-2 h-4 w-4" />
//                   Annuler
//                 </Button>
//               )}
              
//               {canEdit && (
//                 <Button
//                   variant="default"
//                   size="sm"
//                   onClick={onEdit}
//                   className="bg-blue-600 text-white"
//                 >
//                   <Calendar className="mr-2 h-4 w-4" />
//                   Modifier
//                 </Button>
//               )}
//             </div>
//           </div>
//         </CardFooter>
//       </Card>

//       {/* Modale détails */}
//       <Dialog open={showDetails} onOpenChange={setShowDetails}>
//         <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
//           <DialogHeader>
//             <DialogTitle className="text-xl font-semibold">Détails de votre réservation</DialogTitle>
//             <DialogDescription className="text-neutral-400">
//               {formattedDate}
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="space-y-6 py-4">
//             <div className="flex items-start gap-3">
//               <div className="flex flex-col items-center mt-1">
//                 <div className="h-6 w-6 rounded-full bg-blue-900/30 flex items-center justify-center">
//                   <MapPin className="h-3 w-3 text-blue-500" />
//                 </div>
//                 <div className="h-8 border-l border-dashed border-neutral-700"></div>
//                 <div className="h-6 w-6 rounded-full bg-blue-900/30 flex items-center justify-center">
//                   <MapPin className="h-3 w-3 text-blue-500" />
//                 </div>
//               </div>
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-neutral-400">Départ</p>
//                   <p className="text-white">{reservation.pickup_address}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-neutral-400">Destination</p>
//                   <p className="text-white">{reservation.dropoff_address}</p>
//                 </div>
//               </div>
//             </div>
            
//             <Separator className="bg-neutral-800" />
            
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-neutral-400">Date et heure</p>
//                 <div className="flex items-center gap-2 mt-1">
//                   <Calendar className="h-4 w-4 text-blue-400" />
//                   <p>{formattedDate}</p>
//                 </div>
//               </div>
              
//               <div>
//                 <p className="text-sm text-neutral-400">Type de véhicule</p>
//                 <div className="flex items-center gap-2 mt-1">
//                   <Car className="h-4 w-4 text-blue-400" />
//                   <p className="capitalize">{reservation.vehicle_type?.toLowerCase() || 'Standard'}</p>
//                 </div>
//               </div>
              
//               <div>
//                 <p className="text-sm text-neutral-400">Distance</p>
//                 <div className="flex items-center gap-2 mt-1">
//                   <ArrowRight className="h-4 w-4 text-blue-400" />
//                   <p>{reservation.distance} km</p>
//                 </div>
//               </div>
              
//               <div>
//                 <p className="text-sm text-neutral-400">Durée estimée</p>
//                 <div className="flex items-center gap-2 mt-1">
//                   <Clock className="h-4 w-4 text-blue-400" />
//                   <p>{formatDuration(reservation.duration)}</p>
//                 </div>
//               </div>
//             </div>
            
//             {reservation.options && reservation.options.length > 0 && (
//               <>
//                 <Separator className="bg-neutral-800" />
//                 <div>
//                   <p className="text-sm text-neutral-400 mb-2">Options</p>
//                   <div className="flex flex-wrap gap-2">
//                     {reservation.options.map((option, index) => (
//                       <Badge key={index} className="bg-blue-900/20 text-blue-400 rounded-md">
//                         {option}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               </>
//             )}
            
//             <Separator className="bg-neutral-800" />
            
//             <div className="flex justify-between items-center">
//               <p className="text-lg font-semibold">Total</p>
//               <p className="text-lg font-semibold text-blue-500">
//                 {formatCurrency(reservation.estimated_price || 0)}
//               </p>
//             </div>
//           </div>
          
//           <DialogFooter className="flex flex-col md:flex-row w-full items-center gap-4">
//             <div className={`${status.color} px-3 py-1 rounded-md text-xs font-medium self-start md:self-auto`}>
//               {status.label}
//             </div>
            
//             <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 md:ml-auto">
//               <Button
//                 variant="outline"
//                 className="flex-1 md:flex-none text-neutral-300 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-300"
//                 onClick={() => setShowDetails(false)}
//               >
//                 Fermer
//               </Button>
              
//               {!isPast && (
//                 <Link href="/reservation" className="flex-1 md:flex-none">
//                   <Button
//                     className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out"
//                   >
//                     <Calendar className="mr-2 h-4 w-4" />
//                     Nouvelle réservation
//                   </Button>
//                 </Link>
//               )}
//             </div>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Modale confirmation annulation */}
//       <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
//         <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
//           <DialogHeader>
//             <DialogTitle className="text-red-400">Annuler cette réservation ?</DialogTitle>
//             <DialogDescription>
//               Êtes-vous sûr de vouloir annuler votre réservation ? Cette action est irréversible.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="py-4">
//             <p className="text-white">
//               Trajet prévu le {formattedDate}
//             </p>
//             <p className="text-sm text-neutral-400 mt-1">
//               {reservation.pickup_address} → {reservation.dropoff_address}
//             </p>
//           </div>
          
//           <DialogFooter className="flex flex-col md:flex-row gap-3">
//             <Button
//               variant="outline"
//               onClick={() => setConfirmCancel(false)}
//               className="border-neutral-700 flex-1 md:flex-none"
//             >
//               Annuler
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={() => {
//                 if (onCancel) onCancel();
//                 setConfirmCancel(false);
//               }}
//               className="flex-1 md:flex-none"
//             >
//               Confirmer l'annulation
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
