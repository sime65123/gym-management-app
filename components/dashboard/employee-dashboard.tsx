"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, CheckCircle, Clock } from "lucide-react"
import { apiClient, type User } from "@/lib/api"
import { SeanceManagement } from "./seance-management"
import { PresenceManagement } from "./presence-management"
import { ReservationManagement } from "./reservation-management"
import { AbonnementManagement } from "./abonnement-management"
import { ChargeManagement } from "./charge-management"

interface EmployeeDashboardProps {
  user: User
}

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [stats, setStats] = useState({
    totalReservations: 0,
    todayReservations: 0,
    totalSeances: 0,
    myPresenceToday: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployeeData()
  }, [])

  const loadEmployeeData = async () => {
    try {
      const [reservationsData, seancesData, presencesData] = await Promise.all([
        apiClient.getReservations(),
        apiClient.getSeances(),
        apiClient.getPresences(),
      ])

      const today = new Date().toISOString().split("T")[0]
      const todayReservations =
        reservationsData.results?.filter(
          (r: any) => new Date(r.seance.date_heure).toISOString().split("T")[0] === today,
        ).length || 0

      const myPresenceToday =
        presencesData.results?.some(
          (p: any) => p.date === today && p.employe === `${user.prenom} ${user.nom}` && p.present,
        ) || false

      setStats({
        totalReservations: reservationsData.results?.length || 0,
        todayReservations,
        totalSeances: seancesData.results?.length || 0,
        myPresenceToday,
      })
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">
            Bonjour, {user.prenom} {user.nom}!
          </CardTitle>
          <CardDescription className="text-green-100">
            Tableau de bord employé - Gérez les séances et réservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Statut du jour</p>
              <p className="text-2xl font-bold">{stats.myPresenceToday ? "✅ Présent" : "❌ Non marqué"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Rôle</p>
              <p className="text-xl font-semibold">Employé</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalReservations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todayReservations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Séances Programmées</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalSeances}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ma Présence</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.myPresenceToday ? "text-green-600" : "text-red-600"}`}>
              {stats.myPresenceToday ? "Présent" : "Absent"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="seances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="seances">Séances</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
          <TabsTrigger value="presence">Ma Présence</TabsTrigger>
          <TabsTrigger value="abonnements">Abonnements</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
        </TabsList>

        <TabsContent value="seances">
          <SeanceManagement />
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationManagement />
        </TabsContent>

        <TabsContent value="presence">
          <PresenceManagement />
        </TabsContent>

        <TabsContent value="abonnements">
          <AbonnementManagement />
        </TabsContent>

        <TabsContent value="charges">
          <ChargeManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
