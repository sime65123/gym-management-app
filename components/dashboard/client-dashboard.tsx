import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Home, Calendar, Ticket, FileText, User, Clock, DollarSign, CheckCircle, XCircle, Clock4, CalendarPlus, Dumbbell, ShoppingCart, RotateCcw, Users, MapPin, Star, Trash2 } from "lucide-react"
import { apiClient, Seance, Reservation, Abonnement } from "@/lib/api"
import React from 'react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"

// Interface pour la réponse de l'API des réservations
interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// Utiliser les types depuis l'API
type ReservationType = Reservation;
// Type d'abonnement importé directement depuis l'API
interface AbonnementType extends Abonnement {}

// Type pour le formulaire - correspond exactement au modèle Django
type ReservationFormData = {
  nom_client: string
  type_reservation: 'SEANCE' | 'ABONNEMENT'
  montant: number
  description: string
  telephone?: string
}

export function ClientDashboard({ user }: { user: any }): JSX.Element {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("accueil")
  
  // États pour les réservations et abonnements
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [abonnements, setAbonnements] = useState<AbonnementType[]>([]);
  const [abonnementError, setAbonnementError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingAbonnements, setIsLoadingAbonnements] = useState(false);
  
  // États pour les formulaires
  const [showSeanceForm, setShowSeanceForm] = useState(false);
  const [seanceFormData, setSeanceFormData] = useState({
    nom_client: user?.nom ? `${user.prenom} ${user.nom}` : '',
    montant: 0, // Montant mis à 0, sera défini par l'employé lors de la validation
    description: '',
    telephone: user?.telephone || ''
  });
  
  // État pour le formulaire de réservation
  const [formData, setFormData] = useState<ReservationFormData>({
    nom_client: user?.nom ? `${user.prenom} ${user.nom}` : '',
    type_reservation: 'SEANCE',
    montant: 0, // Montant mis à 0, sera défini par l'employé
    description: '',
    telephone: user?.telephone || ''
  });

  // Charger les abonnements au montage du composant
  useEffect(() => {
    const loadAbonnements = async () => {
      try {
        setIsLoadingAbonnements(true);
        setAbonnementError(null);
        
        const response = await apiClient.getAbonnements() as Abonnement[];
        console.log('Réponse brute de l\'API des abonnements:', response);
        
        // Vérifier si la réponse est un tableau
        if (Array.isArray(response)) {
          if (response.length > 0) {
            console.log(`Nombre d'abonnements chargés: ${response.length}`);
            setAbonnements(response);
          } else {
            console.warn('Le tableau des abonnements est vide');
            setAbonnementError('Aucun abonnement disponible pour le moment');
            setAbonnements([]);
          }
        } else {
          console.error('Format de réponse inattendu:', response);
          setAbonnementError('Erreur de format des données reçues');
          setAbonnements([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des abonnements:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setAbonnementError(`Impossible de charger les abonnements: ${errorMessage}`);
        
        toast({
          title: 'Erreur',
          description: `Impossible de charger les abonnements: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoadingAbonnements(false);
      }
    };

    loadAbonnements();
  }, [toast]);

  // Fonction pour charger les réservations du client
  const loadReservations = async (): Promise<ReservationType[]> => {
    if (!user?.id) {
      console.log('[Client] Aucun utilisateur connecté, impossibilité de charger les réservations');
      return [];
    }
    
    try {
      console.log('[Client] Début du chargement des réservations...');
      
      // Mettre à jour l'état de chargement
      setIsProcessing(true);
      
      // Appeler l'API pour récupérer les réservations
      const reservationsData = await apiClient.getReservationsByClient(user.id);
      
      // Vérifier si des données ont été reçues
      if (!reservationsData || !Array.isArray(reservationsData)) {
        console.warn('[Client] Aucune donnée de réservation valide reçue');
        setReservations([]);
        return [];
      }
      
      console.log(`[Client] ${reservationsData.length} réservations récupérées avec succès`);
      
      // Trier les réservations par date de création (les plus récentes en premier)
      const sortedReservations = [...reservationsData]
        .sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Tri décroissant (les plus récentes en premier)
        });
      
      // Convertir et mettre à jour l'état des réservations
      const formattedReservations = sortedReservations.map(toReservationType);
      setReservations(formattedReservations);
      
      return formattedReservations;
    } catch (error: unknown) {
      // Gérer les erreurs de manière plus précise
      let errorMessage = 'Une erreur inconnue est survenue';
      
      if (error instanceof Error) {
        console.error('[Client] Erreur lors du chargement des réservations:', error.message);
        errorMessage = error.message;
      } else {
        console.error('[Client] Erreur inconnue lors du chargement des réservations');
      }
      
      // Afficher un message d'erreur à l'utilisateur
      toast({
        title: 'Erreur',
        description: `Impossible de charger vos réservations: ${errorMessage}`,
        variant: 'destructive',
      });
      
      // Réinitialiser la liste des réservations en cas d'erreur
      setReservations([]);
      return [];
    } finally {
      // Toujours désactiver l'état de chargement, que la requête ait réussi ou échoué
      setIsProcessing(false);
    }
  };

  // Charger les réservations au montage du composant
  useEffect(() => {
    if (user?.id) {
      loadReservations();
    }
  }, [user?.id]);

  // Fonction utilitaire pour convertir une réservation en ReservationType
  const toReservationType = (res: any): ReservationType => {
    // Créer un objet avec les valeurs par défaut
    const reservation: Reservation = {
      id: res.id || 0,
      nom_client: res.nom_client || '',
      type_reservation: res.type_reservation || 'SEANCE',
      statut: (res.statut as 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE') || 'EN_ATTENTE',
      description: res.description || '',
      montant: Number(res.montant) || 0,
      created_at: res.created_at || new Date().toISOString(),
      updated_at: res.updated_at || new Date().toISOString(),
      montant_total_paye: res.montant_total_paye || '0',
      ticket_url: res.ticket_url
    };
    return reservation;
  };
  
  // Fonction pour formater la date
  const ln = (dateString: string) => {
    if (!dateString) return 'Date inconnue';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour gérer la réservation
  const handleReservation = async (data: ReservationFormData) => {
    try {
      setIsProcessing(true);
      
      console.log('[Client] Données du formulaire reçues:', JSON.stringify(data, null, 2));
      
      // Préparer les données pour l'API selon le modèle Reservation
      const reservationData: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'ticket_url' | 'montant_total_paye'> = {
        nom_client: data.nom_client,
        type_reservation: data.type_reservation,
        description: data.description,
        montant: data.montant,
        statut: 'EN_ATTENTE' as const,
      };
      
      console.log('[Client] Données de réservation préparées:', JSON.stringify(reservationData, null, 2));
      
      // Ajouter le numéro de téléphone à la description si disponible
      if (data.telephone) {
        reservationData.description = `${data.description} - Tél: ${data.telephone}`;
      }
      
      console.log('[Client] Envoi des données de réservation:', JSON.stringify(reservationData, null, 2));
      
      // Appeler l'API
      const result = await apiClient.createReservation(reservationData);
      
      // Mettre à jour la liste des réservations
      await loadReservations();
      
      // Afficher un message de succès
      toast({
        title: "Réservation effectuée",
        description: "Votre réservation a été enregistrée avec succès.",
      });
      
      // Basculer vers l'onglet des tickets
      setActiveTab("tickets");
      
      return result;
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: "Erreur",
        description: `Impossible d'effectuer la réservation: ${errorMessage}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return dateString;
    }
  };

  // Fonction pour créer une réservation d'abonnement directement
  const handleAbonnementReservation = async (abonnement: AbonnementType) => {
    try {
      setIsProcessing(true);
      
      const reservationData = {
        nom_client: `${user.prenom} ${user.nom}`,
        type_reservation: 'ABONNEMENT' as const,
        montant: abonnement.prix,
        description: `Abonnement ${abonnement.nom} - ${abonnement.duree_jours} jours`,
        telephone: user?.telephone || ''
      };
      
      console.log('[Client] Création de réservation d\'abonnement:', reservationData);
      
      await handleReservation(reservationData);
      
      toast({
        title: "Réservation enregistrée",
        description: `Votre demande d'abonnement ${abonnement.nom} a été enregistrée avec succès.`,
      });
      
      setActiveTab("tickets");
    } catch (error) {
      console.error("Erreur lors de la réservation d'abonnement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour créer une réservation de séance via formulaire
  const handleSeanceReservation = async (formData: any) => {
    try {
      setIsProcessing(true);
      
      // Préparer les données selon le type ReservationFormData
      const reservationData: ReservationFormData = {
        nom_client: formData.nom_client,
        type_reservation: 'SEANCE',
        montant: 0, // Montant mis à 0, sera défini par l'employé lors de la validation
        description: formData.description || '',
        telephone: formData.telephone || ''
      };
      
      console.log('[Client] Création de réservation de séance:', reservationData);
      
      await handleReservation(reservationData);
      
      toast({
        title: "Réservation enregistrée",
        description: "Votre séance a été réservée avec succès. Le montant sera défini lors de la validation par l'employé.",
      });
      
      setShowSeanceForm(false);
      setActiveTab("tickets");
    } catch (error) {
      console.error("Erreur lors de la réservation de séance:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour supprimer une réservation
  const handleDeleteReservation = async (reservationId: number) => {
    try {
      setIsProcessing(true);
      
      console.log(`[Client] Tentative de suppression de la réservation ${reservationId}`);
      
      const result = await apiClient.deleteReservation(reservationId);
      
      console.log(`[Client] Résultat de la suppression:`, result);
      
      // Recharger les réservations
      await loadReservations();
      
      toast({
        title: "Réservation supprimée",
        description: "Votre réservation a été supprimée avec succès.",
      });
    } catch (error) {
      console.error("Erreur détaillée lors de la suppression:", error);
      
      // Afficher l'erreur spécifique
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      toast({
        title: "Erreur de suppression",
        description: `Impossible de supprimer la réservation: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };



  // Vérifier si le composant est prêt à être rendu
  if (typeof window === 'undefined') {
    return null;
  }

  // Rendu du tableau de bord
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord client</h1>
          <p className="text-gray-600 mt-2">Gérez vos réservations et accédez à vos tickets</p>
        </div>
        
        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accueil">
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <Ticket className="mr-2 h-4 w-4" />
              Mes tickets
            </TabsTrigger>
          </TabsList>
          
          {/* Contenu de l'onglet Accueil */}
          <TabsContent value="accueil" className="space-y-8">
            {/* Section des panneaux de réservation */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Panneau de réservation d'abonnement */}
              <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500 text-white">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
            <div>
                      <CardTitle className="text-xl">Réservation d'abonnement</CardTitle>
                      <CardDescription>Choisissez votre formule d'abonnement</CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingAbonnements ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                      <p className="text-gray-600">Chargement des abonnements...</p>
              </div>
                  ) : abonnementError ? (
                    <div className="text-center py-6">
                      <p className="text-red-500 mb-4">{abonnementError}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()} 
                        className="gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                      Réessayer
                    </Button>
                  </div>
                ) : abonnements.length > 0 ? (
                    <div className="space-y-4">
                      {abonnements.map((abonnement) => (
                        <div key={abonnement.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{abonnement.nom}</h4>
                              <p className="text-sm text-gray-600">{abonnement.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {abonnement.prix.toLocaleString()} FCFA
                              </div>
                              <div className="text-sm text-gray-500">
                                {abonnement.duree_jours} jours
                              </div>
                            </div>
                        </div>
                        <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleAbonnementReservation(abonnement)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="mr-2 h-4 w-4" />
                          )}
                            {isProcessing ? 'Traitement...' : 'Réserver cet abonnement'}
                        </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun abonnement disponible pour le moment.</p>
                    </div>
                  )}
                      </CardContent>
                    </Card>

              {/* Panneau de réservation de séance */}
              <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500 text-white">
                      <CalendarPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Réservation de séance</CardTitle>
                      <CardDescription>Réservez une séance à l'unité</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <CalendarPlus className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-semibold mb-2">Réservation de séance</h3>
                    <p className="text-gray-600 mb-6">
                      Réservez une séance d'entraînement personnalisée selon vos besoins.
                    </p>
                    <div className="space-y-4 text-sm text-gray-500 mb-6">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Durée flexible selon vos besoins</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Coach disponible selon disponibilité</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Prix: À définir par l'employé lors de la validation</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setShowSeanceForm(true)}
                      disabled={isProcessing}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Réserver une séance
                    </Button>
              </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Bannière d'information */}
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
              <div className="relative z-10 max-w-2xl">
                <h3 className="text-2xl font-bold mb-2">Besoin d'aide ?</h3>
                <p className="text-purple-100 mb-6">
                  Nos équipes sont là pour vous accompagner dans vos réservations. 
                  Contactez-nous pour toute question ou assistance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Contacter le support
                  </Button>
                <Button 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                    onClick={() => setActiveTab("tickets")}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Voir mes réservations
                </Button>
                </div>
              </div>
              <Dumbbell className="absolute right-8 top-1/2 -translate-y-1/2 h-32 w-32 opacity-20" />
            </div>
          </TabsContent>
          
          {/* Contenu de l'onglet Tickets */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes tickets</CardTitle>
                <CardDescription>Consultez et téléchargez vos tickets de réservation</CardDescription>
              </CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Vous n'avez pas encore de réservations.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("accueil")}
                    >
                      Voir les offres
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              reservation.type_reservation === 'ABONNEMENT' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {reservation.type_reservation === 'ABONNEMENT' ? (
                                <ShoppingCart className="h-5 w-5" />
                              ) : (
                                <CalendarPlus className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">Réservation #{reservation.id}</h4>
                              <p className="text-sm text-gray-500">
                                {reservation.type_reservation} • {reservation.created_at ? formatDate(reservation.created_at) : 'Date inconnue'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {reservation.description}
                              </p>
                              <p className="text-sm font-medium text-gray-700 mt-1">
                                {reservation.type_reservation === 'SEANCE' && reservation.montant === 0 
                                  ? 'À définir par l\'employé' 
                                  : `${reservation.montant.toLocaleString()} FCFA`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            reservation.statut === 'CONFIRMEE' 
                              ? 'bg-green-100 text-green-800' 
                              : reservation.statut === 'EN_ATTENTE'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {reservation.statut === 'CONFIRMEE' ? 'CONFIRMÉE' : 
                             reservation.statut === 'EN_ATTENTE' ? 'EN ATTENTE' : 
                             'INCONNU'}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (reservation.ticket_url) {
                                window.open(reservation.ticket_url, '_blank');
                              } else {
                                toast({
                                  title: "Ticket non disponible",
                                  description: "Le ticket n'est pas encore disponible. Veuillez patienter ou contacter le support.",
                                });
                              }
                            }}
                            className="ml-auto"
                            disabled={!reservation.ticket_url}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {reservation.ticket_url ? 'Voir le ticket' : 'Ticket en attente'}
                          </Button>
                          
                          {/* Bouton de suppression - seulement pour les réservations en attente */}
                          {reservation.statut === 'EN_ATTENTE' && (
                            <ConfirmDeleteButton
                              onDelete={() => handleDeleteReservation(reservation.id)}
                              confirmMessage="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
                              successMessage="Votre réservation a été supprimée avec succès."
                              errorMessage="Impossible de supprimer la réservation. Veuillez réessayer."
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={isProcessing}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ConfirmDeleteButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de formulaire de séance */}
      {showSeanceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Réservation de séance</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSeanceForm(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Séance d'entraînement</h4>
                <p className="text-sm text-green-700 mb-2">Réservez une séance personnalisée selon vos besoins</p>
                <div className="space-y-1 text-sm text-green-700">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Durée flexible selon vos besoins
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Coach disponible selon disponibilité
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Prix: À définir par l'employé lors de la validation
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-green-900">
                  Prix à définir
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="nom_client_seance">Nom complet</Label>
                  <Input
                    id="nom_client_seance"
                    value={seanceFormData.nom_client}
                    onChange={(e) => setSeanceFormData({...seanceFormData, nom_client: e.target.value})}
                    placeholder="Votre nom complet"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telephone_seance">Téléphone</Label>
                  <Input
                    id="telephone_seance"
                    value={seanceFormData.telephone || ''}
                    onChange={(e) => setSeanceFormData({...seanceFormData, telephone: e.target.value})}
                    placeholder="Votre numéro de téléphone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description_seance">Description de vos besoins (optionnel)</Label>
                  <Textarea
                    id="description_seance"
                    value={seanceFormData.description}
                    onChange={(e) => setSeanceFormData({...seanceFormData, description: e.target.value})}
                    placeholder="Ex: Musculation, Cardio, Yoga, etc. Préférences d'horaires..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSeanceForm(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => handleSeanceReservation(seanceFormData)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarPlus className="mr-2 h-4 w-4" />
                  )}
                  {isProcessing ? 'Traitement...' : 'Confirmer la réservation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientDashboard;
