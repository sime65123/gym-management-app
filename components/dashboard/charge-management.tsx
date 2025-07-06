"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Eye, Calendar, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Charge {
  id: number
  titre: string
  montant: number
  date: string
  description: string
}

export function ChargeManagement({ onReload }: { onReload?: () => void }) {
  const [charges, setCharges] = useState<Charge[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null)
  interface FormData {
    titre: string;
    montant: number | "";
    date: string;
    description: string;
  }

  const [formData, setFormData] = useState<FormData>({
    titre: "",
    montant: "",
    date: "",
    description: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadCharges()
  }, [])

  const loadCharges = async () => {
    try {
      const response = await apiClient.getCharges() as { results?: Charge[] } | Charge[]
      console.log("API charges", response)
      
      // Vérifier si la réponse est un objet avec une propriété results
      if (response && typeof response === 'object' && 'results' in response) {
        setCharges(Array.isArray(response.results) ? response.results : [])
      } 
      // Si c'est directement un tableau
      else if (Array.isArray(response)) {
        setCharges(response)
      } else {
        console.error("Format de réponse inattendu:", response)
        setCharges([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des charges:", error)
      setCharges([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCharge = async () => {
    try {
      // Vérifier que tous les champs requis sont remplis
      if (!formData.titre || formData.montant === "" || !formData.date) {
        toast({
          title: "Champs manquants",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      // Préparer les données pour l'API
      const data = {
        titre: formData.titre.trim(),
        montant: Number(formData.montant),
        date: formData.date,
        description: formData.description ? formData.description.trim() : "",
      };
      
      console.log('Données formatées pour l\'API:', JSON.stringify(data, null, 2));
      
      console.log('Données envoyées à l\'API:', data);
      
      const response = await apiClient.createCharge(data);
      console.log('Réponse de l\'API:', response);
      
      setIsCreateDialogOpen(false);
      resetForm();
      loadCharges();
      
      // Appeler onReload si fourni (pour rafraîchir le tableau de bord)
      if (onReload) onReload();
      
      toast({
        title: "Ajout réussi",
        description: "La charge a été ajoutée avec succès.",
        duration: 5000,
      })
    } catch (error: any) {
      console.error('Erreur lors de la création de la charge:', error);
      
      // Extraire le message d'erreur de différentes manières selon le format de l'erreur
      let errorMessage = "Une erreur est survenue lors de l'ajout de la charge.";
      
      if (error.response) {
        // Erreur avec une réponse HTTP
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 400 && data) {
          // Erreurs de validation
          if (typeof data === 'object') {
            const errorMessages = Object.entries(data)
              .map(([field, errors]) => {
                if (Array.isArray(errors)) {
                  return `${field}: ${errors.join(', ')}`;
                }
                return `${field}: ${errors}`;
              })
              .join('\n');
            errorMessage = `Erreur de validation :\n${errorMessages}`;
          } else if (typeof data === 'string') {
            errorMessage = data;
          }
        } else if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à effectuer cette action. Veuillez vous reconnecter.";
        } else if (status === 500) {
          errorMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Aucune réponse du serveur:', error.request);
        errorMessage = "Le serveur ne répond pas. Vérifiez votre connexion Internet et réessayez.";
      } else if (error.message) {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('Erreur de configuration de la requête:', error.message);
        errorMessage = `Erreur de configuration : ${error.message}`;
      } else if (error.data) {
        // Erreur personnalisée avec des données
        errorMessage = error.data.detail || error.data.message || JSON.stringify(error.data);
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Augmenter la durée pour permettre la lecture
      });
    }
  }





  const resetForm = () => {
    setFormData({
      titre: "",
      montant: "",
      date: "",
      description: "",
    })
    setSelectedCharge(null)
  }

  const openViewDialog = (charge: Charge) => {
    setSelectedCharge(charge)
    setViewDialogOpen(true)
  }

  // Calcul du total des charges en additionnant tous les montants
  const totalCharges = charges.reduce((sum, charge) => {
    // S'assurer que le montant est bien un nombre
    const montant = Number(charge.montant) || 0
    return sum + montant
  }, 0)

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">💰</span>
            Total des Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalCharges.toLocaleString()} FCFA</div>
          <p className="text-red-100 mt-2">
            {charges.length} charge{charges.length > 1 ? "s" : ""} enregistrée{charges.length > 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des Charges</CardTitle>
              <CardDescription>Enregistrez et suivez les dépenses de votre salle de sport</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadCharges} title="Actualiser la liste">
                <RotateCcw className="h-4 w-4" />
              </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle charge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer une nouvelle charge</DialogTitle>
                  <DialogDescription>Ajoutez une nouvelle dépense à votre comptabilité</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="titre">
                      Titre de la charge <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="titre"
                      value={formData.titre}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      placeholder="Ex: Facture d'électricité"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="montant">
                      Montant (FCFA) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="montant"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.montant}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permettre la chaîne vide ou un nombre valide
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setFormData({ 
                            ...formData, 
                            montant: value === "" ? "" : Number(value) 
                          });
                        }
                      }}
                      placeholder="50000"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Détails supplémentaires sur cette charge..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateCharge}>Enregistrer</Button>
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
                <TableHead>Titre</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell className="font-medium">{charge.titre}</TableCell>
                  <TableCell className="text-red-600 font-semibold">
                    {charge.montant.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(charge.date).toLocaleDateString("fr-FR")}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{charge.description}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openViewDialog(charge)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {charges.length === 0 && <div className="text-center py-8 text-gray-500">Aucune charge enregistrée</div>}

          {/* View Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Détails de la charge</DialogTitle>
                <DialogDescription>Informations complètes sur la charge</DialogDescription>
              </DialogHeader>
              {selectedCharge && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Titre</h4>
                    <p className="text-sm">{selectedCharge.titre}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Montant</h4>
                    <p className="text-lg font-semibold text-red-600">
                      {selectedCharge.montant.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Date</h4>
                    <p className="text-sm">
                      {new Date(selectedCharge.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm whitespace-pre-line">
                      {selectedCharge.description || 'Aucune description fournie'}
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
