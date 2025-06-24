"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient, type User } from "@/lib/api"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
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
    try {
      const token = localStorage.getItem("access_token")
      if (token) {
        const userData = await apiClient.getProfile()
        setUser(userData)
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      await apiClient.login({ email, password })
      const userData = await apiClient.getProfile()
      setUser(userData)
      router.push("/dashboard")
    } catch (error) {
      throw error
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
