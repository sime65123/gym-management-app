"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Download, RotateCcw, Euro, FileText, Trash2, Edit, Calendar } from "lucide-react"
import { apiClient, type User, type Abonnement, type AbonnementClientPresentiel, type HistoriquePaiement } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadAbonnementsClients()
  }, [])

  const loadData = async () => {
    try {
      const abonnementsData = await apiClient.getAbonnements()
      setAbonnements(Array.isArray(abonnementsData.results) ? abonnementsData.results : abonnementsData)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAbonnementsClients = async () => {
    try {
      const abonnementsClientsData = await apiClient.getAbonnementsClientsPresentiels()
      setAbonnementsClients(Array.isArray(abonnementsClientsData.results) ? abonnementsClientsData.results : abonnementsClientsData)
    } catch (error) {
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
      const dataToSend = {
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        abonnement: formData.abonnement,
        date_debut: formData.date_debut,
      }
      await apiClient.createAbonnementClientPresentiel(dataToSend)
      loadAbonnementsClients()
      setIsCreateDialogOpen(false)
      setFormData({ client_nom: "", client_prenom: "", abonnement: "", date_debut: new Date().toISOString().split('T')[0], date_fin: "" })
      loadData()
      toast({
        title: "Ajout réussi",
        description: "L'abonnement client a été enregistré.",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "L'ajout a échoué.",
        variant: "destructive",
        duration: 5000,
      })
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
    setSelectedAbonnement(abonnement)
    setEditFormData({
      client_nom: abonnement.client_nom,
      client_prenom: abonnement.client_prenom,
      abonnement: abonnement.abonnement.toString(),
      date_debut: abonnement.date_debut,
      date_fin: abonnement.date_fin,
    })
    setIsEditDialogOpen(true)
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
      const res = await apiClient.genererFactureAbonnementPresentiel(abonnement.id)
      loadAbonnementsClients()
      toast({
        title: "Facture générée",
        description: "La facture a été générée.",
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
      const blob = await apiClient.telechargerFactureAbonnementPresentiel(abonnement.id)
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors du téléchargement de la facture.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

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
              <CardDescription>Enregistrez les abonnements des clients venus sur place, modifiez les montants payés et générez les factures.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} title="Actualiser la liste">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel abonnement client
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abonnementsClients.map((abClient) => (
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
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(abClient)} title="Modifier l'abonnement">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setHistoriqueAbonnement(abClient); setIsHistoriqueDialogOpen(true); }} title="Historique paiements">
                        <FileText className="h-4 w-4" />
                      </Button>
                      {abClient.facture_pdf_url && (
                        <Button size="sm" variant="outline" onClick={() => handleTelechargerFacture(abClient)} title="Télécharger facture">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteAbonnement(abClient.id)} title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de création */}
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

      {/* Dialog modification abonnement */}
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

      {/* Dialog historique paiements */}
      <Dialog open={isHistoriqueDialogOpen} onOpenChange={setIsHistoriqueDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Historique des paiements</DialogTitle>
            <DialogDescription>
              Liste des paiements effectués pour cet abonnement
            </DialogDescription>
          </DialogHeader>
          
          {/* Section modification montant */}
          <div className="mb-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Ajouter un paiement</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="montant_modification">Montant à ajouter</Label>
                <Input
                  id="montant_modification"
                  type="number"
                  min={0}
                  max={historiqueAbonnement ? historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye : undefined}
                  value={montantModification}
                  onChange={e => setMontantModification(e.target.value)}
                  placeholder="Montant en FCFA que le client vient de donner"
                />
              </div>
              <Button onClick={handleModifierMontantPaye} disabled={!montantModification}>
                <Euro className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </div>
            {historiqueAbonnement && (
              <div className="text-sm text-gray-500 mt-2 space-y-1">
                <p>Montant total de l'abonnement: {historiqueAbonnement.montant_total.toLocaleString()} FCFA</p>
                <p>Montant déjà payé: {historiqueAbonnement.montant_paye.toLocaleString()} FCFA</p>
                <p>Reste à payer: {(historiqueAbonnement.montant_total - historiqueAbonnement.montant_paye).toLocaleString()} FCFA</p>
              </div>
            )}
          </div>

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
    </div>
  )
} 