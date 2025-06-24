"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Edit, Trash2, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Personnel {
  id: number
  nom: string
  prenom: string
  date_emploi: string
  categorie: "COACH" | "MENAGE" | "AIDE_SOIGNANT" | "AUTRE"
}

export function PersonnelManagement({ onReload }: { onReload?: () => void }) {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    date_emploi: "",
    categorie: "COACH" as "COACH" | "MENAGE" | "AIDE_SOIGNANT" | "AUTRE",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadPersonnel()
  }, [])

  const loadPersonnel = async () => {
    try {
      const response = await apiClient.getPersonnel()
      console.log("API personnel", response)
      setPersonnel([...(response.results || response)])
    } catch (error) {
      console.error("Erreur lors du chargement du personnel:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePersonnel = async () => {
    try {
      await apiClient.createPersonnel(formData)
      setIsCreateDialogOpen(false)
      resetForm()
      loadPersonnel()
      toast({
        title: "Ajout réussi",
        description: "Le membre du personnel a été ajouté.",
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

  const handleUpdatePersonnel = async () => {
    if (!selectedPersonnel) return

    try {
      await apiClient.updatePersonnel(selectedPersonnel.id, formData)
      setIsEditDialogOpen(false)
      resetForm()
      loadPersonnel()
      toast({
        title: "Modification réussie",
        description: "Le membre du personnel a été modifié.",
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

  const handleDeletePersonnel = async (id: number) => {
    try {
      await apiClient.deletePersonnel(id)
      setPersonnel(prev => {
        const newList = prev.filter(p => p.id !== id)
        console.log('Liste personnel après suppression:', newList)
        return newList
      })
      toast({
        title: "Suppression réussie",
        description: "Le membre du personnel a été supprimé.",
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
      prenom: "",
      date_emploi: "",
      categorie: "COACH",
    })
    setSelectedPersonnel(null)
  }

  const openEditDialog = (personnel: Personnel) => {
    setSelectedPersonnel(personnel)
    setFormData({
      nom: personnel.nom,
      prenom: personnel.prenom,
      date_emploi: personnel.date_emploi,
      categorie: personnel.categorie,
    })
    setIsEditDialogOpen(true)
  }

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case "COACH":
        return "Coach"
      case "MENAGE":
        return "Ménage"
      case "AIDE_SOIGNANT":
        return "Aide-soignant"
      case "AUTRE":
        return "Autre"
      default:
        return categorie
    }
  }

  const getCategorieBadgeColor = (categorie: string) => {
    switch (categorie) {
      case "COACH":
        return "bg-blue-100 text-blue-800"
      case "MENAGE":
        return "bg-green-100 text-green-800"
      case "AIDE_SOIGNANT":
        return "bg-purple-100 text-purple-800"
      case "AUTRE":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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
            <CardTitle>Gestion du Personnel</CardTitle>
            <CardDescription>Gérez les membres du personnel (coach, ménagère, aide-soignant, etc.)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPersonnel} title="Actualiser la liste">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau personnel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un membre du personnel</DialogTitle>
                  <DialogDescription>Créez un nouveau membre du personnel</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom</Label>
                      <Input
                        id="prenom"
                        value={formData.prenom}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        placeholder="Prénom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        placeholder="Nom"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_emploi">Date d'emploi</Label>
                    <Input
                      id="date_emploi"
                      type="date"
                      value={formData.date_emploi}
                      onChange={(e) => setFormData({ ...formData, date_emploi: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie</Label>
                    <Select
                      value={formData.categorie}
                      onValueChange={(value: any) => setFormData({ ...formData, categorie: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COACH">Coach</SelectItem>
                        <SelectItem value="MENAGE">Ménage</SelectItem>
                        <SelectItem value="AIDE_SOIGNANT">Aide-soignant</SelectItem>
                        <SelectItem value="AUTRE">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreatePersonnel}>Créer</Button>
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
              <TableHead>Nom complet</TableHead>
              <TableHead>Date d'emploi</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personnel.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="font-medium">
                  {person.prenom} {person.nom}
                </TableCell>
                <TableCell>{new Date(person.date_emploi).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell>
                  <Badge className={getCategorieBadgeColor(person.categorie)}>
                    {getCategorieLabel(person.categorie)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(person)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ConfirmDeleteButton onDelete={() => handleDeletePersonnel(person.id)}>
                        <span className="flex items-center"><Trash2 className="h-4 w-4" /></span>
                      </ConfirmDeleteButton>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {personnel.length === 0 && (
          <div className="text-center py-8 text-gray-500">Aucun membre du personnel enregistré</div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le personnel</DialogTitle>
              <DialogDescription>Modifiez les informations du membre du personnel</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-prenom">Prénom</Label>
                  <Input
                    id="edit-prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nom">Nom</Label>
                  <Input
                    id="edit-nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date_emploi">Date d'emploi</Label>
                <Input
                  id="edit-date_emploi"
                  type="date"
                  value={formData.date_emploi}
                  onChange={(e) => setFormData({ ...formData, date_emploi: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categorie">Catégorie</Label>
                <Select
                  value={formData.categorie}
                  onValueChange={(value: any) => setFormData({ ...formData, categorie: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COACH">Coach</SelectItem>
                    <SelectItem value="MENAGE">Ménage</SelectItem>
                    <SelectItem value="AIDE_SOIGNANT">Aide-soignant</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdatePersonnel}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 