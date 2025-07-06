"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Download, RotateCcw, Euro, FileText, Trash2, Edit, Calendar, DollarSign } from "lucide-react"
import { apiClient, type Abonnement, type AbonnementClientPresentiel, type FactureResponse } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth/auth-context"

export function AbonnementClientManagement() {
  const [abonnementsClients, setAbonnementsClients] = useState<AbonnementClientPresentiel[]>([])
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoriqueDialogOpen, setIsHistoriqueDialogOpen] = useState(false)
  const [selectedAbonnement, setSelectedAbonnement] = useState<AbonnementClientPresentiel | null>(null)
  const [historiqueAbonnement, setHistoriqueAbonnement] = useState<AbonnementClientPresentiel | null>(null)
  const [formData, setFormData] = useState({
    client_nom: "",
    client_prenom: "",
    abonnement: "",
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: "",
  })
  const [editFormData, setEditFormData] = useState({
    client_nom: "",
    client_prenom: "",
    abonnement: "",
    date_debut: "",
    date_fin: "",
  })
  const [montantModification, setMontantModification] = useState("")
  const [search, setSearch] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()

  // Vérifier si l'utilisateur est employé
  const isEmployee = user?.role === "EMPLOYE"
  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    loadData()
    loadAbonnementsClients()
  }, [])

  const loadData = async () => {
    try {
      const abonnementsData = await apiClient.getAbonnements() as { results: Abonnement[] } | Abonnement[]
      const abonnementsList = Array.isArray(abonnementsData) ? abonnementsData : 
                            (Array.isArray(abonnementsData?.results) ? abonnementsData.results : [])
      setAbonnements(abonnementsList)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      setAbonnements([])
    } finally {
      setLoading(false)
    }
  }

  const loadAbonnementsClients = async () => {
    try {
      const abonnementsClientsData = await apiClient.getAbonnementsClientsPresentiels() as { results: AbonnementClientPresentiel[] } | AbonnementClientPresentiel[]
      const clientsList = Array.isArray(abonnementsClientsData) ? abonnementsClientsData : 
                        (Array.isArray(abonnementsClientsData?.results) ? abonnementsClientsData.results : [])
      setAbonnementsClients(clientsList)
    } catch (error) {
      console.error("Erreur lors du chargement des abonnements clients:", error)
      setAbonnementsClients([])
    }
  }

  const calculateDateFin = (dateDebut: string, abonnementId: string) => {
    if (!dateDebut || !abonnementId) return ""
    const abonnement = abonnements.find(a => a.id.toString() === abonnementId)
    if (!abonnement) return ""
    
    const date = new Date(dateDebut)
    date.setDate(date.getDate() + abonnement.duree_jours)
    return date.toISOString().split('T')[0]
  }

  const handleCreateAbonnementClient = async () => {
    try {
      // Vérifier que les champs requis sont remplis
      if (!formData.client_nom || !formData.client_prenom || !formData.abonnement) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }
      
      // Créer l'objet d'abonnement avec les données du formulaire
      const dataToSend = {
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        abonnement: Number(formData.abonnement),
        date_debut: formData.date_debut,
        montant_paye: 0,
        statut_paiement: 'PAIEMENT_INACHEVE',
        statut: 'EN_COURS'
      };

      // Envoyer les données au serveur
      await apiClient.createAbonnementClientPresentiel(dataToSend);
      loadAbonnementsClients();
      setIsCreateDialogOpen(false);
      setFormData({ 
        client_nom: "", 
        client_prenom: "", 
        abonnement: "", 
        date_debut: new Date().toISOString().split('T')[0], 
        date_fin: "" 
      });
      loadData();
      
      toast({
        title: "Ajout réussi",
        description: "L'abonnement client a été enregistré.",
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error creating client subscription:', error);
      let errorMessage = "L'ajout a échoué.";
      
      if (error.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.detail || error.message || errorMessage;
        } catch (e) {
          errorMessage = error.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  const handleEditAbonnement = async () => {
    if (!selectedAbonnement) return
    try {
      await apiClient.updateAbonnementClientPresentiel(selectedAbonnement.id, {
        client_nom: editFormData.client_nom,
        client_prenom: editFormData.client_prenom,
        abonnement: editFormData.abonnement,
        date_debut: editFormData.date_debut,
      })
      loadAbonnementsClients()
      setIsEditDialogOpen(false)
      toast({
        title: "Modification réussie",
        description: "L'abonnement a été modifié.",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "La modification a échoué.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const openEditDialog = (abonnement: AbonnementClientPresentiel) => {
    // Vérifier si un paiement a déjà été effectué
    if (abonnement.montant_paye > 0) {
      toast({
        title: "Modification impossible",
        description: "La modification n'est pas autorisée car un paiement a déjà été enregistré pour cet abonnement.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    setSelectedAbonnement(abonnement);
    setEditFormData({
      client_nom: abonnement.client_nom,
      client_prenom: abonnement.client_prenom,
      abonnement: abonnement.abonnement.toString(),
      date_debut: abonnement.date_debut,
      date_fin: abonnement.date_fin,
    });
    setIsEditDialogOpen(true);
  }

  const handleModifierMontantPaye = async () => {
    if (!historiqueAbonnement) return
    try {
      const montantAjoute = parseFloat(montantModification)
      if (montantAjoute <= 0) {
        toast({
          title: "Erreur",
          description: "Le montant ajouté doit être supérieur à zéro.",
          variant: "destructive",
          duration: 5000,
        })
        return
      }
      if (montantAjoute > (historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye)) {
        toast({
          title: "Erreur",
          description: `Le montant ajouté ne peut pas dépasser le reste à payer (${(historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye).toLocaleString()} FCFA)`,
          variant: "destructive",
          duration: 5000,
        })
        return
      }
      await apiClient.modifierMontantPaye(historiqueAbonnement.id, montantAjoute)
      loadAbonnementsClients()
      setMontantModification("")
      toast({
        title: "Montant ajouté",
        description: `${montantAjoute.toLocaleString()} FCFA ont été ajoutés au paiement.`,
        duration: 5000,
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de l'ajout du montant.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDeleteAbonnement = async (id: number) => {
    try {
      await apiClient.deleteAbonnementClientPresentiel(id)
      setAbonnementsClients(prev => prev.filter(a => a.id !== id))
      toast({
        title: "Suppression réussie",
        description: "L'abonnement a été supprimé.",
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

  const handleGenererFacture = async (abonnement: AbonnementClientPresentiel) => {
    try {
      const res = await apiClient.genererFactureAbonnementPresentiel(abonnement.id) as FactureResponse
      loadAbonnementsClients()
      toast({
        title: "Facture générée",
        description: res.message || "La facture a été générée.",
        duration: 5000,
      })
      if (res.facture_url) {
        window.open(res.facture_url, '_blank')
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la génération de la facture.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleTelechargerFacture = async (abonnement: AbonnementClientPresentiel) => {
    try {
      const response = await apiClient.telechargerFactureAbonnementPresentiel(abonnement.id)
      
      if (response instanceof Blob) {
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(response)
        const a = document.createElement('a')
        a.href = url
        a.download = `facture_abonnement_${abonnement.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Téléchargement réussi",
          description: "La facture a été téléchargée.",
          duration: 5000,
        })
      } else {
        throw new Error("Format de réponse inattendu lors du téléchargement de la facture")
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors du téléchargement de la facture.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const filteredAbonnements = abonnementsClients.filter((ab) => {
    const nom = ab.client_nom?.toLowerCase() || "";
    const prenom = ab.client_prenom?.toLowerCase() || "";
    return nom.includes(search.toLowerCase()) || prenom.includes(search.toLowerCase());
  });

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Abonnements Clients Présentiels</CardTitle>
              <CardDescription>
                {isEmployee 
                  ? "Enregistrez les abonnements des clients venus sur place, modifiez les montants payés et générez les factures." 
                  : "Consultez les abonnements des clients venus sur place."
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} title="Actualiser la liste">
                <RotateCcw className="h-4 w-4" />
              </Button>
              {isEmployee && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel abonnement client
              </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Champ de recherche */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher par nom ou prénom du client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Montant payé</TableHead>
                <TableHead>Montant total</TableHead>
                <TableHead>Statut paiement</TableHead>
                <TableHead>Statut</TableHead>
                {isEmployee && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAbonnements.map((abClient) => (
                <TableRow key={abClient.id}>
                  <TableCell>{abClient.client_prenom || "-"}</TableCell>
                  <TableCell>{abClient.client_nom || "-"}</TableCell>
                  <TableCell>{abClient.abonnement_nom}</TableCell>
                  <TableCell>{new Date(abClient.date_debut).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{new Date(abClient.date_fin).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{abClient.montant_paye.toLocaleString()} FCFA</TableCell>
                  <TableCell>{abClient.montant_total.toLocaleString()} FCFA</TableCell>
                  <TableCell>
                    <Badge className={abClient.statut_paiement === "PAIEMENT_TERMINE" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {abClient.statut_paiement === "PAIEMENT_TERMINE" ? "Paiement terminé" : "Paiement inachevé"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={abClient.statut === "EN_COURS" ? "bg-blue-100 text-blue-800" : abClient.statut === "TERMINE" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}>
                      {abClient.statut === "EN_COURS" ? "En cours" : abClient.statut === "TERMINE" ? "Terminé" : "Expiré"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* Boutons pour les employés seulement */}
                      {isEmployee && (
                        <>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(abClient)} title="Modifier l'abonnement">
                        <Edit className="h-4 w-4" />
                      </Button>
                          <Button size="sm" variant="outline" onClick={() => { setHistoriqueAbonnement(abClient); setIsHistoriqueDialogOpen(true); }} title="Historique paiements" disabled={abClient.statut_paiement === 'PAIEMENT_TERMINE'}>
                        <FileText className="h-4 w-4" />
                      </Button>
                        </>
                      )}
                      
                      {/* Boutons pour tous les utilisateurs (admin et employé) */}
                      {abClient.facture_pdf_url && (
                        <Button size="sm" variant="outline" onClick={() => handleTelechargerFacture(abClient)} title="Télécharger facture">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Bouton historique pour les admins sur les abonnements non terminés */}
                      {isAdmin && abClient.statut_paiement !== 'PAIEMENT_TERMINE' && (
                        <Button size="sm" variant="outline" onClick={() => { setHistoriqueAbonnement(abClient); setIsHistoriqueDialogOpen(true); }} title="Voir l'historique des paiements">
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Bouton suppression pour les employés seulement */}
                      {isEmployee && (
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteAbonnement(abClient.id)} title="Supprimer" disabled={abClient.statut_paiement === 'PAIEMENT_TERMINE' || abClient.montant_paye > 0}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de création - Seulement pour les employés */}
      {isEmployee && (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel abonnement client présentiel</DialogTitle>
            <DialogDescription>
              Enregistrez un abonnement pour un client venu sur place
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="client_prenom">Prénom du client</Label>
                <Input id="client_prenom" value={formData.client_prenom} onChange={e => setFormData({ ...formData, client_prenom: e.target.value })} />
              </div>
              <div className="flex-1">
                <Label htmlFor="client_nom">Nom du client</Label>
                <Input id="client_nom" value={formData.client_nom} onChange={e => setFormData({ ...formData, client_nom: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="abonnement">Abonnement</Label>
              <Select value={formData.abonnement} onValueChange={(value) => {
                const dateFin = calculateDateFin(formData.date_debut, value)
                setFormData({ ...formData, abonnement: value, date_fin: dateFin })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un abonnement" />
                </SelectTrigger>
                <SelectContent>
                  {abonnements.map((abonnement) => (
                    <SelectItem key={abonnement.id} value={abonnement.id.toString()}>
                      {abonnement.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date_debut">Date de début</Label>
              <Input
                id="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={(e) => {
                  const dateFin = calculateDateFin(e.target.value, formData.abonnement)
                  setFormData({ ...formData, date_debut: e.target.value, date_fin: dateFin })
                }}
              />
            </div>
            {formData.date_fin && (
              <div>
                <Label htmlFor="date_fin">Date de fin (calculée automatiquement)</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            )}
            <div>
              <Button onClick={handleCreateAbonnementClient}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Dialog modification abonnement - Seulement pour les employés */}
      {isEmployee && (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'abonnement client</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'abonnement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="edit_client_prenom">Prénom du client</Label>
                <Input id="edit_client_prenom" value={editFormData.client_prenom} onChange={e => setEditFormData({ ...editFormData, client_prenom: e.target.value })} />
              </div>
              <div className="flex-1">
                <Label htmlFor="edit_client_nom">Nom du client</Label>
                <Input id="edit_client_nom" value={editFormData.client_nom} onChange={e => setEditFormData({ ...editFormData, client_nom: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_abonnement">Abonnement</Label>
              <Select value={editFormData.abonnement} onValueChange={(value) => {
                const dateFin = calculateDateFin(editFormData.date_debut, value)
                setEditFormData({ ...editFormData, abonnement: value, date_fin: dateFin })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un abonnement" />
                </SelectTrigger>
                <SelectContent>
                  {abonnements.map((abonnement) => (
                    <SelectItem key={abonnement.id} value={abonnement.id.toString()}>
                      {abonnement.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_date_debut">Date de début</Label>
              <Input
                id="edit_date_debut"
                type="date"
                value={editFormData.date_debut}
                onChange={(e) => {
                  const dateFin = calculateDateFin(e.target.value, editFormData.abonnement)
                  setEditFormData({ ...editFormData, date_debut: e.target.value, date_fin: dateFin })
                }}
              />
            </div>
            {editFormData.date_fin && (
              <div>
                <Label htmlFor="edit_date_fin">Date de fin (calculée automatiquement)</Label>
                <Input
                  id="edit_date_fin"
                  type="date"
                  value={editFormData.date_fin}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            )}
            <div>
              <Button onClick={handleEditAbonnement}>Modifier</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Dialog historique paiements - Pour les employés et admins (lecture seule pour les admins) */}
      {(isEmployee || isAdmin) && (
      <Dialog open={isHistoriqueDialogOpen} onOpenChange={setIsHistoriqueDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Historique des paiements</DialogTitle>
            <DialogDescription>
                {isEmployee 
                  ? "Liste des paiements effectués pour cet abonnement" 
                  : "Historique des paiements effectués pour cet abonnement"
                }
            </DialogDescription>
          </DialogHeader>
          
            {/* Section modification montant - Seulement pour les employés */}
            {isEmployee && (
          <div className="mb-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Ajouter un paiement</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="montant_modification">Montant à ajouter</Label>
                <div className="relative">
                  <Input
                    id="montant_modification"
                    type="number"
                    min={0}
                    max={historiqueAbonnement ? historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye : undefined}
                    value={montantModification}
                    onChange={e => setMontantModification(e.target.value)}
                    placeholder="Montant que le client vient de donner"
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">FCFA</span>
                </div>
              </div>
              <Button onClick={handleModifierMontantPaye} disabled={!montantModification}>
                <DollarSign className="h-4 w-4 mr-1" /> Ajouter le paiement
              </Button>
            </div>
            {historiqueAbonnement && (
              <div className="text-sm text-gray-500 mt-2 space-y-1">
                <p className="font-medium">Montant total de l'abonnement: <span className="font-bold">{historiqueAbonnement.montant_total.toLocaleString('fr-FR')} FCFA</span></p>
                <p className="text-green-600">Montant déjà payé: <span className="font-bold">{historiqueAbonnement.montant_paye.toLocaleString('fr-FR')} FCFA</span></p>
                <p className={historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye > 0 ? 'text-red-600' : 'text-green-600'}>
                  {historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye > 0 
                    ? `Reste à payer: ${(historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye).toLocaleString('fr-FR')} FCFA`
                    : 'Paiement complet'}
                </p>
              </div>
            )}
          </div>
            )}

          <ScrollArea className="max-h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Montant ajouté</TableHead>
                  <TableHead>Total après paiement</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historiqueAbonnement?.historique_paiements?.length ? (
                  historiqueAbonnement.historique_paiements.map((hp) => (
                    <TableRow key={hp.id}>
                      <TableCell>{hp.montant_ajoute.toLocaleString()} FCFA</TableCell>
                      <TableCell>{hp.montant_total_apres.toLocaleString()} FCFA</TableCell>
                      <TableCell>{new Date(hp.date_modification).toLocaleString("fr-FR")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Aucun paiement enregistré</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
} 