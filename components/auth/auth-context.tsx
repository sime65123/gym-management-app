"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient, type User } from "@/lib/api"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (userData: any) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    console.log('Vérification du statut d\'authentification...')
    try {
      const token = localStorage.getItem("access_token")
      console.log('Token trouvé dans le localStorage:', !!token)
      
      if (token) {
        console.log('Tentative de récupération du profil utilisateur...')
        const userData = await apiClient.getProfile()
        console.log('Profil utilisateur récupéré avec succès:', userData)
        setUser(userData)
        
        // Vérifier si nous sommes sur la page d'accueil et rediriger vers le tableau de bord si nécessaire
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          console.log('Redirection vers /dashboard depuis la page d\'accueil')
          router.push('/dashboard')
        }
      } else {
        console.log('Aucun token trouvé - Déconnexion...')
        // Si pas de token, on déconnecte proprement
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          console.log('Redirection vers la page d\'accueil')
          router.push('/')
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        console.log('Redirection vers la page d\'accueil suite à une erreur')
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<User> => {
    console.log('Tentative de connexion avec email:', email);
    
    // S'assurer que les anciens tokens sont supprimés
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    
    // Valider les entrées
    if (!email || !password) {
      throw new Error('Veuillez fournir un email et un mot de passe');
    }
    
    try {
      console.log('Appel à apiClient.login...');
      const loginStartTime = Date.now();
      
      // 1. Effectuer la connexion pour obtenir les tokens
      const loginResponse = await apiClient.login({ email, password });
      console.log('Connexion réussie en', Date.now() - loginStartTime, 'ms');
      
      // 2. Récupérer les informations du profil
      console.log('Récupération du profil utilisateur...');
      const userData = await apiClient.getProfile();
      
      console.log('Profil utilisateur récupéré avec succès:', {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        nom: userData.nom,
        prenom: userData.prenom
      });
      
      // 3. Mettre à jour l'état utilisateur
      setUser(userData);
      
      // 4. Vérifier si l'utilisateur a le bon rôle
      if (userData.role !== 'CLIENT') {
        console.warn('L\'utilisateur connecté n\'a pas le rôle CLIENT:', userData.role);
      }
      
      // 5. Rediriger vers le tableau de bord
      console.log('Redirection vers /dashboard');
      router.push("/dashboard");
      
      // 6. Retourner les données utilisateur pour une utilisation ultérieure
      return userData;
      
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      
      // Nettoyer les tokens en cas d'erreur
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      
      // Vérifier si c'est une erreur réseau
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      // Relancer l'erreur avec un message plus convivial si nécessaire
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Une erreur inattendue est survenue lors de la connexion');
      }
    }
  }

  const register = async (userData: any) => {
    try {
      await apiClient.register(userData)
      // Auto-login après inscription
      await login(userData.email, userData.password)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
    router.push("/")
  }

  const refreshUser = async () => {
    try {
      const userData = await apiClient.getProfile()
      setUser(userData)
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du profil:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
