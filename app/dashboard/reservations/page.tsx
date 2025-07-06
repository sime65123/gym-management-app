import { ReservationManagement } from "@/components/dashboard/reservation-management"

export default function GestionReservationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des réservations</h1>
      <ReservationManagement />
    </div>
  )
}
