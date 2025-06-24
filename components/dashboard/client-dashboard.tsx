"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, CreditCard, FileText, Wallet, Clock, CheckCircle, XCircle } from "lucide-react"
import { apiClient, type User } from "@/lib/api"
import { InvoiceManagement } from "./invoice-management"
import { CinetPayIntegration } from "../payment/cinetpay-integration"

interface Seance {
  id: number
  titre: string
  description: string
  date_heure: string
  coach: string
  capacite: number
}

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

interface Abonnement {
  id: number
  nom: string
  description: string
  prix: number
  duree_jours: number
  actif: boolean
}

interface Paiement {
  id: number
  montant: number
  date_paiement: string
  status: "EN_ATTENTE" | "PAYE" | "ECHEC"
  mode_paiement: "CINETPAY" | "ESPECE" | "SOLDE"
  abonnement?: { nom: string }
  seance?: { titre: string }
}

export function ClientDashboard({ user }: { user: User }) {
  console.log('CLIENT DASHBOARD USER:', user)
  const [seances, setSeances] = useState<Seance[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(true)
  const [rechargeAmount, setRechargeAmount] = useState("")
  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false)

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      const [seancesData, reservationsData, abonnementsData, paiementsData] = await Promise.all([
        apiClient.getSeances(),
        apiClient.getReservations(),
        apiClient.getAbonnements(),
        apiClient.getPaiements(),
      ])

      setSeances((seancesData as any).results || (seancesData as Seance[]))
      setReservations((reservationsData as any).results || (reservationsData as Reservation[]))
      setAbonnements((abonnementsData as any).results || (abonnementsData as Abonnement[]))
      setPaiements((paiementsData as any).results || (paiementsData as Paiement[]))
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReservation = async (seanceId: number) => {
    try {
      await apiClient.createReservation(seanceId)
      loadClientData()
      alert("Réservation effectuée avec succès!")
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

  const handleRecharge = async () => {
    try {
      const amount = Number.parseFloat(rechargeAmount)
      if (amount <= 0) {
        alert("Montant invalide")
        return
      }

      // Utiliser le composant CinetPayIntegration
      const response = await apiClient.rechargeCompte(amount)

      if ((response as any).cinetpay_response?.payment_url) {
        window.location.href = (response as any).cinetpay_response.payment_url
      } else {
        alert("Recharge effectuée avec succès!")
        loadClientData()
      }

      setIsRechargeDialogOpen(false)
      setRechargeAmount("")
    } catch (error) {
      console.error("Erreur lors de la recharge:", error)
      alert("Erreur lors de la recharge")
    }
  }

  const handleAbonnementPurchase = async (abonnement: Abonnement) => {
    try {
      const response = await apiClient.initPaiement({
        montant: abonnement.prix,
        abonnement: abonnement.id,
      })

      if ((response as any).cinetpay_response?.payment_url) {
        window.location.href = (response as any).cinetpay_response.payment_url
      } else {
        alert("Abonnement acheté avec succès!")
        loadClientData()
      }
    } catch (error) {
      console.error("Erreur lors de l'achat:", error)
      alert("Erreur lors de l'achat de l'abonnement")
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

  // Filtrage des données pour n'afficher que celles du client connecté
  const filteredReservations = reservations.filter(r => {
    // r.client peut être un string (email ou nom complet)
    if (typeof r.client === 'string') {
      return r.client === user.email || r.client === `${user.prenom} ${user.nom}`
    }
    return false
  })
  // Les paiements n'ont pas de champ client exploitable côté front, donc on ne filtre pas
  const filteredPaiements = paiements

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
              <p className="text-sm text-blue-100">Solde du compte</p>
              <p className="text-3xl font-bold">{user.solde?.toLocaleString() || 0} FCFA</p>
            </div>
            <Dialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Wallet className="h-4 w-4 mr-2" />
                  Recharger
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recharger votre compte</DialogTitle>
                  <DialogDescription>Ajoutez des fonds à votre compte via CinetPay</DialogDescription>
                </DialogHeader>
                <CinetPayIntegration
                  amount={Number.parseFloat(rechargeAmount) || 0}
                  type="recharge"
                  onSuccess={() => {
                    setIsRechargeDialogOpen(false)
                    setRechargeAmount("")
                    loadClientData()
                  }}
                  onError={(error) => {
                    console.error("Erreur de paiement:", error)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="seances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="seances">Séances</TabsTrigger>
          <TabsTrigger value="abonnements">Abonnements</TabsTrigger>
          <TabsTrigger value="reservations">Mes Réservations</TabsTrigger>
          <TabsTrigger value="paiements">Mes Paiements</TabsTrigger>
          <TabsTrigger value="factures">Mes Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="seances">
          <Card>
            <CardHeader>
              <CardTitle>Séances Disponibles</CardTitle>
              <CardDescription>Réservez vos séances de sport</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {seances.map((seance) => (
                  <Card key={seance.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg">{seance.titre}</CardTitle>
                      <CardDescription>{seance.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(seance.date_heure).toLocaleString("fr-FR")}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Coach: {typeof seance.coach === 'object' && seance.coach !== null ? `${(seance.coach as any).prenom} ${(seance.coach as any).nom}` : seance.coach}
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Capacité: {seance.capacite} places
                        </div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => handleReservation(seance.id)}>
                        Réserver
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abonnements">
          <Card>
            <CardHeader>
              <CardTitle>Abonnements Disponibles</CardTitle>
              <CardDescription>Choisissez l'abonnement qui vous convient</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {abonnements
                  .filter((a) => a.actif)
                  .map((abonnement) => (
                    <Card key={abonnement.id} className="border-2 hover:border-green-300 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg">{abonnement.nom}</CardTitle>
                        <CardDescription>{abonnement.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-green-600">
                            {abonnement.prix.toLocaleString()} FCFA
                          </div>
                          <div className="text-sm text-gray-600">Durée: {abonnement.duree_jours} jours</div>
                        </div>
                        <Button
                          className="w-full mt-4 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAbonnementPurchase(abonnement)}
                        >
                          Acheter
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(reservation.statut)}
                          {reservation.statut === "CONFIRMEE" && (
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paiements">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Paiements</CardTitle>
              <CardDescription>Consultez vos transactions et téléchargez vos factures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPaiements.map((paiement) => (
                  <Card key={paiement.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-semibold">
                              {paiement.abonnement?.nom || paiement.seance?.titre || "Recharge compte"}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Montant: {paiement.montant.toLocaleString()} FCFA</div>
                            <div>Date: {new Date(paiement.date_paiement).toLocaleString("fr-FR")}</div>
                            <div>Mode: {paiement.mode_paiement}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(paiement.status)}
                          {paiement.status === "PAYE" && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Facture
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredPaiements.length === 0 && <div className="text-center py-8 text-gray-500">Aucun paiement trouvé</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="factures">
          <Card>
            <CardHeader>
              <CardTitle>Mes Factures</CardTitle>
              <CardDescription>Consultez et téléchargez vos factures</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
