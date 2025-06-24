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
import { Plus, Edit, Trash2, Calendar, Users, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Seance {
  id: number
  titre: string
  description: string
  date_heure: string
  coach: {
    id: number
    nom: string
    prenom: string
    categorie: string
  } | null
  capacite: number
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
    titre: "",
    description: "",
    date_heure: "",
    coach: "",
    capacite: "",
  })
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [selectedSeanceId, setSelectedSeanceId] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadSeances()
    loadCoachs()
  }, [])

  const loadSeances = async () => {
    try {
      const response = await apiClient.getSeances()
      console.log("API seances", response)
      setSeances([...(response.results || response)])
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
        titre: formData.titre,
        description: formData.description,
        date_heure: formData.date_heure,
        coach_id: formData.coach ? Number.parseInt(formData.coach) : null,
        capacite: Number.parseInt(formData.capacite),
      }
      await apiClient.createSeance(data)
      setIsCreateDialogOpen(false)
      resetForm()
      loadSeances()
      toast({
        title: "Ajout réussi",
        description: "La séance a été ajoutée.",
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
        titre: formData.titre,
        description: formData.description,
        date_heure: formData.date_heure,
        coach_id: formData.coach ? Number.parseInt(formData.coach) : null,
        capacite: Number.parseInt(formData.capacite),
      }
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
      titre: "",
      description: "",
      date_heure: "",
      coach: "",
      capacite: "",
    })
    setSelectedSeance(null)
  }

  const openEditDialog = (seance: Seance) => {
    setSelectedSeance(seance)
    // Format date for datetime-local input
    const date = new Date(seance.date_heure)
    const formattedDate = date.toISOString().slice(0, 16)

    setFormData({
      titre: seance.titre,
      description: seance.description,
      date_heure: formattedDate,
      coach: seance.coach ? seance.coach.id.toString() : "",
      capacite: seance.capacite.toString(),
    })
    setIsEditDialogOpen(true)
  }

  const handleShowParticipants = async (seanceId: number) => {
    setSelectedSeanceId(seanceId)
    setIsParticipantsDialogOpen(true)
    try {
      const response = await apiClient.getSeanceParticipants(seanceId)
      setParticipants(response)
    } catch (error) {
      setParticipants([])
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
                  <DialogDescription>Planifiez une nouvelle séance de sport</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="titre">Titre de la séance</Label>
                    <Input
                      id="titre"
                      value={formData.titre}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      placeholder="Ex: Cours de Fitness"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Décrivez la séance..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_heure">Date et heure</Label>
                      <Input
                        id="date_heure"
                        type="datetime-local"
                        value={formData.date_heure}
                        onChange={(e) => setFormData({ ...formData, date_heure: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacite">Capacité (nombre de places)</Label>
                      <Input
                        id="capacite"
                        type="number"
                        value={formData.capacite}
                        onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                        placeholder="20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coach">Coach</Label>
                    <Select value={formData.coach} onValueChange={(value) => setFormData({ ...formData, coach: value })}>
                      <SelectTrigger id="coach">
                        <SelectValue placeholder="Sélectionnez un coach" />
                      </SelectTrigger>
                      <SelectContent>
                        {coachs.map((coach) => (
                          <SelectItem key={coach.id} value={coach.id.toString()}>
                            {coach.prenom} {coach.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateSeance}>Créer</Button>
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
              <TableHead>Date & Heure</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Capacité</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seances.map((seance) => (
              <TableRow key={seance.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{seance.titre}</div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">{seance.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(seance.date_heure).toLocaleString("fr-FR")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    {(() => {
                      console.log("=== DEBUG COACH DISPLAY ===")
                      console.log("Seance:", seance)
                      console.log("Coach:", seance.coach)
                      return seance.coach ? `${seance.coach.prenom} ${seance.coach.nom}` : "-"
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    {seance.capacite} places
                  </div>
                </TableCell>
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
                    <Button variant="outline" size="sm" onClick={() => handleShowParticipants(seance.id)}>
                      <Users className="h-4 w-4" />
                      Voir les participants
                    </Button>
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
                <Label htmlFor="edit-titre">Titre de la séance</Label>
                <Input
                  id="edit-titre"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date_heure">Date et heure</Label>
                  <Input
                    id="edit-date_heure"
                    type="datetime-local"
                    value={formData.date_heure}
                    onChange={(e) => setFormData({ ...formData, date_heure: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-capacite">Capacité</Label>
                  <Input
                    id="edit-capacite"
                    type="number"
                    value={formData.capacite}
                    onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-coach">Coach</Label>
                <Select value={formData.coach} onValueChange={(value) => setFormData({ ...formData, coach: value })}>
                  <SelectTrigger id="edit-coach">
                    <SelectValue placeholder="Sélectionnez un coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coachs.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id.toString()}>
                        {coach.prenom} {coach.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateSeance}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isParticipantsDialogOpen} onOpenChange={setIsParticipantsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Participants à la séance</DialogTitle>
              <DialogDescription>Liste des clients ayant réservé cette séance</DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Date réservation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Aucun participant</TableCell>
                    </TableRow>
                  ) : (
                    participants.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.nom}</TableCell>
                        <TableCell>{client.prenom}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.telephone}</TableCell>
                        <TableCell>{client.date_reservation ? new Date(client.date_reservation).toLocaleDateString("fr-FR") : "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsParticipantsDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
