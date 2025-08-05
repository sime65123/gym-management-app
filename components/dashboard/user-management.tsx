"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Edit, Trash2, Search, RotateCcw, Calendar } from "lucide-react"
import { apiClient, type User, type Reservation } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"

type UserRole = "ADMIN" | "EMPLOYE" | "CLIENT"

interface FormData {
  email: string
  nom: string
  prenom: string
  telephone: string
  role: UserRole
  password?: string
}

interface UserManagementProps {
  onReload?: () => void;
}

const UserManagement = forwardRef<{ loadUsers: () => Promise<void> }, UserManagementProps>(({ onReload }, ref) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isReservationsDialogOpen, setIsReservationsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedClientReservations, setSelectedClientReservations] = useState<any>(null)
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    role: "CLIENT",
    password: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers() as User[] | { results: User[] };
      
      // Normalisation de la réponse
      const usersArray = (() => {
        if (Array.isArray(response)) return response;
        if (response && 'results' in response && Array.isArray(response.results)) {
          return response.results;
        }
        console.error("Format de réponse inattendu pour les utilisateurs:", response);
        toast({
          title: "Erreur de format",
          description: "Le format des données reçues est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
        return [];
      })();
      
      setUsers(usersArray);
      
      if (onReload) {
        onReload();
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      
      let errorMessage = "Impossible de charger la liste des utilisateurs";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à accéder à ces données.";
        } else if (status === 500) {
          errorMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        } else if (data?.detail) {
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

  const handleCreateUser = async () => {
    try {
      if (!formData.password) {
        toast({
          title: "Champ manquant",
          description: "Le mot de passe est obligatoire pour créer un utilisateur.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      const userData = await apiClient.createUser(formData);
      
      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${formData.email} a été créé avec succès.`,
        duration: 5000,
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      
      let errorMessage = "Impossible de créer l'utilisateur";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 400 && data?.email) {
          errorMessage = `L'adresse email ${formData.email} est déjà utilisée.`;
        } else if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à créer un utilisateur.";
        } else if (status === 422) {
          errorMessage = "Les données fournies sont invalides.";
        } else if (data?.detail) {
          errorMessage = data.detail;
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      await apiClient.updateUser(selectedUser.id, updateData)
      setIsEditDialogOpen(false)
      resetForm()
      await loadUsers()
      toast({
        title: "Succès",
        description: "L'utilisateur a été mis à jour avec succès.",
      })
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      
      let errorMessage = "Impossible de mettre à jour l'utilisateur";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 400 && data?.email) {
          errorMessage = `L'adresse email est déjà utilisée.`;
        } else if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à modifier cet utilisateur.";
        } else if (status === 404) {
          errorMessage = "Utilisateur introuvable. Il a peut-être été supprimé.";
        } else if (status === 422) {
          errorMessage = "Les données fournies sont invalides.";
        } else if (data?.detail) {
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
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      await apiClient.deleteUser(id)
      await loadUsers()
      toast({
        title: "Succès",
        description: "L'utilisateur a été supprimé avec succès.",
      })
    } catch (error: any) {
      console.error("Error deleting user:", error)
      
      let errorMessage = "Impossible de supprimer l'utilisateur";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à supprimer cet utilisateur.";
        } else if (status === 404) {
          errorMessage = "Utilisateur introuvable. Il a peut-être été supprimé.";
        } else if (data?.detail) {
          errorMessage = data.detail;
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      nom: "",
      prenom: "",
      telephone: "",
      role: "CLIENT",
      password: "",
    })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      nom: user.nom || "",
      prenom: user.prenom || "",
      telephone: user.telephone || "",
      role: user.role as UserRole,
      password: "",
    })
    setIsEditDialogOpen(true)
  }

  const openReservationsDialog = async (user: User) => {
    console.log('Ouverture du dialogue des réservations pour l\'utilisateur:', user.id, user.nom, user.prenom)
    
    // Vérifier que l'utilisateur est un client
    if (user.role !== 'CLIENT') {
      toast({
        title: "Information",
        description: "Seuls les clients peuvent avoir des réservations",
        variant: "default",
      });
      return;
    }
    
    setSelectedUser(user)
    setLoadingReservations(true)
    
    try {
      console.log('Appel à apiClient.getUserReservations...')
      const response = await apiClient.getUserReservations(user.id)
      console.log('Réponse de getUserReservations:', response)
      
      if (!response || !response.reservations) {
        console.error('Format de réponse inattendu:', response)
        throw new Error('Format de réponse inattendu')
      }
      
      // Filtrer pour ne garder que les réservations confirmées et entièrement payées
      const confirmedAndPaidReservations = response.reservations.filter(
        (reservation: any) => {
          const isConfirmed = reservation.statut === 'CONFIRMEE';
          const isPaid = reservation.montant_total_paye && 
                        parseFloat(reservation.montant_total_paye) >= (reservation.montant || 0);
          
          return isConfirmed && isPaid;
        }
      )
      
      console.log('Réservations confirmées et payées:', confirmedAndPaidReservations)
      
      const clientReservations = {
        ...response,
        reservations: confirmedAndPaidReservations
      }
      
      console.log('Données à enregistrer dans l\'état:', clientReservations)
      setSelectedClientReservations(clientReservations)
      setIsReservationsDialogOpen(true)
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error)
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = "Impossible de charger les réservations";
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "Non autorisé à accéder à ces réservations";
        } else if (error.message.includes('403')) {
          errorMessage = "Vous n'avez pas les permissions nécessaires";
        } else if (error.message.includes('404')) {
          errorMessage = "Aucune réservation trouvée pour cet utilisateur";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingReservations(false)
    }
  }

  const filteredUsers = users.filter((user: User) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = user.nom?.toLowerCase().includes(searchLower) ||
      user.prenom?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "EMPLOYE":
        return "bg-blue-100 text-blue-800"
      case "CLIENT":
        return "bg-green-100 text-green-800"
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
            <CardTitle>Gestion des Utilisateurs</CardTitle>
            <CardDescription>Gérez les comptes administrateurs, employés et clients</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadUsers} title="Actualiser la liste">
              <RotateCcw className="h-4 w-4" />
            </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>Ajoutez un nouveau membre à votre équipe ou un nouveau client</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  >
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="EMPLOYE">Employé</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateUser}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="ADMIN">Administrateurs</SelectItem>
              <SelectItem value="EMPLOYE">Employés</SelectItem>
              <SelectItem value="CLIENT">Clients</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Rôle</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
              <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.prenom} {user.nom}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.telephone || "-"}</TableCell>
                <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                </TableCell>
                <TableCell>
                      <div className="flex items-center justify-start gap-0 w-full">
                        {/* Groupe d'actions spécifiques aux clients */}
                        {user.role === 'CLIENT' && (
                          <div className="flex items-center border-l border-gray-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100"
                              onClick={() => openReservationsDialog(user)}
                              disabled={loadingReservations}
                              title="Voir les réservations"
                            >
                              <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                        )}
                        
                        {/* Groupe d'actions de suppression - Uniquement pour les rôles ADMIN et EMPLOYE */}
                        {user.role !== 'CLIENT' && (
                          <div className="flex items-center border-l border-gray-200">
                            <ConfirmDeleteButton onDelete={() => handleDeleteUser(user.id)}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 p-0 flex items-center justify-center hover:bg-red-50"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </ConfirmDeleteButton>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
              )}
          </TableBody>
        </Table>
        </div>

        {/* Dialogue d'édition */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>Modifiez les informations de l'utilisateur</DialogDescription>
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
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telephone">Téléphone</Label>
                <Input
                  id="edit-telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="EMPLOYE">Employé</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateUser}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogue des réservations */}
        <Dialog open={isReservationsDialogOpen} onOpenChange={setIsReservationsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <div>
                  <DialogTitle className="text-xl">
                    Gestion des réservations
                  </DialogTitle>
                  <DialogDescription>
                    Voici la liste des réservations pour {selectedUser?.prenom} {selectedUser?.nom}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {loadingReservations ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : selectedClientReservations?.reservations?.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClientReservations.reservations.map((reservation: Reservation) => {
                      // Formater le montant avec le symbole FCFA
                      const formattedAmount = new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(reservation.montant || 0);

                      // Vérifier si le montant est payé
                      const isPaid = reservation.montant_total_paye && 
                                   parseFloat(reservation.montant_total_paye) >= (reservation.montant || 0);

                      return (
                        <TableRow key={reservation.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {reservation.nom_client || `${selectedUser?.prenom} ${selectedUser?.nom}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {reservation.type_reservation === 'SEANCE' ? 'Séance' : 'Abonnement'}
                              </span>
                              {reservation.description && (
                                <span className="text-sm text-gray-500">{reservation.description}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium">{formattedAmount}</span>
                              <Badge 
                                variant={isPaid ? 'default' : 'secondary'}
                                className={`mt-1 ${isPaid ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}`}
                              >
                                {isPaid ? 'Payé' : 'Non payé'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                reservation.statut === 'CONFIRMEE' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                  : reservation.statut === 'ANNULEE' 
                                    ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                              }`}
                            >
                              {reservation.statut}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reservation.created_at ? (
                              <div className="flex flex-col">
                                <span>
                                  {new Date(reservation.created_at).toLocaleDateString('fr-FR', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(reservation.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune réservation trouvée pour ce client.</p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsReservationsDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
})

UserManagement.displayName = 'UserManagement';

export { UserManagement }
