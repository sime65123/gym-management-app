"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveTabs } from "@/components/ui/responsive-tabs"
import { Users, Calendar, CheckCircle, Clock } from "lucide-react"
import { apiClient, type User } from "@/lib/api"
import { SeanceManagement } from "./seance-management"
import { PresenceManagement } from "./presence-management"
import { ReservationManagement } from "./reservation-management"
import { AbonnementManagement } from "./abonnement-management"
import { ChargeManagement } from "./charge-management"
import { PaymentManagement } from "./payment-management"
import { AbonnementClientManagement } from "./abonnement-client-management"

interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

interface Reservation {
  id: number;
  statut: string;
  montant: number | string;
  created_at?: string;
  [key: string]: any;
}

interface Seance {
  id: number;
  [key: string]: any;
}

interface Presence {
  id: number;
  date_jour?: string;
  date?: string;
  employe?: { id: number; nom: string; prenom: string } | string;
  employe_id?: number;
  statut: string;
  [key: string]: any;
}

interface Paiement {
  id: number;
  [key: string]: any;
}

interface EmployeeDashboardProps {
  user: User
}

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam || 'seances'
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
      // Initialiser les données par défaut avec le bon typage
      let reservationsData: Reservation[] = [];
      let seancesData: Seance[] = [];
      let presencesData: Presence[] = [];
      let paiementsData: Paiement[] = [];
      
      try {
        // Essayer de charger les données en parallèle
        const responses = await Promise.allSettled([
          apiClient.getReservations(),
          apiClient.getSeances(),
          apiClient.getPresences(),
          apiClient.getPaiements(),
        ]);
        
        // Fonction utilitaire pour traiter les réponses
        function processResponse<T>(response: PromiseSettledResult<any>, errorMessage: string): T[] {
          if (response.status === 'rejected') {
            console.error(errorMessage, response.reason);
            return [];
          }
          const data = response.value;
          // Vérifier si c'est une réponse paginée
          return data && 'results' in data ? data.results : Array.isArray(data) ? data : [];
        }
        
        // Extraire et traiter chaque jeu de données
        reservationsData = processResponse<Reservation>(responses[0], 'Erreur lors du chargement des réservations:');
        seancesData = processResponse<Seance>(responses[1], 'Erreur lors du chargement des séances:');
        presencesData = processResponse<Presence>(responses[2], 'Erreur lors du chargement des présences:');
        paiementsData = processResponse<Paiement>(responses[3], 'Erreur lors du chargement des paiements:');
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }

      // Extraire les résultats si nécessaire (pour les réponses paginées)
      if (reservationsData && 'results' in reservationsData) {
        reservationsData = (reservationsData as unknown as ApiResponse<Reservation>).results || [];
      } else if (!Array.isArray(reservationsData)) {
        reservationsData = [];
      }
      
      if (seancesData && 'results' in seancesData) {
        seancesData = (seancesData as unknown as ApiResponse<Seance>).results || [];
      } else if (!Array.isArray(seancesData)) {
        seancesData = [];
      }
      
      if (presencesData && 'results' in presencesData) {
        presencesData = (presencesData as unknown as ApiResponse<Presence>).results || [];
      } else if (!Array.isArray(presencesData)) {
        presencesData = [];
      }
      
      if (paiementsData && 'results' in paiementsData) {
        paiementsData = (paiementsData as unknown as ApiResponse<Paiement>).results || [];
      } else if (!Array.isArray(paiementsData)) {
        paiementsData = [];
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
      <ResponsiveTabs 
        defaultValue={defaultTab}
        tabs={[
          {
            value: "seances",
            label: "Séances",
            content: <SeanceManagement />
          },
          {
            value: "reservations",
            label: "Réservations",
            content: <ReservationManagement />
          },
          {
            value: "presence",
            label: "Ma Présence",
            content: <PresenceManagement />
          },
          {
            value: "abonnements",
            label: "Abonnements",
            content: <AbonnementManagement />
          },
          {
            value: "abonnement-client",
            label: "Abonnements clients",
            content: <AbonnementClientManagement />
          },
          {
            value: "charges",
            label: "Charges",
            content: <ChargeManagement />
          }
        ]}
        tabListClassName="justify-start"
        tabTriggerClassName="px-4 py-2"
      />
    </div>
  )
}
