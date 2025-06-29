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
  const [formData, setFormData] = useState({
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
      const data = {
        ...formData,
        montant: Number.parseFloat(formData.montant),
      }
      await apiClient.createCharge(data)
      setIsCreateDialogOpen(false)
      resetForm()
      loadCharges()
      toast({
        title: "Ajout réussi",
        description: "La charge a été ajoutée.",
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
                    <Label htmlFor="titre">Titre de la charge</Label>
                    <Input
                      id="titre"
                      value={formData.titre}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      placeholder="Ex: Facture d'électricité"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="montant">Montant (FCFA)</Label>
                    <Input
                      id="montant"
                      type="number"
                      value={formData.montant}
                      onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Détails de la charge..."
                    />
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
