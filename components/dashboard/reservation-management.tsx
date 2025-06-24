"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Users, Trash2, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Reservation {
  id: number
  client: string
  seance: {
    id: number
    titre: string
    date_heure: string
    coach: string
  }
  date_reservation: string
  statut: "CONFIRMEE" | "ANNULEE"
}

export function ReservationManagement() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const response = await apiClient.getReservations()
      console.log("API reservations", response)
      setReservations([...(response.results || response)])
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: "CONFIRMEE" | "ANNULEE") => {
    try {
      await apiClient.updateReservation(id, { statut: newStatus })
      loadReservations()
      toast({
        title: newStatus === "CONFIRMEE" ? "Réservation confirmée" : "Réservation annulée",
        description: newStatus === "CONFIRMEE" ? "La réservation a été confirmée." : "La réservation a été annulée.",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "La mise à jour a échoué.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDeleteReservation = async (id: number) => {
    try {
      await apiClient.deleteReservation(id)
      setReservations(prev => {
        const newList = prev.filter(r => r.id !== id)
        console.log('Liste réservations après suppression:', newList)
        return newList
      })
      toast({
        title: "Suppression réussie",
        description: "La réservation a été supprimée.",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "La suppression a échoué.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMEE":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmée
          </Badge>
        )
      case "ANNULEE":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        )
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    if (filterStatus === "all") return true
    return reservation.statut === filterStatus
  })

  const getReservationStats = () => {
    const total = reservations.length
    const confirmed = reservations.filter((r) => r.statut === "CONFIRMEE").length
    const cancelled = reservations.filter((r) => r.statut === "ANNULEE").length
    const today = new Date().toISOString().split("T")[0]
    const todayReservations = reservations.filter(
      (r) => new Date(r.seance.date_heure).toISOString().split("T")[0] === today,
    ).length

    return { total, confirmed, cancelled, todayReservations }
  }

  const stats = getReservationStats()

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Réservations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annulées</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.todayReservations}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des Réservations</CardTitle>
              <CardDescription>Consultez et gérez toutes les réservations</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les réservations</SelectItem>
                  <SelectItem value="CONFIRMEE">Confirmées</SelectItem>
                  <SelectItem value="ANNULEE">Annulées</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadReservations} title="Actualiser la liste">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Séance</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Réservé le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">{reservation.client}</TableCell>
                  <TableCell>{reservation.seance.titre}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(reservation.seance.date_heure).toLocaleString("fr-FR")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      {reservation.seance.coach}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(reservation.date_reservation).toLocaleDateString("fr-FR")}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(reservation.statut)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {reservation.statut === "CONFIRMEE" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(reservation.id, "ANNULEE")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(reservation.id, "CONFIRMEE")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmer
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <ConfirmDeleteButton onDelete={() => handleDeleteReservation(reservation.id)}>
                          <span className="flex items-center"><Trash2 className="h-4 w-4" /></span>
                        </ConfirmDeleteButton>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReservations.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucune réservation trouvée</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
