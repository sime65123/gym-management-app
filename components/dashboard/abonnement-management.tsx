"use client"

import React, { useState, useEffect } from "react"
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
import { useAuth } from "@/components/auth/auth-context"

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
  const { user } = useAuth()

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === "ADMIN"
  const isEmployee = user?.role === "EMPLOYE"

  useEffect(() => {
    loadAbonnements()
  }, [])

  const loadAbonnements = async (): Promise<void> => {
    try {
      const response = await apiClient.getAbonnements() as { results?: Abonnement[] } | Abonnement[]
      console.log("API abonnements", response)
      const abonnements = Array.isArray(response) ? response : response.results || []
      setAbonnements(abonnements)
    } catch (error) {
      console.error("Erreur lors du chargement des abonnements:", error)
      setAbonnements([])
    } finally {
      setLoading(false)
    }
  }

  // Déplacer la déclaration de resetForm avant son utilisation
  const resetForm = (): void => {
    setFormData({
      nom: "",
      description: "",
      prix: "",
      duree_jours: "",
      actif: true,
    });
    setSelectedAbonnement(null);
  };

  const handleCreateAbonnement = async (): Promise<void> => {
    try {
      // Validation des champs obligatoires
      if (!formData.nom.trim()) {
        throw new Error("Le nom de l'abonnement est requis");
      }
      
      // Vérifier que le prix est un nombre valide
      const prix = Number(formData.prix);
      if (isNaN(prix) || prix <= 0) {
        throw new Error("Le prix doit être un nombre positif");
      }
      
      // Vérifier que la durée est un nombre valide
      const dureeJours = Number(formData.duree_jours);
      if (isNaN(dureeJours) || dureeJours <= 0) {
        throw new Error("La durée doit être un nombre de jours valide (supérieur à 0)");
      }
      
      const data = {
        ...formData,
        prix: Number(formData.prix) || 0,
        duree_jours: dureeJours,
      };
      
      console.log("Données envoyées à l'API:", data);
      await apiClient.createAbonnement(data);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadAbonnements();
      
      toast({
        title: "✅ Ajout réussi",
        description: `L'abonnement "${data.nom}" a été créé avec succès.`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Erreur lors de la création de l'abonnement:", error);
      
      // Récupérer le message d'erreur
      let errorMessage = "Une erreur est survenue lors de la création de l'abonnement.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      }
      
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    }
  }

  const handleUpdateAbonnement = async (): Promise<void> => {
    if (!selectedAbonnement) return;

    try {
      // Validation des champs obligatoires
      if (!formData.nom.trim()) {
        throw new Error("Le nom de l'abonnement est requis");
      }
      
      // Vérifier que le prix est un nombre valide
      const prix = Number(formData.prix);
      if (isNaN(prix) || prix <= 0) {
        throw new Error("Le prix doit être un nombre positif");
      }
      
      // Vérifier que la durée est un nombre valide
      const dureeJours = Number(formData.duree_jours);
      if (isNaN(dureeJours) || dureeJours <= 0) {
        throw new Error("La durée doit être un nombre de jours valide (supérieur à 0)");
      }
      
      const data = {
        ...formData,
        prix: Number(formData.prix) || 0,
        duree_jours: dureeJours,
      };
      
      console.log("Données mises à jour envoyées à l'API:", data);
      await apiClient.updateAbonnement(selectedAbonnement.id, data);
      setIsEditDialogOpen(false);
      resetForm();
      await loadAbonnements();
      
      toast({
        title: "✅ Modification réussie",
        description: `L'abonnement "${data.nom}" a été mis à jour avec succès.`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'abonnement:", error);
      
      // Récupérer le message d'erreur
      let errorMessage = "Une erreur est survenue lors de la mise à jour de l'abonnement.";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      }
      
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleDeleteAbonnement = async (id: number): Promise<{ success: boolean }> => {
    try {
      const result = await apiClient.deleteAbonnement(id);
      
      if (result && result.success !== false) {
        // Mettre à jour la liste locale après la suppression
        setAbonnements(prev => prev.filter(a => a.id !== id));
        // Appeler la fonction de rechargement si fournie
        if (onReload) onReload();
        
        // Afficher un message de succès
        toast({
          title: "Succès",
          description: "L'abonnement a été supprimé avec succès.",
          duration: 3000,
        });
        
        return { success: true };
      } else {
        throw new Error("Échec de la suppression de l'abonnement");
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'abonnement:', error);
      throw error; // Propage l'erreur pour que ConfirmDeleteButton puisse l'afficher
    }
  }

  const openEditDialog = (abonnement: Abonnement): void => {
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

  const handleShowClients = async (abonnementId: number): Promise<void> => {
    setSelectedAbonnementId(abonnementId)
    setIsClientsDialogOpen(true)
    try {
      const response = await apiClient.getClientsAbonnes(abonnementId) as any[]
      setClientsAbonnes(response || [])
    } catch (error) {
      console.error("Erreur lors du chargement des clients abonnés:", error)
      setClientsAbonnes([])
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  // Fonction utilitaire pour gérer la soumission du formulaire
  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (selectedAbonnement) {
      handleUpdateAbonnement();
    } else {
      handleCreateAbonnement();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Type d'abonnements</CardTitle>
            <CardDescription>
              {isAdmin 
                ? "Créez et gérez les différents types d'abonnements" 
                : "Consultez les différents types d'abonnements disponibles"
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAbonnements} title="Actualiser la liste">
              <RotateCcw className="h-4 w-4" />
            </Button>
            {isAdmin && (
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
            )}
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
              {isAdmin && <TableHead>Actions</TableHead>}
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
                {isAdmin && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(abonnement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ConfirmDeleteButton onDelete={async () => {
                        await handleDeleteAbonnement(abonnement.id);
                        return Promise.resolve();
                      }}>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmDeleteButton>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog - Seulement pour les admins */}
        {isAdmin && (
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
        )}
      </CardContent>
    </Card>
  );
}
