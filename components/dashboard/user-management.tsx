"use client"

import { useState, useEffect } from "react"
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
import { Plus, Edit, Trash2, Search, RotateCcw } from "lucide-react"
import { apiClient, type User } from "@/lib/api"
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

export function UserManagement({ onReload }: { onReload?: () => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
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
      setLoading(true)
      const response = await apiClient.getUsers()
      console.log("API users", response)
      // Vérifier si la réponse contient une propriété 'results' (pagination) ou est directement le tableau
      const usersArray = (response as any)?.results || (Array.isArray(response) ? response : [])
      setUsers(usersArray)
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
      setUsers([])
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      console.log("Tentative de création d'utilisateur avec les données:", formData)
      const response = await apiClient.createUser(formData)
      console.log("Réponse de l'API:", response)
      
      setIsCreateDialogOpen(false)
      resetForm()
      await loadUsers()
      
      toast({
        title: "Ajout réussi",
        description: "L'utilisateur a été ajouté avec succès.",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("Erreur lors de la création de l'utilisateur:", error)
      
      let errorMessage = "L'ajout a échoué. Veuillez réessayer."
      
      if (error.response) {
        // Si l'erreur vient de l'API avec une réponse
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData)
        } catch (e) {
          // Si la réponse n'est pas du JSON
          errorMessage = `Erreur ${error.response.status}: ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Message plus long pour permettre la lecture
      })
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
      loadUsers()
      toast({
        title: "Modification réussie",
        description: "L'utilisateur a été modifié.",
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

  const handleDeleteUser = async (id: number): Promise<void> => {
    try {
      await apiClient.deleteUser(id)
      // Mise à jour de l'état local
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      throw error
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
    setSelectedUser(null)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone || "",
      role: user.role,
      password: "",
    })
    setIsEditDialogOpen(true)
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
                <DialogDescription>Ajoutez un nouveau membre à votre équipe ou un client</DialogDescription>
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
                    onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
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
        {/* Filters */}
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="ADMIN">Administrateurs</SelectItem>
              <SelectItem value="EMPLOYE">Employés</SelectItem>
              <SelectItem value="CLIENT">Clients</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.prenom} {user.nom}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.telephone || "-"}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <ConfirmDeleteButton onDelete={() => handleDeleteUser(user.id)}>
                      <span className="flex items-center text-red-600 hover:text-red-800">
                        <Trash2 className="h-5 w-5" />
                      </span>
                    </ConfirmDeleteButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
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
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="EMPLOYE">Employé</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Laissez vide pour ne pas changer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateUser}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
