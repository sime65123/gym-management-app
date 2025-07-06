import { MesReservations } from "@/components/reservations/mes-reservations"

export default function MesReservationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mes réservations</h1>
      <MesReservations />
    </div>
  )
}
