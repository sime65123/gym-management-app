"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Users, Trash2, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"
import { Reservation as ReservationType, Ticket } from "@/lib/api"

export function ReservationManagement() {
  const [reservations, setReservations] = useState<ReservationType[]>([])
  const [ticketsByReservation, setTicketsByReservation] = useState<Record<number, Ticket[]>>({})
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()
  const [abonnements, setAbonnements] = useState<any[]>([])
  const abonnementsLoaded = useRef(false)

  useEffect(() => {
    loadReservations()
    if (!abonnementsLoaded.current) {
      loadAbonnements()
      abonnementsLoaded.current = true
    }
  }, [])

  const loadReservations = async () => {
    try {
      const response = await apiClient.getReservations()
      const reservations = [...(response.results || response)]
      setReservations(reservations)
      // Récupérer les tickets pour chaque réservation
      const ticketsMap: Record<number, Ticket[]> = {}
      for (const reservation of reservations) {
        ticketsMap[reservation.id] = await apiClient.getTicketsByReservation(reservation.id)
      }
      setTicketsByReservation(ticketsMap)
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAbonnements = async () => {
    try {
      const response = await apiClient.getAbonnements()
      setAbonnements([...(response.results || response)])
    } catch (error) {
      console.error("Erreur lors du chargement des abonnements:", error)
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

  const handleValiderReservation = async (id: number) => {
    try {
      await apiClient.validerReservation(id)
      loadReservations()
      toast({
        title: "Réservation validée",
        description: "La réservation a été validée et la facture générée.",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "La validation a échoué.",
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
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Billet</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => {
                const tickets = ticketsByReservation[reservation.id] || []
                const billet = tickets.find(t => t.type_ticket === "SEANCE")
                const facture = tickets.find(t => t.type_ticket === "SEANCE" && t.paiement.status === "PAYE")
                return (
                  <TableRow key={reservation.id}>
                    <TableCell>{reservation.client_nom || (typeof reservation.client === "object" ? reservation.client.nom : "-")}</TableCell>
                    <TableCell>{reservation.seance && reservation.seance.titre}</TableCell>
                    <TableCell>{reservation.seance && reservation.seance.date_heure ? new Date(reservation.seance.date_heure).toLocaleString("fr-FR") : "-"}</TableCell>
                    <TableCell>{getStatusBadge(reservation.statut)}</TableCell>
                    <TableCell>
                      {billet && billet.fichier_pdf_url ? (
                        <a href={billet.fichier_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Télécharger</a>
                      ) : (
                        <span className="text-gray-400">Aucun</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {facture && facture.fichier_pdf_url ? (
                        <a href={facture.fichier_pdf_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">Télécharger</a>
                      ) : (
                        <span className="text-gray-400">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {reservation.statut === "EN_ATTENTE" && (
                        <Button size="sm" variant="success" onClick={() => handleValiderReservation(reservation.id)}>
                          Valider
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredReservations.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucune réservation trouvée</div>
          )}
        </CardContent>
      </Card>

      {/* Abonnements réservés (tous clients) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Réservations d'Abonnements</CardTitle>
          <CardDescription>Liste de tous les abonnements réservés par les clients</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abonnements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Aucun abonnement réservé</TableCell>
                </TableRow>
              ) : (
                abonnements.map((abonnement) => (
                  <TableRow key={abonnement.id}>
                    <TableCell>{abonnement.client_nom || abonnement.client?.nom || "-"}</TableCell>
                    <TableCell>{abonnement.nom}</TableCell>
                    <TableCell>{abonnement.description}</TableCell>
                    <TableCell>{abonnement.duree_jours} jours</TableCell>
                    <TableCell>
                      <Badge className={abonnement.actif ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}>
                        {abonnement.actif ? "Actif" : "Expiré"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
