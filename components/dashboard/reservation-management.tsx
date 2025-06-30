"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Users, Trash2, CheckCircle, XCircle, Clock, RotateCcw, FileText } from "lucide-react"
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

  const handleViewTicket = (ticketUrl: string, reservation: ReservationType) => {
    if (!ticketUrl) return;

    // Créer une nouvelle fenêtre pour l'aperçu
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Récupérer les informations de la réservation
    const seanceInfo = reservation.seance;
    const clientName = reservation.client_nom || (typeof reservation.client === 'object' ? reservation.client.nom : 'Client');
    const seanceTitle = seanceInfo?.titre || 'Séance de sport';
    const seanceDate = seanceInfo?.date_heure ? new Date(seanceInfo.date_heure).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Date non définie';

    // Créer le contenu HTML pour l'aperçu
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket GYM ZONE</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #1a1a1a; }
          .ticket-container { max-width: 600px; margin: 0 auto; padding: 24px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { 
            width: 80px; 
            height: 80px; 
            border-radius: 50%; 
            object-fit: cover;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin: 0 auto 12px;
          }
          .title { 
            font-size: 24px; 
            font-weight: 700; 
            color: #7c3aed;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .subtitle {
            color: #6b7280;
            margin: 4px 0 0;
            font-size: 14px;
          }
          .ticket { 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            margin-bottom: 24px;
          }
          .ticket-header { 
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white; 
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .ticket-title { 
            font-size: 18px; 
            font-weight: 600; 
            margin: 0;
          }
          .ticket-body { padding: 24px; }
          .info-row { 
            display: flex; 
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #f3f4f6;
          }
          .info-row:last-child { 
            margin-bottom: 0;
            border-bottom: none;
          }
          .info-label { 
            font-weight: 500; 
            color: #6b7280;
            min-width: 120px;
          }
          .info-value { flex: 1; font-weight: 500; }
          .barcode {
            text-align: center;
            padding: 16px 0;
            margin-top: 24px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .barcode-text {
            font-family: monospace;
            letter-spacing: 4px;
            font-size: 24px;
            color: #1f2937;
            margin-top: 8px;
          }
          .print-button {
            display: block;
            width: 100%;
            padding: 12px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 24px;
            transition: background 0.2s;
          }
          .print-button:hover {
            background: #6d28d9;
          }
          @media print {
            .print-button { display: none; }
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="header">
            <img src="/lg1.jpg" alt="GYM ZONE Logo" class="logo">
            <h1 class="title">GYM ZONE</h1>
            <p class="subtitle">Votre billet d'accès</p>
          </div>
          
          <div class="ticket">
            <div class="ticket-header">
              <h2 class="ticket-title">${seanceTitle}</h2>
              <div class="ticket-badge">Billet</div>
            </div>
            <div class="ticket-body">
              <div class="info-row">
                <div class="info-label">Client</div>
                <div class="info-value">${clientName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Date & Heure</div>
                <div class="info-value">${seanceDate}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Statut</div>
                <div class="info-value"><strong style="color: #10b981;">Confirmé</strong></div>
              </div>
              
              <div class="barcode">
                <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="4" height="40" fill="#1f2937"/>
                  <rect x="18" y="15" width="3" height="30" fill="#1f2937"/>
                  <rect x="26" y="10" width="2" height="40" fill="#1f2937"/>
                  <rect x="32" y="20" width="3" height="30" fill="#1f2937"/>
                  <rect x="40" y="10" width="1" height="40" fill="#1f2937"/>
                  <rect x="46" y="15" width="3" height="35" fill="#1f2937"/>
                  <rect x="54" y="10" width="2" height="40" fill="#1f2937"/>
                  <rect x="60" y="5" width="1" height="45" fill="#1f2937"/>
                  <rect x="66" y="10" width="3" height="40" fill="#1f2937"/>
                  <rect x="74" y="20" width="2" height="30" fill="#1f2937"/>
                  <rect x="80" y="10" width="1" height="40" fill="#1f2937"/>
                  <rect x="86" y="15" width="3" height="35" fill="#1f2937"/>
                  <rect x="94" y="10" width="2" height="40" fill="#1f2937"/>
                  <rect x="100" y="5" width="1" height="45" fill="#1f2937"/>
                  <rect x="106" y="10" width="3" height="40" fill="#1f2937"/>
                  <rect x="114" y="20" width="2" height="30" fill="#1f2937"/>
                  <rect x="120" y="10" width="1" height="40" fill="#1f2937"/>
                  <rect x="126" y="15" width="3" height="35" fill="#1f2937"/>
                  <rect x="134" y="10" width="2" height="40" fill="#1f2937"/>
                  <rect x="140" y="5" width="1" height="45" fill="#1f2937"/>
                  <rect x="146" y="10" width="3" height="40" fill="#1f2937"/>
                  <rect x="154" y="20" width="2" height="30" fill="#1f2937"/>
                  <rect x="160" y="10" width="1" height="40" fill="#1f2937"/>
                  <rect x="166" y="15" width="3" height="35" fill="#1f2937"/>
                  <rect x="174" y="10" width="2" height="40" fill="#1f2937"/>
                  <rect x="180" y="20" width="3" height="30" fill="#1f2937"/>
                  <rect x="188" y="10" width="2" height="40" fill="#1f2937"/>
                </svg>
                <div class="barcode-text">GYMZ-${reservation.id.toString().padStart(6, '0')}</div>
              </div>
            </div>
          </div>
          
          <div class="footer" style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 13px;">
            <p>Merci de présenter ce billet à l'accueil</p>
            <p>GYM ZONE • contact@gymzone.com • +225 XX XX XX XX</p>
          </div>
          
          <button class="print-button" onclick="window.print()">Imprimer le billet</button>
        </div>
      </body>
      </html>
    `;

    // Écrire le contenu dans la nouvelle fenêtre
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewTicket(billet.fichier_pdf_url, reservation)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Voir le billet</span>
                          </Button>
                        </div>
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
