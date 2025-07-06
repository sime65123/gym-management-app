"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface ProfileManagementProps {
  onUpdate?: () => void;
}

export function ProfileManagement({ onUpdate }: ProfileManagementProps) {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  console.log('USER PROFILE:', user)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Mettre à jour le formulaire lorsque l'utilisateur change
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "",
        // Ne pas réinitialiser les champs de mot de passe
      }))
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validation des mots de passe
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          setError("Le mot de passe actuel est requis pour modifier le mot de passe")
          setLoading(false)
          return
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          setError("Les nouveaux mots de passe ne correspondent pas")
          setLoading(false)
          return
        }
        
        if (formData.newPassword.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères")
          setLoading(false)
          return
        }
        
        // Vérifier que le nouveau mot de passe est différent de l'ancien
        if (formData.newPassword === formData.currentPassword) {
          setError("Le nouveau mot de passe doit être différent de l'ancien")
          setLoading(false)
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
        updateData.currentPassword = formData.currentPassword
      }

      console.log('Données envoyées pour la mise à jour:', updateData)
      
      // Appel à l'API pour mettre à jour le profil
      const updatedUser = await apiClient.updateProfile(updateData)
      console.log('Profil mis à jour avec succès:', updatedUser)
      
      // Mettre à jour l'utilisateur dans le contexte d'authentification
      await refreshUser()
      
      // Appeler la fonction de rappel pour mettre à jour la liste des utilisateurs
      if (onUpdate) {
        onUpdate();
      }
      
      // Mettre à jour le formulaire avec les nouvelles données
      const updatedFormData = {
        ...formData,
        nom: updatedUser.nom || formData.nom,
        prenom: updatedUser.prenom || formData.prenom,
        email: updatedUser.email || formData.email,
        telephone: updatedUser.telephone || formData.telephone,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }
      
      setFormData(updatedFormData)
      
      // Afficher le toast de succès
      toast({
        title: "Profil mis à jour",
        description: formData.newPassword 
          ? "Vos informations et votre mot de passe ont été mis à jour avec succès."
          : "Vos informations ont été mises à jour avec succès.",
        duration: 5000,
      })
      
      // Mettre à jour le message de succès local
      setSuccess(formData.newPassword 
        ? "Profil et mot de passe mis à jour avec succès"
        : "Profil mis à jour avec succès"
      )
      
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
        } else if (apiError.errors) {
          // Gérer les erreurs de validation du backend
          if (typeof apiError.errors === 'object') {
            const errorMessages = [];
            for (const [field, errors] of Object.entries(apiError.errors)) {
              if (Array.isArray(errors)) {
                errorMessages.push(`${field}: ${errors.join(', ')}`);
              } else {
                errorMessages.push(`${field}: ${errors}`);
              }
            }
            errorMessage = errorMessages.join('\n');
          } else {
            errorMessage = String(apiError.errors);
          }
        } else {
          // Essayer d'extraire les erreurs de validation
          const validationErrors = Object.values(apiError)
            .flat()
            .join(", ")
          if (validationErrors) {
            errorMessage = validationErrors
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Essayer d'extraire un message d'erreur d'un objet
        errorMessage = error.toString();
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

  const resetPasswordFields = () => {
    setFormData(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }))
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
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-3">
                  <strong>Note :</strong> Pour changer votre mot de passe, vous devez fournir votre mot de passe actuel.
                </p>
                <p className="text-xs text-blue-600">
                  Si vous avez oublié votre mot de passe, contactez un administrateur.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    Mot de passe actuel
                    {formData.newPassword && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, currentPassword: e.target.value })
                      // Effacer l'erreur si l'utilisateur commence à corriger
                      if (error && error.includes('current_password')) {
                        setError("")
                      }
                    }}
                    placeholder="Entrez votre mot de passe actuel"
                    className={formData.newPassword && !formData.currentPassword ? "border-red-300" : ""}
                  />
                  {formData.newPassword && !formData.currentPassword && (
                    <p className="text-sm text-red-500">Le mot de passe actuel est requis pour modifier le mot de passe</p>
                  )}
                  {error && error.includes('current_password') && (
                    <p className="text-sm text-red-500">
                      <strong>Erreur :</strong> Le mot de passe actuel saisi est incorrect. 
                      Vérifiez votre saisie ou contactez un administrateur si vous avez oublié votre mot de passe.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Nouveau mot de passe (min. 8 caractères)"
                      className={formData.newPassword && formData.newPassword.length < 8 ? "border-red-300" : ""}
                    />
                    {formData.newPassword && formData.newPassword.length < 8 && (
                      <p className="text-sm text-red-500">Le mot de passe doit contenir au moins 8 caractères</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirmer le mot de passe"
                      className={formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? "border-red-300" : ""}
                    />
                    {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                      <p className="text-sm text-red-500">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                </div>
                
                {formData.newPassword && formData.currentPassword && formData.newPassword === formData.currentPassword && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Attention :</strong> Le nouveau mot de passe doit être différent de l'ancien.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Mise à jour..." : "Mettre à jour le profil"}
              </Button>
              
              {(formData.currentPassword || formData.newPassword || formData.confirmPassword) && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetPasswordFields}
                  className="w-full sm:w-auto"
                >
                  Annuler la modification du mot de passe
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

