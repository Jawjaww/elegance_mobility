// import { supabase } from './supabaseClient'

// export interface Reservation {
//   client_name: string
//   client_email: string
//   client_phone?: string
//   pickup_date: string
//   pickup_time: string
//   pickup_address: string
//   dropoff_address: string
//   vehicle_type: string
//   special_requests?: string
// }

// export const createReservation = async (reservation: Reservation) => {
//   const { data, error } = await supabase
//     .from('reservations')
//     .insert([reservation])
//     .select()

//   if (error) {
//     console.error('Error creating reservation:', error)
//     throw new Error('Failed to create reservation')
//   }

//   return data
// }

// export const getReservations = async () => {
//   const { data, error } = await supabase
//     .from('reservations')
//     .select('*')
//     .order('created_at', { ascending: false })

//   if (error) {
//     console.error('Error fetching reservations:', error)
//     throw new Error('Failed to fetch reservations')
//   }

//   return data
// }