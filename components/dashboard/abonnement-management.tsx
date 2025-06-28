"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Abonnement {
  id: number
  nom: string
  description: string
  prix: number
  duree_jours: number
  actif: boolean
}

export function AbonnementManagement({ onReload }: { onReload?: () => void }) {
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAbonnement, setSelectedAbonnement] = useState<Abonnement | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: "",
    duree_jours: "",
    actif: true,
  })
  const [isClientsDialogOpen, setIsClientsDialogOpen] = useState(false)
  const [clientsAbonnes, setClientsAbonnes] = useState<any[]>([])
  const [selectedAbonnementId, setSelectedAbonnementId] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadAbonnements()
  }, [])

  const loadAbonnements = async () => {
    try {
      const response = await apiClient.getAbonnements()
      console.log("API abonnements", response)
      setAbonnements([...(response.results || response)])
    } catch (error) {
      console.error("Erreur lors du chargement des abonnements:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAbonnement = async () => {
    try {
      const data = {
        ...formData,
        prix: Number.parseFloat(formData.prix),
        duree_jours: Number.parseInt(formData.duree_jours),
      }
      await apiClient.createAbonnement(data)
      setIsCreateDialogOpen(false)
      resetForm()
      loadAbonnements()
      toast({
        title: "Ajout réussi",
        description: "L'abonnement a été ajouté.",
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

  const handleUpdateAbonnement = async () => {
    if (!selectedAbonnement) return

    try {
      const data = {
        ...formData,
        prix: Number.parseFloat(formData.prix),
        duree_jours: Number.parseInt(formData.duree_jours),
      }
      await apiClient.updateAbonnement(selectedAbonnement.id, data)
      setIsEditDialogOpen(false)
      resetForm()
      loadAbonnements()
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

  const handleDeleteAbonnement = async (id: number) => {
      try {
        await apiClient.deleteAbonnement(id)
      setAbonnements(prev => {
        const newList = prev.filter(a => a.id !== id)
        console.log('Liste abonnements après suppression:', newList)
        return newList
      })
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

  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      prix: "",
      duree_jours: "",
      actif: true,
    })
    setSelectedAbonnement(null)
  }

  const openEditDialog = (abonnement: Abonnement) => {
    setSelectedAbonnement(abonnement)
    setFormData({
      nom: abonnement.nom,
      description: abonnement.description,
      prix: abonnement.prix.toString(),
      duree_jours: abonnement.duree_jours.toString(),
      actif: abonnement.actif,
    })
    setIsEditDialogOpen(true)
  }

  const handleShowClients = async (abonnementId: number) => {
    setSelectedAbonnementId(abonnementId)
    setIsClientsDialogOpen(true)
    try {
      const response = await apiClient.getClientsAbonnes(abonnementId)
      setClientsAbonnes(response)
    } catch (error) {
      setClientsAbonnes([])
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des Abonnements</CardTitle>
            <CardDescription>Créez et gérez les différents types d'abonnements</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAbonnements} title="Actualiser la liste">
              <RotateCcw className="h-4 w-4" />
            </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel abonnement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel abonnement</DialogTitle>
                <DialogDescription>Ajoutez un nouveau type d'abonnement à votre salle</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de l'abonnement</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Abonnement Mensuel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez les avantages de cet abonnement..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prix">Prix (FCFA)</Label>
                    <Input
                      id="prix"
                      type="number"
                      value={formData.prix}
                      onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duree">Durée (jours)</Label>
                    <Input
                      id="duree"
                      type="number"
                      value={formData.duree_jours}
                      onChange={(e) => setFormData({ ...formData, duree_jours: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="actif"
                    checked={formData.actif}
                    onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                  />
                  <Label htmlFor="actif">Abonnement actif</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateAbonnement}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abonnements.map((abonnement) => (
              <TableRow key={abonnement.id}>
                <TableCell className="font-medium">{abonnement.nom}</TableCell>
                <TableCell className="max-w-xs truncate">{abonnement.description}</TableCell>
                <TableCell>{abonnement.prix.toLocaleString()} FCFA</TableCell>
                <TableCell>{abonnement.duree_jours} jours</TableCell>
                <TableCell>
                  <Badge className={abonnement.actif ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {abonnement.actif ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(abonnement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ConfirmDeleteButton onDelete={() => handleDeleteAbonnement(abonnement.id)}>
                        <span className="flex items-center"><Trash2 className="h-4 w-4" /></span>
                      </ConfirmDeleteButton>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShowClients(abonnement.id)}>
                      <Users className="h-4 w-4" />
                      Voir les clients
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'abonnement</DialogTitle>
              <DialogDescription>Modifiez les informations de l'abonnement</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom de l'abonnement</Label>
                <Input
                  id="edit-nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-prix">Prix (FCFA)</Label>
                  <Input
                    id="edit-prix"
                    type="number"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duree">Durée (jours)</Label>
                  <Input
                    id="edit-duree"
                    type="number"
                    value={formData.duree_jours}
                    onChange={(e) => setFormData({ ...formData, duree_jours: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-actif"
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                />
                <Label htmlFor="edit-actif">Abonnement actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateAbonnement}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isClientsDialogOpen} onOpenChange={setIsClientsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Clients abonnés</DialogTitle>
              <DialogDescription>Liste des clients pour cet abonnement</DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Jours restants</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsAbonnes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Aucun client abonné</TableCell>
                    </TableRow>
                  ) : (
                    clientsAbonnes.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.nom}</TableCell>
                        <TableCell>{client.prenom}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.telephone}</TableCell>
                        <TableCell>{client.date_paiement ? new Date(client.date_paiement).toLocaleDateString("fr-FR") : "-"}</TableCell>
                        <TableCell>{client.date_fin ? new Date(client.date_fin).toLocaleDateString("fr-FR") : "-"}</TableCell>
                        <TableCell>{client.jours_restants ?? "-"}</TableCell>
                        <TableCell>{client.montant?.toLocaleString() ?? "-"} FCFA</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsClientsDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
