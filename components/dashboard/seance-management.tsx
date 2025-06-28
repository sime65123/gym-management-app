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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Calendar, Users, RotateCcw, Download } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Seance {
  id: number
  client_nom: string
  client_prenom: string
  date_jour: string
  nombre_heures: number
  montant_paye: number
  ticket_url?: string
}

interface Coach {
  id: number
  nom: string
  prenom: string
  categorie: string
}

export function SeanceManagement({ onReload }: { onReload?: () => void }) {
  const [seances, setSeances] = useState<Seance[]>([])
  const [coachs, setCoachs] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null)
  const [formData, setFormData] = useState({
    client_nom: "",
    client_prenom: "",
    date_jour: "",
    nombre_heures: 1,
    montant_paye: 5000,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadSeances()
    loadCoachs()
  }, [])

  const loadSeances = async () => {
    try {
      const response = await apiClient.getSeances()
      console.log("API seances response:", response)
      console.log("API seances results:", response.results || response)
      
      // Log des tickets pour chaque séance
      const seances = response.results || response
      seances.forEach((seance: any) => {
        console.log(`Séance ${seance.id}:`, {
          client: `${seance.client_prenom} ${seance.client_nom}`,
          ticket_url: seance.ticket_url,
          has_ticket: !!seance.ticket_url
        })
      })
      
      setSeances([...seances])
    } catch (error) {
      console.error("Erreur lors du chargement des séances:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCoachs = async () => {
    try {
      const response = await apiClient.getCoachs()
      setCoachs(response)
    } catch (error) {
      console.error("Erreur lors du chargement des coachs:", error)
      setCoachs([])
    }
  }

  const handleCreateSeance = async () => {
    try {
      const data = {
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        date_jour: formData.date_jour ? formData.date_jour.slice(0, 10) : '',
        nombre_heures: Number(formData.nombre_heures),
        montant_paye: Number(formData.montant_paye),
      }
      await apiClient.createSeanceDirect(data)
      setIsCreateDialogOpen(false)
      resetForm()
      loadSeances()
      toast({
        title: "Ajout réussi",
        description: "La séance a été ajoutée avec un ticket généré.",
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

  const handleUpdateSeance = async () => {
    if (!selectedSeance) return

    try {
      const data = {
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        date_jour: formData.date_jour ? formData.date_jour.slice(0, 10) : '',
        nombre_heures: Number(formData.nombre_heures),
        montant_paye: Number(formData.montant_paye),
      }
      console.log('Données envoyées pour modification:', data)
      await apiClient.updateSeance(selectedSeance.id, data)
      setIsEditDialogOpen(false)
      resetForm()
      loadSeances()
      toast({
        title: "Modification réussie",
        description: "La séance a été modifiée.",
        duration: 5000,
      })
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      toast({
        title: "Erreur",
        description: "La modification a échoué.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDeleteSeance = async (id: number) => {
      try {
        await apiClient.deleteSeance(id)
      setSeances(prev => {
        const newList = prev.filter(s => s.id !== id)
        console.log('Liste séances après suppression:', newList)
        return newList
      })
      toast({
        title: "Suppression réussie",
        description: "La séance a été supprimée.",
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
      client_nom: "",
      client_prenom: "",
      date_jour: "",
      nombre_heures: 1,
      montant_paye: 5000,
    })
    setSelectedSeance(null)
  }

  const openEditDialog = (seance: Seance) => {
    setSelectedSeance(seance)
    setFormData({
      client_nom: seance.client_nom ?? '',
      client_prenom: seance.client_prenom ?? '',
      date_jour: seance.date_jour ?? '',
      nombre_heures: seance.nombre_heures ?? 1,
      montant_paye: seance.montant_paye ?? 5000,
    })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des Séances</CardTitle>
            <CardDescription>Planifiez et gérez les séances de sport</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSeances} title="Actualiser la liste">
              <RotateCcw className="h-4 w-4" />
            </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle séance
              </Button>
            </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle séance</DialogTitle>
                <DialogDescription>Enregistrez une séance pour un client venu sur place</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client_nom">Nom</Label>
                  <Input
                    id="client_nom"
                    value={formData.client_nom ?? ''}
                    onChange={(e) => setFormData({ ...formData, client_nom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_prenom">Prénom</Label>
                  <Input
                    id="client_prenom"
                    value={formData.client_prenom ?? ''}
                    onChange={(e) => setFormData({ ...formData, client_prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_jour">Date du jour</Label>
                  <Input
                    id="date_jour"
                    type="date"
                    value={formData.date_jour ?? ''}
                    onChange={(e) => setFormData({ ...formData, date_jour: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_heures">Nombre d'heures payées</Label>
                  <Input
                    id="nombre_heures"
                    type="number"
                    min={1}
                    value={formData.nombre_heures ?? 0}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      setFormData({
                        ...formData,
                        nombre_heures: n,
                        montant_paye: n * 5000,
                      })
                    }}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montant_paye">Montant payé</Label>
                  <Input
                    id="montant_paye"
                    type="number"
                    min={5000}
                    value={formData.montant_paye ?? 0}
                    onChange={(e) => setFormData({ ...formData, montant_paye: Number(e.target.value) })}
                    placeholder="5000"
                  />
                  <p className="text-xs text-gray-500">Tarif : 5000 FCFA/heure</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateSeance} disabled={!formData.client_nom || !formData.client_prenom || !formData.nombre_heures || !formData.montant_paye}>
                  Créer
                </Button>
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
              <TableHead>Nom du client</TableHead>
              <TableHead>Prénom du client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Nombre d'heures</TableHead>
              <TableHead>Montant payé</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seances.map((seance) => (
              <TableRow key={seance.id}>
                <TableCell>{seance.client_nom || '-'}</TableCell>
                <TableCell>{seance.client_prenom || '-'}</TableCell>
                <TableCell>{seance.date_jour ? new Date(seance.date_jour).toLocaleDateString('fr-FR') : '-'}</TableCell>
                <TableCell>{seance.nombre_heures ?? '-'}</TableCell>
                <TableCell>{seance.montant_paye ?? '-'} FCFA</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(seance)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ConfirmDeleteButton onDelete={() => handleDeleteSeance(seance.id)}>
                        <span className="flex items-center"><Trash2 className="h-4 w-4" /></span>
                      </ConfirmDeleteButton>
                    </Button>
                    {seance.ticket_url && (
                      <a href={seance.ticket_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Ticket
                        </Button>
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la séance</DialogTitle>
              <DialogDescription>Modifiez les informations de la séance</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client_nom">Nom</Label>
                <Input
                  id="edit-client_nom"
                  value={formData.client_nom ?? ''}
                  onChange={(e) => setFormData({ ...formData, client_nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-client_prenom">Prénom</Label>
                <Input
                  id="edit-client_prenom"
                  value={formData.client_prenom ?? ''}
                  onChange={(e) => setFormData({ ...formData, client_prenom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date_jour">Date du jour</Label>
                <Input
                  id="edit-date_jour"
                  type="date"
                  value={formData.date_jour ?? ''}
                  onChange={(e) => setFormData({ ...formData, date_jour: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nombre_heures">Nombre d'heures payées</Label>
                <Input
                  id="edit-nombre_heures"
                  type="number"
                  min={1}
                  value={formData.nombre_heures ?? 0}
                  onChange={(e) => setFormData({ ...formData, nombre_heures: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-montant_paye">Montant payé</Label>
                <Input
                  id="edit-montant_paye"
                  type="number"
                  min={5000}
                  value={formData.montant_paye ?? 0}
                  onChange={(e) => setFormData({ ...formData, montant_paye: Number(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Tarif : 5000 FCFA/heure</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateSeance} disabled={!formData.client_nom || !formData.client_prenom || !formData.nombre_heures || !formData.montant_paye}>
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
