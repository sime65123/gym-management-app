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
import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, User, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

interface Presence {
  id: number
  personnel?: {
    id: number
    nom: string
    prenom: string
    categorie: string
  }
  employe?: {
    id: number
    nom: string
    prenom: string
    email: string
  }
  statut: "PRESENT" | "ABSENT"
  heure_arrivee: string
  date_jour: string
}

export function PresenceManagement() {
  const [presences, setPresences] = useState<Presence[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPresence, setSelectedPresence] = useState<Presence | null>(null)
  const [personnel, setPersonnel] = useState<any[]>([])
  const [selectedPersonnel, setSelectedPersonnel] = useState<string>("")
  const [presenceType, setPresenceType] = useState<"personnel" | "employe">("personnel")
  const [formData, setFormData] = useState({
    date_jour: new Date().toISOString().split("T")[0],
    statut: "PRESENT" as "PRESENT" | "ABSENT",
    heure_arrivee: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadPresences()
    loadPersonnel()
  }, [])

  const loadPresences = async () => {
    try {
      const response = await apiClient.getPresences()
      console.log("API presences", response)
      setPresences([...(response.results || response)])
    } catch (error) {
      console.error("Erreur lors du chargement des présences:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPersonnel = async () => {
    try {
      const response = await apiClient.getPersonnel()
      setPersonnel(response.results || response)
    } catch (error) {
      setPersonnel([])
    }
  }

  const handleCreatePresence = async () => {
    try {
      await apiClient.createPresence(formData)
      setIsCreateDialogOpen(false)
      resetForm()
      loadPresences()
      toast({
        title: "Ajout réussi",
        description: "La présence a été ajoutée.",
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

  const handleUpdatePresence = async () => {
    if (!selectedPresence) return
    try {
      const data = { ...formData }
      if (data.statut === "ABSENT") {
        delete data.heure_arrivee
      }
      await apiClient.updatePresence(selectedPresence.id, data)
      setIsEditDialogOpen(false)
      resetForm()
      loadPresences()
      toast({
        title: "Modification réussie",
        description: "La présence a été modifiée.",
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

  const handleDeletePresence = async (id: number) => {
      try {
        await apiClient.deletePresence(id)
      setLoading(true)
      await loadPresences()
      toast({
        title: "Suppression réussie",
        description: "La présence a été supprimée.",
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
      date_jour: new Date().toISOString().split("T")[0],
      statut: "PRESENT",
      heure_arrivee: "",
    })
    setSelectedPersonnel("")
    setSelectedPresence(null)
    setPresenceType("personnel")
  }

  const openEditDialog = (presence: Presence) => {
    setSelectedPresence(presence)
    setFormData({
      date_jour: presence.date_jour,
      statut: presence.statut,
      heure_arrivee: presence.heure_arrivee,
    })
    setIsEditDialogOpen(true)
  }

  const getPresenceStats = () => {
    const today = new Date().toISOString().split("T")[0]
    const todayPresences = presences.filter((p) => p.date_jour === today)
    const presentToday = todayPresences.filter((p) => p.statut === "PRESENT").length
    const totalToday = todayPresences.length

    return { presentToday, totalToday }
  }

  const { presentToday, totalToday } = getPresenceStats()

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-2" />
              Présents Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presentToday}</div>
            <p className="text-green-100 mt-2">employés présents</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-6 w-6 mr-2" />
              Total Équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalToday}</div>
            <p className="text-blue-100 mt-2">employés au total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-6 w-6 mr-2" />
              Taux de Présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0}%
            </div>
            <p className="text-purple-100 mt-2">aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des Présences</CardTitle>
              <CardDescription>Enregistrez et suivez la présence du personnel et des employés</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadPresences} title="Actualiser la liste">
                <RotateCcw className="h-4 w-4" />
              </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Marquer Présence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer une présence</DialogTitle>
                    <DialogDescription>Marquez la présence d'un membre du personnel ou votre propre présence</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                      <Label>Type de présence</Label>
                      <Tabs value={presenceType} onValueChange={(value: any) => setPresenceType(value)}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="personnel">Personnel</TabsTrigger>
                          <TabsTrigger value="employe">Ma présence</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    
                    {presenceType === "personnel" && (
                      <div className="space-y-2">
                        <Label htmlFor="personnel">Personnel</Label>
                        <Select value={selectedPersonnel} onValueChange={setSelectedPersonnel}>
                          <SelectTrigger id="personnel">
                            <SelectValue placeholder="Sélectionnez un membre du personnel" />
                          </SelectTrigger>
                          <SelectContent>
                            {personnel.map((person) => (
                              <SelectItem key={person.id} value={person.id.toString()}>
                                {person.prenom} {person.nom} ({person.categorie})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_jour">Date</Label>
                    <Input
                        id="date_jour"
                      type="date"
                        value={formData.date_jour}
                        onChange={(e) => setFormData({ ...formData, date_jour: e.target.value })}
                    />
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="statut">Statut</Label>
                      <Select
                        value={formData.statut}
                        onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT">Présent</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                    {formData.statut === "PRESENT" && (
                  <div className="space-y-2">
                        <Label htmlFor="heure_arrivee">Heure d'arrivée</Label>
                        <Input
                          id="heure_arrivee"
                          type="time"
                          value={formData.heure_arrivee}
                          onChange={(e) => setFormData({ ...formData, heure_arrivee: e.target.value })}
                    />
                  </div>
                    )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                    <Button onClick={handleCreatePresence} disabled={presenceType === "personnel" && !selectedPersonnel}>
                      Enregistrer
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
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Heure d'arrivée</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presences.map((presence) => (
                <TableRow key={presence.id}>
                  <TableCell className="font-medium">
                    {presence.personnel ? (
                      <>
                        <User className="h-4 w-4 mr-2 inline" />
                        {presence.personnel.prenom} {presence.personnel.nom}
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 mr-2 inline" />
                        {presence.employe?.prenom} {presence.employe?.nom}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {presence.personnel ? "Personnel" : "Employé"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(presence.date_jour).toLocaleDateString("fr-FR")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={presence.statut === "PRESENT" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {presence.statut === "PRESENT" ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Présent
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Absent
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{presence.heure_arrivee || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(presence)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ConfirmDeleteButton onDelete={() => handleDeletePresence(presence.id)}>
                          <span className="flex items-center"><Trash2 className="h-4 w-4" /></span>
                        </ConfirmDeleteButton>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {presences.length === 0 && <div className="text-center py-8 text-gray-500">Aucune présence enregistrée</div>}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier la présence</DialogTitle>
                <DialogDescription>Modifiez les informations de présence</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date_jour">Date</Label>
                  <Input
                    id="edit-date_jour"
                    type="date"
                    value={formData.date_jour}
                    onChange={(e) => setFormData({ ...formData, date_jour: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENT">Présent</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.statut === "PRESENT" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-heure_arrivee">Heure d'arrivée</Label>
                    <Input
                      id="edit-heure_arrivee"
                      type="time"
                      value={formData.heure_arrivee}
                      onChange={(e) => setFormData({ ...formData, heure_arrivee: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpdatePresence}>Sauvegarder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
