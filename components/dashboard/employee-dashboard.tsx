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
import { PaymentManagement } from "./payment-management"
import { AbonnementClientManagement } from "./abonnement-client-management"

interface EmployeeDashboardProps {
  user: User
}

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [stats, setStats] = useState({
    totalReservations: 0,
    todayReservations: 0,
    totalSeances: 0,
    myPresenceToday: false,
    paiementsEnAttente: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployeeData()
  }, [])

  const loadEmployeeData = async () => {
    try {
      // Initialiser les données par défaut
      let reservationsData: any[] = []
      let seancesData: any[] = []
      let presencesData: any[] = []
      let paiementsData: any[] = []
      
      try {
        // Essayer de charger les données en parallèle
        const results = await Promise.allSettled([
          apiClient.getReservations(),
          apiClient.getSeances(),
          apiClient.getPresences(),
          apiClient.getPaiements(),
        ])
        
        // Traiter chaque résultat
        if (results[0].status === 'fulfilled') {
          reservationsData = results[0].value as any[]
        } else {
          console.error('Erreur lors du chargement des réservations:', results[0].reason)
        }
        
        if (results[1].status === 'fulfilled') {
          seancesData = results[1].value as any[]
        } else {
          console.error('Erreur lors du chargement des séances:', results[1].reason)
        }
        
        if (results[2].status === 'fulfilled') {
          presencesData = results[2].value as any[]
        } else {
          console.error('Erreur lors du chargement des présences:', results[2].reason)
        }
        
        if (results[3].status === 'fulfilled') {
          paiementsData = results[3].value as any[]
        } else {
          console.error('Erreur lors du chargement des paiements:', results[3].reason)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }

      if (!Array.isArray(reservationsData) && reservationsData && Array.isArray(reservationsData.results)) {
        reservationsData = reservationsData.results;
      }
      if (!Array.isArray(seancesData) && seancesData && Array.isArray(seancesData.results)) {
        seancesData = seancesData.results;
      }
      if (!Array.isArray(presencesData) && presencesData && Array.isArray(presencesData.results)) {
        presencesData = presencesData.results;
      }
      if (!Array.isArray(paiementsData) && paiementsData && Array.isArray(paiementsData.results)) {
        paiementsData = paiementsData.results;
      }

      const today = new Date().toISOString().split("T")[0]
      
      // Somme des montants des réservations validées (statut CONFIRMEE)
      const reservationsValidees = reservationsData.filter(
        (r: any) => r.statut === 'CONFIRMEE'
      ).reduce((sum: number, r: any) => {
        const montant = typeof r.montant === 'string' ? parseFloat(r.montant) : (r.montant || 0)
        return sum + montant
      }, 0) || 0

      // Somme des montants des réservations effectuées aujourd'hui par les clients
      const reservationsAujourdhui = reservationsData.filter(
        (r: any) => {
          const reservationDate = r.created_at ? new Date(r.created_at).toISOString().split("T")[0] : null
          return reservationDate === today
        }
      ).reduce((sum: number, r: any) => {
        const montant = typeof r.montant === 'string' ? parseFloat(r.montant) : (r.montant || 0)
        return sum + montant
      }, 0) || 0

      // Ma présence aujourd'hui
      const myPresenceToday = presencesData.some(
        (p: any) => {
          const presenceDate = p.date_jour || p.date
          return presenceDate === today && 
                 p.employe && 
                 (p.employe.id === user.id || 
                  p.employe === `${user.prenom} ${user.nom}` || 
                  p.employe_id === user.id) && 
                 p.statut === "PRESENT"
        }
      ) || false

      // Somme des montants des réservations en attente (non confirmées)
      const reservationsEnAttente = reservationsData.filter(
        (r: any) => r.statut === 'EN_ATTENTE'
      ).reduce((sum: number, r: any) => {
        const montant = typeof r.montant === 'string' ? parseFloat(r.montant) : (r.montant || 0)
        return sum + montant
      }, 0) || 0

      setStats({
        totalReservations: reservationsValidees,
        todayReservations: reservationsAujourdhui,
        totalSeances: seancesData.length || 0,
        myPresenceToday,
        paiementsEnAttente: reservationsEnAttente,
      })
    } catch (error) {
      console.error("Erreur inattendue lors du chargement des données:", error)
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
            Tableau de bord employé - Gérez les paiements, séances et réservations
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Totalement Validées</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalReservations.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todayReservations.toLocaleString()} FCFA</div>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations en Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.paiementsEnAttente.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="seances" className="space-y-4">
        <TabsList className="flex w-full">
          <TabsTrigger className="flex-1" value="seances">Séances</TabsTrigger>
          <TabsTrigger className="flex-1" value="reservations">Réservations</TabsTrigger>
          <TabsTrigger className="flex-1" value="presence">Ma Présence</TabsTrigger>
          <TabsTrigger className="flex-1" value="abonnements">Abonnements</TabsTrigger>
          <TabsTrigger className="flex-1" value="abonnement-client">Abonnement client</TabsTrigger>
          <TabsTrigger className="flex-1" value="charges">Charges</TabsTrigger>
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

        <TabsContent value="abonnement-client">
          <AbonnementClientManagement />
        </TabsContent>

        <TabsContent value="charges">
          <ChargeManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
