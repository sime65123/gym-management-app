"use client"

import type React from "react"

import { useAuth } from "./auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("ADMIN" | "EMPLOYE" | "CLIENT")[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return;
    
    console.log('ProtectedRoute - Vérification de l\'authentification et des rôles');
    console.log('Utilisateur:', user);
    console.log('Rôles autorisés:', allowedRoles);
    
    if (!user) {
      console.log('Aucun utilisateur connecté - Redirection vers /');
      router.push("/");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log(`Rôle non autorisé: ${user.role} - Redirection vers /unauthorized`);
      router.push("/unauthorized");
      return;
    }
    
    console.log('Accès autorisé pour le rôle:', user.role);
  }, [user, loading, allowedRoles, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
