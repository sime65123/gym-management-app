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
import { Plus, Edit, Trash2, RotateCcw, X } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Personnel {
  id: number
  nom: string
  prenom: string
  date_emploi: string
  categorie: "COACH" | "MENAGE" | "AIDE_SOIGNANT" | "AUTRE"
  created_at?: string
  updated_at?: string
}

export function PersonnelManagement({ onReload }: { onReload?: () => void }) {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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
      setLoading(true);
      const response = await apiClient.getPersonnel() as { results?: Personnel[] } | Personnel[];
      console.log("Données du personnel chargées:", response);
      
      // Gérer les différents formats de réponse
      if (response && typeof response === 'object' && 'results' in response) {
        setPersonnel(Array.isArray(response.results) ? response.results : []);
      } 
      // Si c'est directement un tableau
      else if (Array.isArray(response)) {
        setPersonnel(response);
      } else {
        console.error("Format de réponse inattendu:", response);
        setPersonnel([]);
        toast({
          title: "Erreur de format",
          description: "Le format des données reçues est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement du personnel:", error);
      
      let errorMessage = "Échec du chargement du personnel";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à accéder à ces données. Veuillez vous reconnecter.";
        } else if (status === 500) {
          errorMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        } else if (data && data.detail) {
          errorMessage = data.detail;
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
    } finally {
      setLoading(false);
    }
  }

  const handleCreatePersonnel = async () => {
    try {
      if (!formData.nom || !formData.prenom || !formData.date_emploi) {
        throw new Error("Tous les champs sont obligatoires")
      }

      const personnelData = {
        ...formData,
        date_emploi: formData.date_emploi ? new Date(formData.date_emploi).toISOString().split('T')[0] : ''
      }
      
      const response = await apiClient.createPersonnel(personnelData)
      console.log("Réponse de l'API:", response)
      
      setIsCreateDialogOpen(false)
      resetForm()
      loadPersonnel()
      
      toast({
        title: "Ajout réussi",
        description: "Le membre du personnel a été ajouté avec succès.",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du personnel:", error)
      
      let errorMessage = "L'ajout a échoué."
      
      if (error.errors) {
        const errorMessages = Object.entries(error.errors)
          .map(([field, messages]) => {
            const fieldName = field === 'date_emploi' ? 'Date d\'emploi' : 
                            field === 'prenom' ? 'Prénom' : 
                            field === 'nom' ? 'Nom' : field;
            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          })
          .join('\n');
        errorMessage = `Erreurs de validation :\n${errorMessages}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleUpdatePersonnel = async () => {
    if (!selectedPersonnel) return
    
    try {
      const response = await apiClient.updatePersonnel(selectedPersonnel.id, {
        ...formData,
        date_emploi: formData.date_emploi ? new Date(formData.date_emploi).toISOString().split('T')[0] : ''
      })
      
      setIsEditDialogOpen(false)
      loadPersonnel()
      
      toast({
        title: "Mise à jour réussie",
        description: "Les informations du membre du personnel ont été mises à jour.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Erreur lors de la mise à jour du personnel:", error)
      
      toast({
        title: "Erreur",
        description: "La mise à jour a échoué. Veuillez réessayer.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDeletePersonnel = async (id: number) => {
    try {
      // Effectuer la suppression
      await apiClient.deletePersonnel(id)
      
      // Recharger la liste du personnel
      await loadPersonnel()
      
      // Le message de succès est géré par le composant ConfirmDeleteButton
    } catch (error: any) {
      console.error("Erreur lors de la suppression du membre du personnel:", error)
      throw error // Propage l'erreur pour que ConfirmDeleteButton puisse l'afficher
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

  const openEditDialog = (person: Personnel) => {
    setSelectedPersonnel(person)
    setFormData({
      nom: person.nom,
      prenom: person.prenom,
      date_emploi: person.date_emploi.split('T')[0],
      categorie: person.categorie,
    })
    setIsEditDialogOpen(true)
  }

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case 'COACH':
        return 'Coach'
      case 'MENAGE':
        return 'Ménage'
      case 'AIDE_SOIGNANT':
        return 'Aide-soignant'
      case 'AUTRE':
        return 'Autre'
      default:
        return categorie
    }
  }

  const getCategorieBadgeColor = (categorie: string) => {
    switch (categorie) {
      case 'COACH':
        return 'bg-blue-100 text-blue-800'
      case 'MENAGE':
        return 'bg-green-100 text-green-800'
      case 'AIDE_SOIGNANT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Filtrer le personnel en fonction du terme de recherche
  const filteredPersonnel = personnel.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion du Personnel</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les membres du personnel (coach, ménagère, aide-soignant, etc.)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input
              placeholder="Rechercher par nom ou prénom..."
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
          <Button variant="outline" size="icon" onClick={loadPersonnel} title="Actualiser">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau personnel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un membre du personnel</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour ajouter un nouveau membre du personnel.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_emploi">Date d'emploi</Label>
                  <Input
                    id="date_emploi"
                    type="date"
                    value={formData.date_emploi}
                    onChange={(e) => setFormData({...formData, date_emploi: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.categorie}
                    onValueChange={(value: "COACH" | "MENAGE" | "AIDE_SOIGNANT" | "AUTRE") => 
                      setFormData({...formData, categorie: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
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
                <Button onClick={handleCreatePersonnel}>
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Date d'emploi</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm 
                      ? "Aucun membre du personnel ne correspond à votre recherche" 
                      : "Aucun membre du personnel trouvé"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersonnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>{person.nom}</TableCell>
                    <TableCell>{person.prenom}</TableCell>
                    <TableCell>{new Date(person.date_emploi).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Badge className={getCategorieBadgeColor(person.categorie)}>
                        {getCategorieLabel(person.categorie)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(person)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <ConfirmDeleteButton
                          onDelete={() => handleDeletePersonnel(person.id)}
                          confirmMessage={`Êtes-vous sûr de vouloir supprimer ${person.prenom} ${person.nom} ?`}
                          successMessage={`${person.prenom} ${person.nom} a été supprimé(e) avec succès.`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ConfirmDeleteButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogue d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le membre du personnel</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {selectedPersonnel?.prenom} {selectedPersonnel?.nom}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prenom">Prénom</Label>
                <Input
                  id="edit-prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom</Label>
                <Input
                  id="edit-nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date_emploi">Date d'emploi</Label>
              <Input
                id="edit-date_emploi"
                type="date"
                value={formData.date_emploi}
                onChange={(e) => setFormData({...formData, date_emploi: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.categorie}
                onValueChange={(value: "COACH" | "MENAGE" | "AIDE_SOIGNANT" | "AUTRE") => 
                  setFormData({...formData, categorie: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
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
            <Button onClick={handleUpdatePersonnel}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
