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
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [presenceType, setPresenceType] = useState<"personnel" | "employe">("personnel");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    date_jour: new Date().toISOString().split("T")[0],
    statut: "PRESENT" as "PRESENT" | "ABSENT",
    heure_arrivee: "12:00", // Valeur par défaut pour éviter les erreurs de champ non contrôlé
  })
  const { toast } = useToast()
  const [groupedPresences, setGroupedPresences] = useState<{[key: string]: Presence[]}>({})

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        console.log("Chargement du profil utilisateur...");
        const user = await apiClient.getProfile();
        console.log("Utilisateur chargé:", user);
        setCurrentUser(user);
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur:", error);
      }
    };

    loadPresences();
    loadPersonnel();
    loadCurrentUser();
  }, [])

  const loadPresences = async () => {
    try {
      setLoading(true);
      const allPresences = await apiClient.getPresences();
      console.log("Données des présences chargées:", allPresences);
      
      // Grouper les présences par date
      const grouped = allPresences.reduce((acc: {[key: string]: Presence[]}, presence: Presence) => {
        const date = presence.date_jour;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(presence);
        return acc;
      }, {});
      
      // Trier les dates par ordre décroissant (plus récent en premier)
      const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const sortedGrouped: {[key: string]: Presence[]} = {};
      
      sortedDates.forEach(date => {
        sortedGrouped[date] = grouped[date];
      });
      
      setGroupedPresences(sortedGrouped);
      setPresences(allPresences); // Garder la liste complète pour les stats
    } catch (error) {
      console.error("Erreur lors du chargement des présences:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les présences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPersonnel = async () => {
    try {
      type PersonnelType = {
        id: number;
        nom: string;
        prenom: string;
        categorie: string;
      };
      
      const response = await apiClient.getPersonnel() as PersonnelType[] | { results: PersonnelType[] };
      // Gérer le cas où response est déjà un tableau ou contient une propriété results
      const personnelData: PersonnelType[] = Array.isArray(response)
        ? response
        : 'results' in response
          ? response.results
          : [];
      setPersonnel(personnelData)
    } catch (error) {
      console.error('Erreur lors du chargement du personnel:', error)
      setPersonnel([])
    }
  }

  // Vérifier si une présence existe déjà pour ce jour et ce membre du personnel ou employé
  const checkExistingPresence = (id: number, date: string, type: 'personnel' | 'employe'): boolean => {
    const todayPresences = presences.filter(p => p.date_jour === date);
    return todayPresences.some(p => 
      type === 'personnel' 
        ? p.personnel?.id === id 
        : p.employe?.id === id
    );
  };

  const handleCreatePresence = async () => {
    try {
      // Vérifier que les champs requis sont remplis
      if (presenceType === "personnel" && !selectedPersonnel) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un membre du personnel",
          variant: "destructive",
        });
        return;
      }

      // Forcer la date du jour
      const today = new Date().toISOString().split("T")[0];
      
      // Vérifier côté client si une présence existe déjà
      if (presenceType === "personnel") {
        const personnelId = parseInt(selectedPersonnel);
        if (checkExistingPresence(personnelId, today, 'personnel')) {
          toast({
            title: "Erreur",
            description: "Une présence a déjà été enregistrée pour ce membre du personnel aujourd'hui",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Vérification pour l'employé connecté
        console.log("Vérification de l'utilisateur connecté:", currentUser);
        if (!currentUser) {
          console.error("Aucun utilisateur connecté détecté");
          toast({
            title: "Erreur",
            description: "Veuillez vous reconnecter pour enregistrer votre présence",
            variant: "destructive",
          });
          return;
        }
        
        if (checkExistingPresence(currentUser.id, today, 'employe')) {
          toast({
            title: "Erreur",
            description: "Vous avez déjà enregistré votre présence aujourd'hui",
            variant: "destructive",
          });
          return;
        }
      }

      // Préparer les données selon le type de présence (personnel ou employé)
      const requestData: {
        date: string;
        present: boolean;
        commentaire?: string;
        personnel_id?: number;
        employe_id?: number;
      } = {
        date: today, // Toujours utiliser la date du jour
        present: formData.statut === "PRESENT",
        commentaire: formData.statut === "PRESENT" ? `Heure d'arrivée: ${formData.heure_arrivee}` : "Absent"
      };

      // Ajouter l'ID du personnel ou de l'employé selon le type
      if (presenceType === "personnel") {
        requestData.personnel_id = parseInt(selectedPersonnel);
      } else {
        // Pour la présence de l'employé connecté
        if (!currentUser) {
          throw new Error("Utilisateur non connecté");
        }
        requestData.employe_id = currentUser.id;
      }
      
      console.log("Données envoyées à l'API:", requestData);
      try {
        const response = await apiClient.createPresence(requestData);
        toast({
          title: "Succès",
          description: "La présence a été enregistrée avec succès",
        });
      } catch (error: any) {
        console.error("Erreur lors de la création de la présence:", error);
        
        let errorMessage = "Une erreur est survenue lors de l'enregistrement de la présence";
        
        // Si le message d'erreur est déjà bien formaté
        if (error.message && error.message !== 'Bad Request') {
          errorMessage = error.message;
        }
        
        // Message spécifique pour les erreurs de doublon
        if (
          error.status === 400 && 
          (error.message.includes("existe déjà") || 
           error.message.includes("déjà enregistré") ||
           error.message.includes("déjà existant"))
        ) {
          errorMessage = presenceType === "personnel" 
            ? "Une présence a déjà été enregistrée pour ce membre du personnel aujourd'hui"
            : "Vous avez déjà enregistré votre présence aujourd'hui";
        }
        
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      setIsCreateDialogOpen(false);
      resetForm();
      loadPresences();
      toast({
        title: "Ajout réussi",
        description: "La présence a été ajoutée.",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "L'ajout a échoué.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  const handleUpdatePresence = async () => {
    if (!selectedPresence) return;
    try {
      const updateData = {
        statut: formData.statut,
        heure_arrivee: formData.heure_arrivee,
      };
      
      await apiClient.updatePresence(selectedPresence.id, updateData);
      await loadPresences();
      setIsEditDialogOpen(false);
      toast({
        title: "Modification réussie",
        description: "La présence a été modifiée.",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "La modification a échoué.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDeletePresence = async (id: number) => {
    // Supprimer directement sans confirmation
    try {
      setLoading(true);
      await apiClient.deletePresence(id);
      await loadPresences();
      toast({
        title: "Suppression réussie",
        description: "L'enregistrement de présence a été supprimé avec succès.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la présence:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'enregistrement.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date_jour: new Date().toISOString().split("T")[0],
      statut: "PRESENT",
      heure_arrivee: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
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
      heure_arrivee: presence.heure_arrivee || "12:00", // Valeur par défaut si vide
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
              <Button variant="outline" onClick={() => loadPresences()} title="Actualiser la liste">
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
                      <Label>Date</Label>
                      <div className="p-2 border rounded-md bg-gray-100 text-gray-700">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <p className="text-sm text-gray-500">Seule la date du jour est autorisée</p>
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
              {Object.keys(groupedPresences).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Aucune présence enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedPresences).map(([date, dayPresences]) => (
                  <React.Fragment key={`date-group-${date}`}>
                    {/* Séparateur de date */}
                    <TableRow key={`date-${date}`} className="bg-gray-50">
                      <TableCell colSpan={6} className="text-center font-semibold text-gray-700 py-3">
                        <div className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Jour {new Date(date).toLocaleDateString("fr-FR")}
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Présences du jour */}
                    {dayPresences.map((presence) => (
                      <TableRow key={`presence-${presence.id}`}>
                        <TableCell className="font-medium">
                          {presence.personnel ? (
                            <span key={`personnel-${presence.id}`}>
                              <User className="h-4 w-4 mr-2 inline" />
                              {presence.personnel.prenom} {presence.personnel.nom}
                            </span>
                          ) : (
                            <span key={`employe-${presence.id}`}>
                              <User className="h-4 w-4 mr-2 inline" />
                              {presence.employe?.prenom} {presence.employe?.nom}
                            </span>
                          )}
                        </TableCell>
                        <TableCell key={`type-${presence.id}`}>
                          <Badge variant="outline">
                            {presence.personnel ? "Personnel" : "Employé"}
                          </Badge>
                        </TableCell>
                        <TableCell key={`date-cell-${presence.id}`}>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(presence.date_jour).toLocaleDateString("fr-FR")}
                          </div>
                        </TableCell>
                        <TableCell key={`status-${presence.id}`}>
                          <Badge className={presence.statut === "PRESENT" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {presence.statut === "PRESENT" ? (
                              <span key={`present-${presence.id}`}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Présent
                              </span>
                            ) : (
                              <span key={`absent-${presence.id}`}>
                                <XCircle className="h-3 w-3 mr-1" />
                                Absent
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell key={`time-${presence.id}`}>
                          {presence.heure_arrivee || "-"}
                        </TableCell>
                        <TableCell key={`actions-${presence.id}`}>
                          <div className="flex gap-2">
                            <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPresence(presence);
                            setFormData({
                              date_jour: presence.date_jour,
                              statut: presence.statut,
                              heure_arrivee: presence.heure_arrivee || ""
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeletePresence(presence.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>

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
