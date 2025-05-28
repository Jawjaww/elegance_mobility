// import { Database } from '@/lib/types/common.types'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Edit2Icon, TrashIcon } from 'lucide-react'

// type Rate = Database['public']['Tables']['rates']['Row']

// interface RateCardProps {
//   rate: Rate
//   onEdit?: (rate: Rate) => void
//   onDelete?: (rate: Rate) => void
// }

// export default function RateCard({ rate, onEdit, onDelete }: RateCardProps) {
//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat('fr-FR', {
//       style: 'currency',
//       currency: 'EUR',
//     }).format(price)
//   }

//   const getVehicleLabel = (type: string) => {
//     switch (type) {
//       case 'STANDARD':
//         return 'Berline Standard'
//       case 'LUXURY':
//         return 'Berline Luxe'
//       case 'VAN':
//         return 'Van/Minibus'
//       default:
//         return type
//     }
//   }

//   return (
//     <Card className="h-full">
//       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//         <CardTitle className="text-sm font-medium">
//           {getVehicleLabel(rate.vehicle_type)}
//         </CardTitle>
//         <Badge variant="outline" className="font-normal">
//           {rate.vehicle_type}
//         </Badge>
//       </CardHeader>
//       <CardContent>
//         <div className="grid gap-4">
//           <div className="space-y-2">
//             <p className="text-sm font-medium text-muted-foreground">
//               Prix au kilomètre
//             </p>
//             <p className="text-2xl font-bold">
//               {formatPrice(rate.price_per_km)}
//               <span className="text-sm font-normal text-muted-foreground">
//                 {' '}
//                 /km
//               </span>
//             </p>
//           </div>
//           <div className="space-y-2">
//             <p className="text-sm font-medium text-muted-foreground">
//               Prix de base
//             </p>
//             <p className="text-2xl font-bold">{formatPrice(rate.base_price)}</p>
//           </div>
//           {(onEdit || onDelete) && (
//             <div className="flex gap-2 pt-2">
//               {onEdit && (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="flex-1"
//                   onClick={() => onEdit(rate)}
//                 >
//                   <Edit2Icon className="h-4 w-4 mr-2" />
//                   Modifier
//                 </Button>
//               )}
//               {onDelete && (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="flex-1"
//                   onClick={() => onDelete(rate)}
//                 >
//                   <TrashIcon className="h-4 w-4 mr-2" />
//                   Supprimer
//                 </Button>
//               )}
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   )
// }