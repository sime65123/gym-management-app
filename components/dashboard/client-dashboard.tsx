"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CreditCard, FileText, Clock, CheckCircle, XCircle, Download, Ticket, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    description: "",
    montant: "",
    type_ticket: "SEANCE", // Valeur par défaut
    // Suppression de la dépendance entre montant et nombre_heures
  })

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      console.log('Chargement des données client...')
      setLoading(true);
      
      const [reservationsData, abonnementsData, paiementsData, ticketsData] = await Promise.all([
        apiClient.getReservations(),
        apiClient.getAbonnements(),
        apiClient.getPaiements(),
        apiClient.getTickets().catch(error => {
          console.error('Erreur lors du chargement des tickets:', error);
          return [];
        }),
      ])

      console.log('Données brutes reçues:', {
        reservationsData,
        abonnementsData,
        paiementsData,
        ticketsData
      })

      const reservations = (reservationsData as any)?.results || (reservationsData as ReservationType[]) || [];
      const tickets = (ticketsData as any)?.results || (ticketsData as Ticket[]) || [];
      
      console.log('Réservations chargées:', reservations);
      console.log('Tickets chargés:', tickets);
      console.log('Nombre de tickets chargés:', tickets.length);

      setReservations(reservations);
      setAbonnements((abonnementsData as any)?.results || (abonnementsData as Abonnement[]) || []);
      setPaiements((paiementsData as any)?.results || (paiementsData as Paiement[]) || []);
      setTickets(tickets);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReservation = async () => {
    try {
      console.log('Tentative de création de réservation avec les données:', reservationForm);
      
      // Vérifier que le montant est un nombre valide
      const montant = parseFloat(reservationForm.montant);
      if (isNaN(montant) || montant <= 0) {
        alert("Veuillez entrer un montant valide supérieur à 0");
        return;
      }

      // Vérifier que la date et l'heure sont renseignées
      if (!reservationForm.date_heure_souhaitee) {
        alert("Veuillez sélectionner une date et une heure pour la séance");
        return;
      }

      // Vérifier que le nombre d'heures est valide
      if (reservationForm.nombre_heures <= 0) {
        alert("Le nombre d'heures doit être supérieur à 0");
        return;
      }

      // Créer la réservation avec le montant
      const nouvelleReservation = {
        date_heure_souhaitee: reservationForm.date_heure_souhaitee,
        nombre_heures: reservationForm.nombre_heures,
        description: reservationForm.description || "",
        montant: montant,
        type_ticket: reservationForm.type_ticket,
        statut: 'EN_ATTENTE'
      };
      
      console.log('Envoi de la requête de création de réservation:', nouvelleReservation);
      
      try {
        const reponse = await apiClient.createReservation(nouvelleReservation);
        console.log('Réponse de l\'API (création réservation):', reponse);
        
        setIsReservationDialogOpen(false);
        setReservationForm({ 
          date_heure_souhaitee: "", 
          nombre_heures: 1, 
          description: "",
          montant: "",
          type_ticket: "SEANCE"
        });
        
        // Forcer un rechargement complet des données
        console.log('Rechargement des données après création de réservation...');
        await loadClientData();
        
        alert("Réservation effectuée avec succès! Vous pouvez télécharger votre ticket et vous rendre à la salle pour payer.");
      } catch (apiError) {
        console.error("Erreur API lors de la création de la réservation:", apiError);
        throw apiError; // Renvoyer l'erreur pour qu'elle soit capturée par le bloc catch externe
      }
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
      alert(`Erreur lors de la réservation: ${errorMessage}`);
    }
  }

  const handleReservation = async (seanceId: number, montant: number) => {
    try {
      // Vérifier que le montant est un nombre valide
      if (isNaN(montant) || montant <= 0) {
        alert("Veuillez entrer un montant valide");
        return;
      }

      // Créer la réservation avec le montant
      await apiClient.createReservation({
        seance_id: seanceId,
        montant: montant,
        type_ticket: "SEANCE"
      });
      
      loadClientData();
      alert("Réservation effectuée avec succès! Veuillez vous rendre à la salle pour payer et confirmer votre réservation.");
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      alert("Erreur lors de la réservation: " + (error as Error).message);
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

  const handleDeleteTicket = async (ticketId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.")) {
      try {
        await apiClient.deleteTicket(ticketId);
        setTickets(tickets.filter(t => t.id !== ticketId));
        alert("Ticket supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression du ticket:", error);
        alert("Erreur lors de la suppression du ticket");
      }
    }
  };

  const handleViewTicket = (ticket: any, reservation: any = null) => {
    // Créer une nouvelle fenêtre pour l'aperçu
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Récupérer les informations de la réservation ou du ticket
    const clientName = user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : 'Client';
    const seanceTitle = reservation?.seance?.titre || ticket.seance?.titre || 'Séance de sport';
    
    // Date et heure d'enregistrement du ticket
    const ticketDate = new Date(ticket.date_creation || ticket.date_generation || new Date());
    const formattedTicketDate = ticketDate.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Date de la séance (si disponible)
    const seanceDate = reservation?.seance?.date_heure || ticket.seance?.date_heure;
    const formattedSeanceDate = seanceDate ? new Date(seanceDate).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Non définie';
    
    // Statut de confirmation
    const isConfirmed = ticket.statut === 'CONFIRME' || ticket.statut === 'VALIDE';
    
    // Log pour déboguer la structure des données
    console.log('Ticket data:', {
      ticket,
      reservation,
      type: ticket.type_ticket,
      montantTicket: ticket.montant,
      montantPaiement: ticket.paiement?.montant,
      montantReservation: reservation?.montant,
      prixSeance: ticket.seance?.prix || reservation?.seance?.prix,
      prixAbonnement: ticket.abonnement?.prix || reservation?.abonnement?.prix
    });

    // Montant à payer (depuis la réservation ou l'abonnement)
    let montantAPayer = 0;
    
    // Essayer de récupérer le montant dans l'ordre de priorité
    if (reservation?.montant) {
      montantAPayer = reservation.montant;
    } else if (ticket.paiement?.montant) {
      montantAPayer = ticket.paiement.montant;
    } else if (ticket.montant) {
      montantAPayer = ticket.montant;
    } else if (ticket.type_ticket === 'SEANCE') {
      montantAPayer = reservation?.seance?.prix || ticket.seance?.prix || 0;
    } else {
      // Pour les abonnements
      montantAPayer = reservation?.abonnement?.prix || ticket.abonnement?.prix || 0;
    }
    
    console.log('Montant final calculé:', montantAPayer);

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
          .info-grid { 
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .info-item { 
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          
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
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Client</div>
                  <div class="info-value">${clientName}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Type</div>
                  <div class="info-value">
                    ${ticket.type_ticket === 'ABONNEMENT' ? 'Abonnement' : 'Séance'}
                    ${ticket.type_ticket === 'ABONNEMENT' && ticket.abonnement?.nom ? 
                      `<div class="text-sm text-gray-600">${ticket.abonnement.nom}</div>` : ''}
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Date d'enregistrement</div>
                  <div class="info-value">${formattedTicketDate}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Date de la séance</div>
                  <div class="info-value">${formattedSeanceDate}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Statut</div>
                  <div class="info-value">
                    <span style="color: ${isConfirmed ? '#10b981' : '#ef4444'}; font-weight: 500;">
                      ${isConfirmed ? '✅ Confirmé' : '❌ Non confirmé'}
                    </span>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Montant</div>
                  <div class="info-value">
                    <div style="color: #ef4444; font-weight: 600; font-size: 1.2em;">
                      ${montantAPayer.toLocaleString('fr-FR')} FCFA
                    </div>
                    ${ticket.type_ticket === 'ABONNEMENT' && ticket.abonnement?.duree_jours ? 
                      `<div class="text-sm text-gray-600">Pour ${ticket.abonnement.duree_jours} jours</div>` : ''}
                  </div>
                </div>
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
                <div class="barcode-text">GYMZ-${ticket.id.toString().padStart(6, '0')}</div>
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

  const handleDownloadTicket = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      handleViewTicket(ticket);
    } else {
      console.error('Ticket non trouvé');
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
                  <Label htmlFor="montant">Montant (FCFA) *</Label>
                  <Input
                    id="montant"
                    type="number"
                    min="1"
                    value={reservationForm.montant}
                    onChange={(e) =>
                      setReservationForm({
                        ...reservationForm,
                        montant: e.target.value,
                      })
                    }
                    placeholder="Entrez le montant total"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Montant total pour la réservation</p>
                </div>
                <div>
                  <Label htmlFor="nombre_heures">Durée (en heures) *</Label>
                  <Input
                    id="nombre_heures"
                    type="number"
                    min="1"
                    value={reservationForm.nombre_heures}
                    onChange={(e) => {
                      const heures = parseInt(e.target.value) || 1;
                      setReservationForm({
                        ...reservationForm,
                        nombre_heures: heures > 0 ? heures : 1,
                      });
                    }}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Durée de la séance en heures</p>
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const ticket = {
                                  id: reservation.id,
                                  type_ticket: 'SEANCE',
                                  statut: 'VALIDE',
                                  seance: reservation.seance,
                                  fichier_pdf_url: reservation.ticket_pdf_url
                                };
                                handleViewTicket(ticket, reservation);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Voir le Ticket
                            </Button>
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const ticket = {
                                    id: abonnement.id,
                                    type_ticket: 'ABONNEMENT',
                                    statut: 'VALIDE',
                                    seance: { titre: abonnement.nom },
                                    fichier_pdf_url: abonnement.ticket_pdf_url
                                  };
                                  handleViewTicket(ticket);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Voir le Ticket
                              </Button>
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
                {loading ? (
                  <div className="text-center py-8">Chargement des tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Aucun ticket disponible</div>
                ) : (
                  tickets.map((ticket) => (
                    <Card key={ticket.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Ticket className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">
                                {ticket.type_ticket === 'SEANCE' ? 'Séance' : 'Abonnement'} - {ticket.uuid.slice(0, 8)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Type: {ticket.type_ticket}</div>
                              <div>Montant: {ticket.paiement?.montant ? `${ticket.paiement.montant.toLocaleString()} FCFA` : 'Non disponible'}</div>
                              <div>Date: {new Date(ticket.date_generation).toLocaleString("fr-FR")}</div>
                              <div>Mode: {ticket.paiement?.mode_paiement || 'Non spécifié'}</div>
                              <div>Statut: {
                                ticket.paiement?.status === 'PAYE' ? 
                                  <Badge className="bg-green-100 text-green-800 ml-1">Payé</Badge> : 
                                  <Badge className="bg-yellow-100 text-yellow-800 ml-1">Non payé</Badge>
                              }</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {ticket.paiement?.status === "EN_ATTENTE" && ticket.fichier_pdf_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewTicket(ticket)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Voir le Ticket
                              </Button>
                            )}
                            <div className="flex flex-col gap-2">
                              {ticket.paiement?.status === "PAYE" && ticket.fichier_pdf_url && (
                                <a href={ticket.fichier_pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="w-full">
                                    <Download className="h-4 w-4 mr-1" />
                                    Télécharger la Facture
                                  </Button>
                                </a>
                              )}
                              {ticket.paiement?.status !== "PAYE" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteTicket(ticket.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Supprimer le ticket
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
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
