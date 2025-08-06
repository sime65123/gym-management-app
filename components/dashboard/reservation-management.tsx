"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, RotateCcw, FileText, Calendar, ShoppingCart, Eye } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Reservation as ReservationType } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ReservationManagement() {
  const [reservations, setReservations] = useState<ReservationType[]>([])
  const [loading, setLoading] = useState(true)
  const [validationDialog, setValidationDialog] = useState<{open: boolean, reservation: ReservationType | null}>({
    open: false,
    reservation: null
  })
  const [montant, setMontant] = useState("")
  const [validating, setValidating] = useState(false)
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  
  interface ApiResponse {
    results: ReservationType[];
    [key: string]: any;
  }

  const loadReservations = async () => {
    console.log("Début du chargement des réservations...");
    try {
      setLoading(true);
      
      console.log("Chargement des réservations...");
      const reservations = await apiClient.getReservations();
    console.log('[DEBUG] Réponse API getReservations:', reservations);
      
      // Trier les réservations par date de création (les plus récentes en premier)
      const sortedReservations = [...reservations].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      console.log("Réservations chargées et triées:", sortedReservations);
      setReservations(sortedReservations);
      
    } catch (error: unknown) {
      console.error("Erreur lors du chargement des réservations:", error);
      
      let errorMessage = "Impossible de charger les réservations";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Réinitialiser la liste des réservations en cas d'erreur
      setReservations([]);
    } finally {
      console.log("Fin du chargement des données");
      setLoading(false);
    }
  }
    
  useEffect(() => {
    loadReservations()
  }, [])

  const handleValiderReservation = async (id: number) => {
    try {
      const reservation = reservations.find(r => r.id === id)
      if (!reservation) {
      toast({
          title: "Erreur",
          description: "Réservation introuvable",
          variant: "destructive"
        })
        return
      }
      
      // Ouvrir le modal de validation avec saisie du montant
      setValidationDialog({
        open: true,
        reservation: reservation
      })
      setMontant("")
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
      toast({
        title: "Erreur",
        description: "La validation de la réservation a échoué.",
        variant: "destructive"
      })
    }
  }

  const handleConfirmValidation = async () => {
    if (!validationDialog.reservation) return
    
    try {
      setValidating(true)
      
      // Nettoyer le montant saisi (supprimer les espaces insécables et autres caractères non numériques)
      const montantNettoye = montant.replace(/\s+/g, '').replace(',', '.')
      const montantValue = parseFloat(montantNettoye)
      
      if (isNaN(montantValue) || montantValue <= 0) {
        throw new Error("Veuillez entrer un montant valide supérieur à zéro")
      }
      
      // Récupérer les détails de la réservation
      const reservation = validationDialog.reservation
      const montantTotal = reservation.montant || 0
      const montantDejaPaye = parseFloat(reservation.montant_total_paye || '0') || 0
      const resteAPayer = montantTotal - montantDejaPaye
      
      // Vérifier que le montant saisi ne dépasse pas le reste à payer uniquement pour les abonnements
      if (reservation.type_reservation === 'ABONNEMENT' && montantValue > resteAPayer) {
        const errorMessage = `Impossible de traiter ce montant. Saisissez un montant correct pour l'abonnement.`;
        toast({
          title: "Montant invalide",
          description: errorMessage,
          variant: "destructive"
        });
        setValidating(false);
        return; // On sort de la fonction sans lancer d'erreur
      }
      
      // Appeler l'API avec le montant saisi
      await apiClient.validerReservation(reservation.id, montantValue);

      // Recharger les réservations (pour mettre à jour le statut et le ticket)
      await loadReservations();

      // Fermer le dialogue et réinitialiser le formulaire
      setValidationDialog({ open: false, reservation: null });
      setMontant("");

      // Chercher la réservation validée mise à jour
      const updated = reservations.find(r => r.id === reservation.id);
      // Afficher le ticket automatiquement si disponible
      if (updated && updated.ticket_url) {
        window.open(updated.ticket_url, '_blank');
        toast({
          title: "Ticket généré",
          description: "Le ticket est disponible et a été ouvert dans un nouvel onglet."
        });
      } else if (resteAPayer > montantValue) {
        toast({
          title: "Paiement partiel enregistré",
          description: `Paiement de ${montantValue.toLocaleString('fr-FR')} FCFA enregistré. Il reste ${(resteAPayer - montantValue).toLocaleString('fr-FR')} FCFA à payer.`
        });
      } else {
        toast({
          title: "Réservation validée",
          description: `La réservation a été entièrement payée pour un montant de ${montantValue.toLocaleString('fr-FR')} FCFA.`
        });
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      let errorMessage = "La validation de la réservation a échoué.";
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setValidating(false)
    }
  }

  const handleViewTicket = (reservation: ReservationType) => {
    if (!reservation.ticket_url) {
      toast({
        title: "Ticket non disponible",
        description: "Le ticket n'est pas encore disponible pour cette réservation.",
        variant: "destructive"
      })
      return
    }

    // Ouvrir le ticket dans un nouvel onglet
    window.open(reservation.ticket_url, '_blank')
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
      case "EN_ATTENTE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            En attente
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SEANCE":
        return <Calendar className="h-4 w-4 text-blue-600" />
      case "ABONNEMENT":
        return <ShoppingCart className="h-4 w-4 text-green-600" />
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  // Filtrage des réservations selon la recherche
  const filteredReservations = reservations.filter(r =>
    r.nom_client?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="text-muted-foreground">Chargement des réservations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Réservations des Clients</CardTitle>
            <CardDescription>
              Liste de toutes les réservations effectuées par les clients
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Rechercher par nom du client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64"
            />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadReservations} 
            className="flex items-center gap-1"
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucune réservation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                      {reservation.nom_client || "Client inconnu"}
                      </TableCell>
                      <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(reservation.type_reservation)}
                        <span className="capitalize">
                          {reservation.type_reservation === 'SEANCE' ? 'Séance' : 'Abonnement'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {reservation.type_reservation === 'SEANCE' && reservation.montant === 0 
                        ? 'À définir' 
                        : reservation.type_reservation === 'ABONNEMENT' 
                          ? (
                            <div className="space-y-1">
                              <div className="text-sm">
                                Total: {reservation.montant?.toLocaleString()} FCFA
                              </div>
                              {reservation.montant_total_paye && parseFloat(reservation.montant_total_paye) > 0 && (
                                <div className="text-xs text-green-600">
                                  Payé: {parseFloat(reservation.montant_total_paye).toLocaleString()} FCFA
                                </div>
                              )}
                              {reservation.montant_total_paye && parseFloat(reservation.montant_total_paye) > 0 && 
                               parseFloat(reservation.montant_total_paye) < (reservation.montant || 0) && (
                                <div className="text-xs text-orange-600">
                                  Reste: {((reservation.montant || 0) - parseFloat(reservation.montant_total_paye)).toLocaleString()} FCFA
                                </div>
                              )}
                            </div>
                          )
                          : `${reservation.montant?.toLocaleString()} FCFA`}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {reservation.description || "Aucune description"}
                      </TableCell>
                      <TableCell>
                      {reservation.created_at ? formatDate(reservation.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reservation.statut)}
                      </TableCell>
                      <TableCell>
                      {reservation.ticket_url ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                          onClick={() => handleViewTicket(reservation)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                          <span>Voir le ticket</span>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non disponible</span>
                        )}
                      </TableCell>
                      <TableCell>
                      <div className="flex items-center gap-2">
                        {reservation.statut === "EN_ATTENTE" ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleValiderReservation(reservation.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {reservation.statut === "CONFIRMEE" ? "Déjà validée" : "-"}
                          </span>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewTicket(reservation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {reservations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune réservation trouvée</p>
              <p className="text-sm text-gray-400 mt-2">
                Les réservations effectuées par les clients apparaîtront ici
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{reservations.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reservations.filter(r => r.statut === 'EN_ATTENTE').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmées</p>
                <p className="text-2xl font-bold text-green-600">
                  {reservations.filter(r => r.statut === 'CONFIRMEE').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Montant total validé</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const confirmedReservations = reservations.filter(r => r.statut === 'CONFIRMEE');
                    const totalAmount = confirmedReservations.reduce((sum, r) => {
                      // Convertir le montant en nombre
                      const montant = typeof r.montant === 'string' ? parseFloat(r.montant) : (r.montant || 0);
                      return sum + montant;
                    }, 0);
                    
                    console.log('[DEBUG] Réservations confirmées:', confirmedReservations);
                    console.log('[DEBUG] Montants individuels:', confirmedReservations.map(r => ({ 
                      id: r.id, 
                      montant: r.montant, 
                      type: typeof r.montant,
                      converted: typeof r.montant === 'string' ? parseFloat(r.montant) : r.montant
                    })));
                    console.log('[DEBUG] Montant total calculé:', totalAmount);
                    
                    return totalAmount.toLocaleString();
                  })()} FCFA
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
      </Card>
      </div>

      {/* Modal de validation avec saisie du montant */}
      <Dialog open={validationDialog.open} onOpenChange={(open) => setValidationDialog({ open, reservation: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider la réservation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Réservation #{validationDialog.reservation?.id}</h4>
              <p className="text-sm text-blue-700">
                Client: {validationDialog.reservation?.nom_client}
              </p>
              <p className="text-sm text-blue-700">
                Type: {validationDialog.reservation?.type_reservation === 'SEANCE' ? 'Séance' : 'Abonnement'}
              </p>
              <p className="text-sm text-blue-700">
                Description: {validationDialog.reservation?.description || 'Aucune description'}
              </p>
              {validationDialog.reservation?.type_reservation === 'ABONNEMENT' && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Montant total:</span> {validationDialog.reservation.montant?.toLocaleString()} FCFA
                  </p>
                  {validationDialog.reservation.montant_total_paye && parseFloat(validationDialog.reservation.montant_total_paye) > 0 && (
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Déjà payé:</span> {parseFloat(validationDialog.reservation.montant_total_paye).toLocaleString()} FCFA
                    </p>
                  )}
                  {validationDialog.reservation.montant_total_paye && parseFloat(validationDialog.reservation.montant_total_paye) > 0 && 
                   parseFloat(validationDialog.reservation.montant_total_paye) < (validationDialog.reservation.montant || 0) && (
                    <p className="text-sm text-orange-700">
                      <span className="font-medium">Reste à payer:</span> {((validationDialog.reservation.montant || 0) - parseFloat(validationDialog.reservation.montant_total_paye)).toLocaleString()} FCFA
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="montant">
                {validationDialog.reservation?.type_reservation === 'ABONNEMENT' 
                  ? 'Montant du paiement (FCFA)' 
                  : 'Montant à facturer (FCFA)'}
              </Label>
              <Input
                id="montant"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={montant}
                onChange={(e) => {
                  // N'autoriser que les chiffres
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setMontant(value);
                }}
                onBlur={(e) => {
                  // Formater le nombre avec des espaces de milliers au blur
                  const value = e.target.value.replace(/\s+/g, '');
                  if (value) {
                    setMontant(parseInt(value, 10).toLocaleString('fr-FR'));
                  }
                }}
                placeholder={validationDialog.reservation?.type_reservation === 'ABONNEMENT' ? "Ex: 2 500" : "Ex: 5 000"}
              />
              {validationDialog.reservation?.type_reservation === 'ABONNEMENT' && (
                <p className="text-xs text-gray-500 mt-1">
                  Vous pouvez saisir un montant partiel. La réservation sera confirmée uniquement quand le montant total sera payé.
                </p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setValidationDialog({ open: false, reservation: null })}
                className="flex-1"
                disabled={validating}
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmValidation}
                disabled={validating || !montant || parseFloat(montant) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {validating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Validation...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Valider et facturer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
