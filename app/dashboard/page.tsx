"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Zap, LogOut, Settings, User, Menu, X } from "lucide-react"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard"
import { ClientDashboard } from "@/components/dashboard/client-dashboard"
import { useAuth } from "@/components/auth/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ProfileManagement } from "@/components/dashboard/profile-management"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const adminDashboardRef = useRef<{ refreshUsers: () => void }>(null)

  const getUserInitials = (user: any) => {
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

  // Fonction pour rafraîchir la liste des utilisateurs
  const handleProfileUpdate = () => {
    if (adminDashboardRef.current) {
      adminDashboardRef.current.refreshUsers()
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 rounded-full overflow-hidden shadow-md border-2 border-white">
                    <img 
                      src="/lg1.jpg" 
                      alt="Logo GYM ZONE" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">GYM ZONE</h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {user && (
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user ? getUserInitials(user) : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    {user && (
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.prenom} {user.nom}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {user?.role === "ADMIN" && <AdminDashboard ref={adminDashboardRef} />}
          {user?.role === "EMPLOYE" && <EmployeeDashboard user={user} />}
          {user?.role === "CLIENT" && <ClientDashboard user={user} />}
        </main>
      </div>
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion du Profil</DialogTitle>
          </DialogHeader>
          <ProfileManagement onUpdate={handleProfileUpdate} />
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
