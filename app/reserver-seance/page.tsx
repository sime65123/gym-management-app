import { ReservationForm } from "@/components/reservation/reservation-form"

export default function ReserverSeancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Réserver une séance</h1>
      <ReservationForm />
    </div>
  )
}
