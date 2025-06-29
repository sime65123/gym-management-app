"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Phone, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export function ProfileManagement() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  console.log('USER PROFILE:', user)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Vérifier que les mots de passe correspondent si un nouveau est fourni
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError("Les nouveaux mots de passe ne correspondent pas")
          return
        }
        if (formData.newPassword.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères")
          return
        }
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
      }

      // Si un nouveau mot de passe est fourni, on l'ajoute
      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword
        // Si on change de mot de passe, on doit fournir l'ancien
        if (formData.currentPassword) {
          updateData.currentPassword = formData.currentPassword
        }
      }

      console.log('Données envoyées pour la mise à jour:', updateData)
      
      // Appel à l'API pour mettre à jour le profil
      const updatedUser = await apiClient.updateProfile(updateData)
      console.log('Profil mis à jour avec succès:', updatedUser)
      
      // Mettre à jour l'utilisateur dans le contexte d'authentification
      await refreshUser()
      
      // Mettre à jour le formulaire avec les nouvelles données
      setFormData({
        ...formData,
        nom: updatedUser.nom || formData.nom,
        prenom: updatedUser.prenom || formData.prenom,
        email: updatedUser.email || formData.email,
        telephone: updatedUser.telephone || formData.telephone,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      
      // Afficher le toast de succès
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
        duration: 5000,
      })
      
      // Mettre à jour le message de succès local
      setSuccess("Profil mis à jour avec succès")
      
      // Cacher le message de succès après 5 secondes
      setTimeout(() => setSuccess(""), 5000)
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      
      // Gestion des erreurs plus détaillée
      let errorMessage = "Erreur lors de la mise à jour du profil"
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response) {
        // Si c'est une réponse d'erreur de l'API
        const apiError = error.response.data
        if (apiError.detail) {
          errorMessage = apiError.detail
        } else if (apiError.non_field_errors) {
          errorMessage = apiError.non_field_errors.join(", ")
        } else {
          // Essayer d'extraire les erreurs de validation
          const validationErrors = Object.values(apiError)
            .flat()
            .join(", ")
          if (validationErrors) {
            errorMessage = validationErrors
          }
        }
      }
      
      setError(errorMessage)
      
      // Cacher le message d'erreur après 10 secondes
      setTimeout(() => setError(""), 10000)
      
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = () => {
    if (!user) return "U"
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur"
      case "EMPLOYE":
        return "Employé"
      case "CLIENT":
        return "Client"
      default:
        return role
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {user.prenom} {user.nom}
                {user.personnel && typeof user.personnel === 'object' && (
                  <span className="ml-2 text-sm text-gray-500">
                    {/* Affichage détaillé si jamais user.personnel existe */}
                    {user.personnel.prenom} {user.personnel.nom} ({user.personnel.categorie})
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-lg">
                {getRoleLabel(user.role)} • {user.email}
              </CardDescription>
              {user.role === "CLIENT" && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Solde du compte: </span>
                  <span className="font-semibold text-green-600">{user.solde?.toLocaleString() || 0} FCFA</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Modifier mes informations</CardTitle>
          <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telephone"
                    type="tel"
                    className="pl-10"
                    placeholder="+225 XX XX XX XX"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Changer le mot de passe
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Laissez vide si vous ne voulez pas changer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Nouveau mot de passe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirmer le mot de passe"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Mise à jour..." : "Mettre à jour le profil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
