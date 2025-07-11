"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RotateCcw, Ticket, User, Calendar, Clock, X, Trash2, Plus, Download } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"
import { format as formatDateFns, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth/auth-context"

interface Seance {
  id: number
  client_nom?: string | null
  client_prenom?: string | null
  date_jour?: string | null
  nombre_heures?: number | null
  montant_paye?: number | null
  coach?: {
    id: number
    nom: string
    prenom: string
    categorie: string
  } | null
  ticket_url?: string | null
  titre?: string
  description?: string
  date_heure?: string
  capacite?: number
  client_id?: number | null
  client_email?: string | null
  paye_directement?: boolean
  ticket_id?: number | null
  ticket_pdf_url?: string | null
}

interface Coach {
  id: number
  nom: string
  prenom: string
  categorie: string
}
export function SeanceManagement({ onReload }: { onReload?: () => void }) {
  const [seances, setSeances] = useState<Seance[]>([]);
  const [coachs, setCoachs] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSeance, setEditingSeance] = useState<Seance | null>(null);
  const [newSeance, setNewSeance] = useState({
    client_nom: '',
    client_prenom: '',
    date_jour: formatDateFns(new Date(), 'yyyy-MM-dd'),
    nombre_heures: 1,
    montant_paye: '',
    coach_id: ''
  })
  
  const { toast } = useToast()
  const { user } = useAuth()

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === "ADMIN"
  const isEmployee = user?.role === "EMPLOYE"

  // Charger les séances depuis l'API
  const loadSeances = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Chargement des séances...')
      const response = await apiClient.getSeances()
      console.log('Réponse de l\'API (séances):', response)
      
      // Vérifier si la réponse est un tableau
      if (Array.isArray(response)) {
        console.log('Réponse est un tableau avec', response.length, 'séances')
        setSeances(response)
      } 
      // Vérifier si c'est un objet avec une propriété results qui est un tableau
      else if (response && typeof response === 'object' && response !== null && 'results' in response && Array.isArray(response.results)) {
        console.log('Réponse contient un tableau results avec', response.results.length, 'séances')
        setSeances(response.results)
      } 
      // Gestion des autres cas
      else {
        console.error("Format de réponse inattendu:", response)
        toast({
          title: "Format de données inattendu",
          description: "Les données reçues du serveur ne sont pas au format attendu.",
          variant: "destructive",
        })
        setSeances([])
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des séances:", error)
      
      let errorMessage = "Impossible de charger les séances. Veuillez réessayer."
      
      if (error.response) {
        // Erreur HTTP avec réponse du serveur
        console.error('Détails de l\'erreur:', error.response.status, error.response.statusText)
        
        if (error.response.status === 401) {
          errorMessage = "Session expirée. Veuillez vous reconnecter."
        } else if (error.response.status === 403) {
          errorMessage = "Vous n'avez pas les droits pour accéder à cette ressource."
        } else if (error.response.status >= 500) {
          errorMessage = "Erreur serveur. Veuillez réessayer plus tard."
        }
      } else if (error.message) {
        // Erreur avec un message personnalisé
        errorMessage = error.message
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Charger les coachs disponibles
  const loadCoachs = useCallback(async () => {
    try {
      const response = await apiClient.getPersonnel()
      // Vérifier si la réponse contient une propriété results
      const coachsData = Array.isArray(response) 
        ? response 
        : (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results))
          ? response.results 
          : [];
      setCoachs(coachsData.filter((coach: any) => coach.categorie === "COACH"))
    } catch (error) {
      console.error("Erreur lors du chargement des coachs:", error)
    }
  }, [])

  // Charger les données au montage du composant
  useEffect(() => {
    loadSeances()
    loadCoachs()
  }, [loadSeances, loadCoachs])

  // Ouvrir le ticket PDF dans un nouvel onglet
  const handleViewTicket = (ticketUrl: string) => {
    window.open(ticketUrl, '_blank');
  };

  // Gérer l'édition d'une séance
  const handleEditSeance = async () => {
    if (!editingSeance) return;
    
    try {
      console.log('=== DEBUG EDIT SEANCE ===');
      console.log('Editing session:', editingSeance);
      
      // Préparer les données pour l'API
      const seanceData = {
        client_nom: editingSeance.client_nom,
        client_prenom: editingSeance.client_prenom,
        date_jour: editingSeance.date_jour,
        nombre_heures: Number(editingSeance.nombre_heures),
        montant_paye: editingSeance.montant_paye ? Number(editingSeance.montant_paye) : 0,
        // Si coach_id est 'none' ou vide, on envoie null à l'API
        coach_id: (editingSeance.coach_id && editingSeance.coach_id !== 'none') 
          ? Number(editingSeance.coach_id) 
          : null
      };
      
      console.log('Data to send:', seanceData);
      
      const result = await apiClient.updateSeance(editingSeance.id, seanceData);
      console.log('Update result:', result);
      
      toast({
        title: "Succès",
        description: "La séance a été modifiée avec succès.",
      });
      
      setIsEditDialogOpen(false);
      setEditingSeance(null);
      await loadSeances();
      
    } catch (error: any) {
      console.error("Erreur lors de la modification de la séance:", error);
      
      let errorMessage = "Une erreur est survenue lors de la modification de la séance.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.detail) {
        errorMessage = error.data.detail;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Ouvrir le modal d'édition
  const openEditDialog = (seance: Seance) => {
    console.log('Opening edit dialog for session:', seance);
    
    const editingData = {
      ...seance,
      coach_id: seance.coach?.id?.toString() || 'none',
      // S'assurer que les valeurs numériques sont bien définies
      nombre_heures: seance.nombre_heures || 1,
      montant_paye: seance.montant_paye ? seance.montant_paye.toString() : ''
    };
    
    console.log('Editing data prepared:', editingData);
    setEditingSeance(editingData);
    setIsEditDialogOpen(true);
  };

  // Gérer la création d'une nouvelle séance
  const handleCreateSeance = async () => {
    try {
      // Préparer les données pour l'API
      const seanceData = {
        ...newSeance,
        nombre_heures: Number(newSeance.nombre_heures),
        montant_paye: Number(newSeance.montant_paye),
        // Si coach_id est 'none' ou vide, on envoie null à l'API
        coach_id: (newSeance.coach_id && newSeance.coach_id !== 'none') 
          ? Number(newSeance.coach_id) 
          : null
      };
      
      await apiClient.createSeance(seanceData);
      
      toast({
        title: "Succès",
        description: "La séance a été créée avec succès.",
      });
      
      setIsCreateDialogOpen(false);
      await loadSeances();
      
      // Réinitialiser le formulaire
      setNewSeance({
        client_nom: '',
        client_prenom: '',
        date_jour: formatDateFns(new Date(), 'yyyy-MM-dd'),
        nombre_heures: 1,
        montant_paye: '',
        coach_id: ''
      });
      
    } catch (error) {
      console.error("Erreur lors de la création de la séance:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la séance.",
        variant: "destructive",
      });
    }
  };

  // Gérer le téléchargement du ticket en PDF
  const handleDownloadTicket = (seance: Seance) => {
    // Vérifier si une URL de ticket PDF est disponible
    if (seance.ticket_pdf_url) {
      // Ouvrir directement le PDF dans un nouvel onglet
      window.open(seance.ticket_pdf_url, '_blank');
      return;
    }
    
    // Créer le contenu HTML du ticket
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket de séance</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .ticket {
            max-width: 600px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 20px;
            position: relative;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 20px 0;
          }
          .info {
            margin-bottom: 15px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .label {
            font-weight: bold;
            min-width: 120px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-style: italic;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
            }
            .ticket {
              border: none;
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <img src="lg1.jpg" alt="Logo" class="logo" onerror="this.style.display='none'" />
            <div class="title">TICKET DE SÉANCE</div>
          </div>
          
          <div class="info">
            <div class="info-row">
              <div class="label">Client:</div>
              <div>${seance.client_prenom || 'Non'} ${seance.client_nom || 'spécifié'}</div>
            </div>
            <div class="info-row">
              <div class="label">Date:</div>
              <div>${seance.date_jour ? formatDate(seance.date_jour) : 'Non spécifiée'}</div>
            </div>
            <div class="info-row">
              <div class="label">Durée:</div>
              <div>${seance.nombre_heures || 0} heure${(seance.nombre_heures || 0) !== 1 ? 's' : ''}</div>
            </div>
            <div class="info-row">
              <div class="label">Montant:</div>
              <div>${(seance.montant_paye || 0).toLocaleString()} FCFA</div>
            </div>
            <div class="info-row">
              <div class="label">Coach:</div>
              <div>${seance.coach ? `${seance.coach.prenom || ''} ${seance.coach.nom || ''}`.trim() : 'Non spécifié'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            Merci pour votre confiance !<br>
            Présentez ce ticket à l'accueil.
          </div>
        </div>
      </body>
      </html>
    `;

    // Créer une nouvelle fenêtre pour le ticket
    const ticketWindow = window.open('', '_blank');
    if (ticketWindow) {
      ticketWindow.document.open();
      ticketWindow.document.write(htmlContent);
      ticketWindow.document.close();
      
      // Ajouter un bouton d'impression
      ticketWindow.onload = function() {
        // Attendre un court instant pour s'assurer que le contenu est chargé
        setTimeout(() => {
          // Ajouter un bouton d'impression en haut à droite
          const printButton = ticketWindow.document.createElement('button');
          printButton.textContent = 'Imprimer le ticket';
          printButton.style.position = 'fixed';
          printButton.style.top = '10px';
          printButton.style.right = '10px';
          printButton.style.padding = '8px 16px';
          printButton.style.backgroundColor = '#4CAF50';
          printButton.style.color = 'white';
          printButton.style.border = 'none';
          printButton.style.borderRadius = '4px';
          printButton.style.cursor = 'pointer';
          printButton.onclick = function() {
            ticketWindow.print();
          };
          
          ticketWindow.document.body.appendChild(printButton);
        }, 100);
      };
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le ticket. Veuillez vérifier les paramètres de votre navigateur.",
        variant: "destructive",
      });
    }
  };

  // Formater la date en français
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      const date = parseISO(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('Date invalide reçue:', dateString);
        return 'Date invalide';
      }
      return formatDateFns(date, 'PPP', { locale: fr });
    } catch (error) {
      console.error("Erreur de formatage de date:", error, "Valeur reçue:", dateString);
      return 'Date invalide';
    }
  };

  // Filtrer les séances en fonction du terme de recherche
  const filteredSeances = seances.filter((seance: Seance) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const coachName = seance.coach 
      ? `${seance.coach.prenom || ''} ${seance.coach.nom || ''}`.toLowerCase()
      : '';
      
    const clientNom = (seance.client_nom || '').toLowerCase();
    const clientPrenom = (seance.client_prenom || '').toLowerCase();
    const dateFormatee = formatDate(seance.date_jour).toLowerCase();
    const montantPaye = (seance.montant_paye || '').toString();
    
    return (
      clientNom.includes(searchLower) ||
      clientPrenom.includes(searchLower) ||
      dateFormatee.includes(searchLower) ||
      montantPaye.includes(searchTerm) ||
      coachName.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div>
          <h2 className="text-2xl font-bold">Liste des Séances</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin 
              ? "Séances payées par les clients" 
              : "Consultez les séances payées par les clients"
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input
              placeholder="Rechercher par nom, prénom, date ou montant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={loadSeances} title="Actualiser">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {isEmployee && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button className="ml-2">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle séance
              </Button>
            </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle séance</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="client_prenom" className="text-right">
                      Prénom du client
                    </Label>
                  <Input
                      id="client_prenom"
                      value={newSeance.client_prenom}
                      onChange={(e) => setNewSeance({...newSeance, client_prenom: e.target.value})}
                      className="col-span-3"
                      required
                  />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="client_nom" className="text-right">
                      Nom du client
                    </Label>
                    <Input
                      id="client_nom"
                      value={newSeance.client_nom}
                      onChange={(e) => setNewSeance({...newSeance, client_nom: e.target.value})}
                      className="col-span-3"
                      required
                  />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date_jour" className="text-right">
                      Date
                    </Label>
                  <Input
                      id="date_jour"
                      type="date"
                      value={newSeance.date_jour}
                      onChange={(e) => setNewSeance({...newSeance, date_jour: e.target.value})}
                      className="col-span-3"
                      required
                  />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nombre_heures" className="text-right">
                      Durée (heures)
                    </Label>
                  <Input
                      id="nombre_heures"
                      type="number"
                      min="1"
                      value={newSeance.nombre_heures}
                      onChange={(e) => setNewSeance({...newSeance, nombre_heures: Number(e.target.value)})}
                      className="col-span-3"
                      required
                  />
                </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="montant_paye" className="text-right">
                      Montant payé (FCFA)
                    </Label>
                  <Input
                      id="montant_paye"
                    type="number"
                      min="0"
                      value={newSeance.montant_paye}
                      onChange={(e) => setNewSeance({...newSeance, montant_paye: e.target.value})}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="coach_id" className="text-right">
                      Coach (optionnel)
                    </Label>
                    <Select
                      value={newSeance.coach_id || undefined}
                      onValueChange={(value) => setNewSeance({...newSeance, coach_id: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionner un coach" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun coach</SelectItem>
                        {coachs.map((coach) => (
                          <SelectItem key={coach.id} value={coach.id.toString()}>
                            {coach.prenom} {coach.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                  <Button onClick={handleCreateSeance} disabled={!newSeance.client_nom || !newSeance.client_prenom || !newSeance.date_jour || !newSeance.montant_paye}>
                    Créer la séance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Modal d'édition */}
          {isEmployee && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier la séance</DialogTitle>
                </DialogHeader>
                {editingSeance && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit_client_prenom" className="text-right">
                        Prénom du client
                      </Label>
                      <Input
                        id="edit_client_prenom"
                        value={editingSeance.client_prenom || ''}
                        onChange={(e) => setEditingSeance({...editingSeance, client_prenom: e.target.value})}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit_client_nom" className="text-right">
                        Nom du client
                      </Label>
                      <Input
                        id="edit_client_nom"
                        value={editingSeance.client_nom || ''}
                        onChange={(e) => setEditingSeance({...editingSeance, client_nom: e.target.value})}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit_date_jour" className="text-right">
                        Date
                      </Label>
                      <Input
                        id="edit_date_jour"
                        type="date"
                        value={editingSeance.date_jour || ''}
                        onChange={(e) => setEditingSeance({...editingSeance, date_jour: e.target.value})}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit_nombre_heures" className="text-right">
                        Durée (heures)
                      </Label>
                      <Input
                        id="edit_nombre_heures"
                        type="number"
                        min="1"
                        value={editingSeance.nombre_heures || 1}
                        onChange={(e) => setEditingSeance({...editingSeance, nombre_heures: Number(e.target.value)})}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit_montant_paye" className="text-right">
                        Montant payé (FCFA)
                      </Label>
                      <Input
                        id="edit_montant_paye"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingSeance.montant_paye || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditingSeance({
                            ...editingSeance, 
                            montant_paye: value === '' ? '' : value
                          });
                        }}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit_coach_id" className="text-right">
                        Coach (optionnel)
                      </Label>
                      <Select
                        value={editingSeance.coach_id || undefined}
                        onValueChange={(value) => setEditingSeance({...editingSeance, coach_id: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Sélectionner un coach" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun coach</SelectItem>
                          {coachs.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id.toString()}>
                              {coach.prenom} {coach.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleEditSeance} disabled={!editingSeance?.client_nom || !editingSeance?.client_prenom || !editingSeance?.date_jour || !editingSeance?.montant_paye}>
                    Modifier la séance
                  </Button>
                </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Montant</TableHead>
              <TableHead>Coach</TableHead>
                {isAdmin && <TableHead>Ticket</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {filteredSeances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    {searchTerm 
                      ? "Aucune séance ne correspond à votre recherche" 
                      : "Aucune séance trouvée"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSeances.map((seance) => (
              <TableRow key={seance.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{seance.client_prenom} {seance.client_nom}</span>
                  </div>
                </TableCell>
                <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(seance.date_jour)}</span>
                  </div>
                </TableCell>
                <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{(seance.nombre_heures || 0)} heure{(seance.nombre_heures || 0) > 1 ? 's' : ''}</span>
                  </div>
                </TableCell>
                    <TableCell>{Number(seance.montant_paye || 0).toLocaleString()} FCFA</TableCell>
                <TableCell>
                      {seance.coach 
                        ? `${seance.coach.prenom || ''} ${seance.coach.nom || ''}`.trim() || 'Coach sans nom'
                        : 'Non spécifié'}
                </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {isEmployee && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(seance)}
                            title="Modifier la séance"
                          >
                            <Calendar className="h-4 w-4" />
                    </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadTicket(seance)}
                          title="Télécharger le ticket"
                        >
                          <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
                ))
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  );
}