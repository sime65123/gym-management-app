"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CreditCard, FileText, Clock, CheckCircle, XCircle, Download, Ticket, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { apiClient, type User, type Ticket, Reservation as ReservationType } from "@/lib/api"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Abonnement {
  id: number
  nom: string
  description: string
  prix: number
  duree_jours: number
  actif: boolean
  ticket_pdf_url?: string
  facture_pdf_url?: string
}

interface Paiement {
  id: number
  montant: number
  date_paiement: string
  status: "EN_ATTENTE" | "PAYE" | "ECHEC"
  mode_paiement: "ESPECE" | "CARTE" | "CHEQUE"
  abonnement?: { nom: string }
  seance?: { titre: string }
}

export function ClientDashboard({ user }: { user: User }) {
  console.log('CLIENT DASHBOARD USER:', user)
  const [reservations, setReservations] = useState<ReservationType[]>([])
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [reservationForm, setReservationForm] = useState({
    date_heure_souhaitee: "",
    nombre_heures: 1,
    description: ""
  })

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      const [reservationsData, abonnementsData, paiementsData, ticketsData] = await Promise.all([
        apiClient.getReservations(),
        apiClient.getAbonnements(),
        apiClient.getPaiements(),
        apiClient.getTickets(),
      ])

      setReservations((reservationsData as any).results || (reservationsData as ReservationType[]))
      setAbonnements((abonnementsData as any).results || (abonnementsData as Abonnement[]))
      setPaiements((paiementsData as any).results || (paiementsData as Paiement[]))
      setTickets((ticketsData as any).results || (ticketsData as Ticket[]))
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReservation = async () => {
    try {
      await apiClient.createReservation(reservationForm)
      setIsReservationDialogOpen(false)
      setReservationForm({ date_heure_souhaitee: "", nombre_heures: 1, description: "" })
      loadClientData()
      alert("Réservation effectuée avec succès! Vous pouvez télécharger votre ticket et vous rendre à la salle pour payer.")
    } catch (error) {
      console.error("Erreur lors de la réservation:", error)
      alert("Erreur lors de la réservation")
    }
  }

  const handleReservation = async (seanceId: number) => {
    try {
      await apiClient.createReservation(seanceId)
      loadClientData()
      alert("Réservation effectuée avec succès! Veuillez vous rendre à la salle pour payer et confirmer votre réservation.")
    } catch (error) {
      console.error("Erreur lors de la réservation:", error)
      alert("Erreur lors de la réservation")
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      try {
        await apiClient.deleteReservation(reservationId)
        loadClientData()
      } catch (error) {
        console.error("Erreur lors de l'annulation:", error)
      }
    }
  }

  const handleDownloadTicket = async (ticketId: number) => {
    try {
      await apiClient.downloadTicketPDF(ticketId)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      alert("Erreur lors du téléchargement du ticket")
    }
  }

  const handleReserverAbonnement = async (abonnementId: number) => {
    try {
      await apiClient.createAbonnementReservation(abonnementId)
      loadClientData()
      alert("Réservation d'abonnement effectuée avec succès! Vous pouvez télécharger votre ticket et vous rendre à la salle pour payer.")
    } catch (error) {
      console.error("Erreur lors de la réservation d'abonnement:", error)
      alert("Erreur lors de la réservation d'abonnement")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMEE":
      case "PAYE":
        return <Badge className="bg-green-100 text-green-800">Confirmé</Badge>
      case "ANNULEE":
      case "ECHEC":
        return <Badge className="bg-red-100 text-red-800">Annulé</Badge>
      case "EN_ATTENTE":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  // Filtrage des données pour n'afficher que les réservations payées du client connecté
  const filteredReservations = reservations.filter(r => {
    // Vérifier si la réservation appartient au client connecté
    const isClientReservation = typeof r.client === 'string' 
      ? (r.client === user.email || r.client === `${user.prenom} ${user.nom}`)
      : (r.client?.id === user.id || r.client_id === user.id);
    
    // Ne retourner que les réservations payées et confirmées
    return isClientReservation && r.statut === 'CONFIRMEE' && r.paye === true;
  })
  // Les paiements n'ont pas de champ client exploitable côté front, donc on ne filtre pas
  const filteredPaiements = paiements
  const filteredTickets = tickets

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">
            Bienvenue, {user.prenom} {user.nom}!
          </CardTitle>
          <CardDescription className="text-blue-100">Gérez vos réservations et abonnements facilement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Votre espace client</p>
              <p className="text-lg font-bold">Réservations et tickets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="reserver" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reserver">Réserver une séance</TabsTrigger>
          <TabsTrigger value="abonnements">Abonnements</TabsTrigger>
          <TabsTrigger value="reservations">Mes Réservations</TabsTrigger>
          <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="reserver">
          <Card>
            <CardHeader>
              <CardTitle>Réserver une séance</CardTitle>
              <CardDescription>Programmez votre séance de sport</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date_heure">Date et heure souhaitées</Label>
                  <Input
                    id="date_heure"
                    type="datetime-local"
                    value={reservationForm.date_heure_souhaitee}
                    onChange={(e) => setReservationForm({ ...reservationForm, date_heure_souhaitee: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="nombre_heures">Nombre d'heures</Label>
                  <Input
                    id="nombre_heures"
                    type="number"
                    min="1"
                    max="8"
                    value={reservationForm.nombre_heures}
                    onChange={(e) => setReservationForm({ ...reservationForm, nombre_heures: Number(e.target.value) })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tarif : {reservationForm.nombre_heures * 5000} FCFA ({reservationForm.nombre_heures} heure(s) × 5000 FCFA)
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description/Commentaire (optionnel)</Label>
                  <Textarea
                    id="description"
                    value={reservationForm.description}
                    onChange={(e) => setReservationForm({ ...reservationForm, description: e.target.value })}
                    placeholder="Précisez vos besoins ou commentaires..."
                  />
                </div>
                <Button 
                  onClick={handleCreateReservation}
                  disabled={!reservationForm.date_heure_souhaitee || reservationForm.nombre_heures < 1}
                  className="w-full"
                >
                  Réserver ma séance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abonnements">
          <Card>
            <CardHeader>
              <CardTitle>Abonnements Disponibles</CardTitle>
              <CardDescription>Réservez votre abonnement de sport</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {abonnements.map((abonnement) => (
                  <Card key={abonnement.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg">{abonnement.nom}</CardTitle>
                      <CardDescription>{abonnement.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Prix :</span>
                          <span className="font-bold text-green-600">{abonnement.prix} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Durée :</span>
                          <span>{abonnement.duree_jours} jours</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => handleReserverAbonnement(abonnement.id)}
                      >
                        Réserver cet abonnement
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>Mes Réservations</CardTitle>
              <CardDescription>Consultez et gérez vos réservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Réservations de séances */}
                {filteredReservations.map((reservation) => (
                  <Card key={reservation.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{reservation.seance.titre}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(reservation.seance.date_heure).toLocaleString("fr-FR")}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Coach: {typeof reservation.seance.coach === 'object' && reservation.seance.coach !== null ? `${(reservation.seance.coach as any).prenom} ${(reservation.seance.coach as any).nom}` : reservation.seance.coach}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              Réservé le: {new Date(reservation.date_reservation).toLocaleDateString("fr-FR")}
                            </div>
                            <div className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Paiement: {reservation.paye ? "Payé" : "En attente"}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(reservation.statut)}
                          {reservation.statut === "EN_ATTENTE" && !reservation.paye && reservation.ticket_pdf_url && (
                            <a href={reservation.ticket_pdf_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Télécharger le Ticket
                              </Button>
                            </a>
                          )}
                          {reservation.statut === "CONFIRMEE" && reservation.paye && reservation.facture_pdf_url && (
                            <a href={reservation.facture_pdf_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Télécharger la Facture
                              </Button>
                            </a>
                          )}
                          {reservation.statut === "EN_ATTENTE" && !reservation.paye && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelReservation(reservation.id)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredReservations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Aucune réservation trouvée</div>
                )}

                {/* Abonnements réservés */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-2">Mes Abonnements</h3>
                  <div className="space-y-4">
                    {abonnements.length === 0 && (
                      <div className="text-center py-4 text-gray-500">Aucun abonnement réservé</div>
                    )}
                    {abonnements.map((abonnement) => (
                      <Card key={abonnement.id} className="border bg-blue-50">
                        <CardContent className="pt-4 pb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-blue-900">{abonnement.nom}</div>
                            <div className="text-sm text-gray-700">{abonnement.description}</div>
                            <div className="text-xs text-gray-500 mt-1">Durée : {abonnement.duree_jours} jours</div>
                            {/* Si date de début/fin disponible, les afficher ici */}
                          </div>
                          <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
                            <Badge className={abonnement.actif ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}>
                              {abonnement.actif ? "Actif" : "Inactif"}
                            </Badge>
                            {abonnement.ticket_pdf_url && !abonnement.actif && (
                              <a href={abonnement.ticket_pdf_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-1" />
                                  Télécharger le Ticket
                                </Button>
                              </a>
                            )}
                            {abonnement.facture_pdf_url && abonnement.actif && (
                              <a href={abonnement.facture_pdf_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-1" />
                                  Télécharger la Facture
                                </Button>
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Mes Tickets</CardTitle>
              <CardDescription>Consultez et téléchargez vos tickets de paiement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedTicket(ticket);
                                setShowTicketDialog(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Voir le ticket"
                            >
                              <Ticket className="h-5 w-5" />
                            </button>
                            <span className="font-semibold">
                              {ticket.type_ticket === 'SEANCE' ? 'Séance' : 'Abonnement'} - {ticket.uuid.slice(0, 8)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Type: {ticket.type_ticket}</div>
                            <div>Montant: {ticket.paiement?.montant ? `${ticket.paiement.montant.toLocaleString()} FCFA` : 'Non disponible'}</div>
                            <div>Date: {new Date(ticket.date_generation).toLocaleString("fr-FR")}</div>
                            <div>Mode: {ticket.paiement?.mode_paiement || 'Non spécifié'}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {ticket.paiement.status === "EN_ATTENTE" && ticket.fichier_pdf_url && (
                            <a href={ticket.fichier_pdf_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Télécharger le Ticket
                              </Button>
                            </a>
                          )}
                          {ticket.paiement.status === "PAYE" && ticket.fichier_pdf_url && (
                            <a href={ticket.fichier_pdf_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Télécharger la Facture
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Aucun ticket ou facture disponible</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogue d'affichage du ticket */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl mb-4">
              {selectedTicket?.type_ticket === 'SEANCE' ? 'Ticket de Séance' : 'Ticket d\'Abonnement'}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-blue-800">GYM TYPHOON</h2>
                  <p className="text-sm text-gray-600">123 Rue du Sport, Ville</p>
                  <p className="text-sm text-gray-600">Tél: +123 456 789</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Ticket #{selectedTicket.uuid.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTicket.date_generation).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 my-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Type</h3>
                  <span>{selectedTicket.type_ticket === 'SEANCE' ? 'Séance' : 'Abonnement'}</span>
                </div>
                {selectedTicket.paiement?.montant && (
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Montant</h3>
                    <span>{selectedTicket.paiement.montant.toLocaleString()} FCFA</span>
                  </div>
                )}
                {selectedTicket.paiement?.mode_paiement && (
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Mode de paiement</h3>
                    <span>
                      {selectedTicket.paiement.mode_paiement === 'ESPECE' ? 'Espèces' : 
                       selectedTicket.paiement.mode_paiement === 'CARTE' ? 'Carte bancaire' : 
                       'Chèque'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Client</h3>
                  <span>{user?.prenom} {user?.nom}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Téléphone</h3>
                  <span>{user?.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Statut</h3>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Non payé
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mt-6">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800">
                    Veuillez vous présenter à l'accueil avec ce ticket pour effectuer le paiement et valider votre réservation.
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                <p>Merci de votre confiance !</p>
                <p className="mt-1">© {new Date().getFullYear()} GYM TYPHOON - Tous droits réservés</p>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between mt-6">
            <Button 
              variant="outline"
              onClick={() => {
                if (selectedTicket?.fichier_pdf_url) {
                  window.open(selectedTicket.fichier_pdf_url, '_blank');
                }
              }}
              disabled={!selectedTicket?.fichier_pdf_url}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le PDF
            </Button>
            <Button 
              onClick={() => setShowTicketDialog(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
