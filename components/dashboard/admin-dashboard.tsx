"use client"

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, Calendar, TrendingUp, FileText } from "lucide-react"
import { apiClient } from "@/lib/api"
import { UserManagement } from "./user-management"
import { PersonnelManagement } from "./personnel-management"
import { AbonnementManagement } from "./abonnement-management"
import { SeanceManagement } from "./seance-management"
import { ChargeManagement } from "./charge-management"
import FinancialReport from "./financial-report"
import { AbonnementClientManagement } from "./abonnement-client-management"
import { RapportPresence } from "./rapport-presence"

interface DashboardStats {
  total_revenue: number
  monthly_revenue: number
  total_expenses: number
  profit: number
  active_clients: number
}

interface AdminDashboardRef {
  refreshUsers: () => void;
}

const AdminDashboard = forwardRef<AdminDashboardRef>((props, ref) => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [seanceKey, setSeanceKey] = useState(0)
  const [abonnementKey, setAbonnementKey] = useState(0)
  const [personnelKey, setPersonnelKey] = useState(0)
  const [chargeKey, setChargeKey] = useState(0)
  const [userKey, setUserKey] = useState(0)
  const userManagementRef = useRef<{ loadUsers: () => void }>(null)

  // expose refreshUsers method
  useImperativeHandle(ref, () => ({
    refreshUsers: () => {
      if (userManagementRef.current) {
        userManagementRef.current.loadUsers()
      }
    }
  }))

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log("Tentative de chargement des données du tableau de bord...")
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        console.error("Aucun token d'authentification trouvé")
        throw new Error("Non authentifié. Veuillez vous connecter.")
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/financial-report/`
      console.log("URL de l'API:", apiUrl)
      
      let response
      try {
        // Afficher les informations de débogage
        console.group("=== DÉBOGAGE REQUÊTE API ===")
        console.log("URL de l'API:", apiUrl)
        console.log("Méthode: GET")
        console.log("En-têtes de la requête:", {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token ? token.substring(0, 10) + '...' : 'non défini'}`,
          "Credentials": "include"
        })
        
        console.log("Envoi de la requête...")
        const startTime = Date.now()
        
        try {
          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            credentials: 'include'
          })
        } catch (fetchError) {
          console.error("Erreur lors de l'exécution de la requête:", fetchError)
          throw fetchError
        }
        
        const endTime = Date.now()
        const responseTime = endTime - startTime
        
        console.log(`Réponse reçue en ${responseTime}ms`)
        console.log("Statut HTTP:", response.status, response.statusText)
        
        // Afficher les en-têtes de réponse
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })
        console.log("En-têtes de la réponse:", responseHeaders)
        
        // Essayer de lire le corps de la réponse
        const responseText = await response.text()
        console.log(`Corps de la réponse (${responseText.length} caractères):`, responseText)
        
        // Essayer de parser le JSON si possible
        try {
          const jsonData = responseText ? JSON.parse(responseText) : {}
          console.log("Données JSON parsées:", jsonData)
        } catch (jsonError) {
          console.log("La réponse n'est pas du JSON valide")
        }
        
        console.groupEnd()
        
        // Si la réponse n'est pas OK, on laisse le code de gestion d'erreur s'en occuper
        if (!response.ok) {
          // On clone la réponse pour pouvoir la lire à nouveau
          const responseInit: ResponseInit = {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          }
          response = new Response(responseText, responseInit)
        }
      } catch (fetchError) {
        console.error("Erreur lors de l'appel à l'API:", fetchError)
        throw new Error(`Impossible de contacter le serveur: ${fetchError instanceof Error ? fetchError.message : 'Erreur inconnue'}`)
      }
      
      console.log("Réponse du serveur:", response)
      
      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`
        console.error("Erreur de l'API:", errorMessage)
        
        // Essayer d'obtenir plus de détails sur l'erreur 500
        try {
          const responseText = await response.text()
          console.error(`Contenu brut de la réponse d'erreur (${responseText.length} caractères):`)
          console.error(responseText)
          
          // Essayer de parser comme JSON si possible
          try {
            const errorData = JSON.parse(responseText)
            console.error("Détails de l'erreur (JSON parsé):", errorData)
            errorMessage = errorData.detail || errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage
            
            // Si c'est une erreur de validation, afficher les détails
            if (errorData.detail && Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((err: any) => 
                `${err.loc ? err.loc.join('.') + ' - ' : ''}${err.msg}`
              ).join('\n')
            }
          } catch (jsonError) {
            // Si ce n'est pas du JSON, utiliser le texte brut
            console.error("La réponse n'est pas au format JSON:", jsonError)
            errorMessage = responseText || errorMessage
          }
          
          // Afficher les en-têtes de la réponse pour le débogage
          console.log("En-têtes de la réponse:", Object.fromEntries(response.headers.entries()))
          
        } catch (e) {
          console.error("Erreur lors de la lecture de la réponse d'erreur:", e)
        }
        
        // Si c'est une erreur d'authentification, déconnecter l'utilisateur
        if (response.status === 401) {
          console.warn("Session expirée ou invalide, déconnexion...")
          // Ici vous pourriez appeler une fonction de déconnexion
        }
        
        throw new Error(errorMessage)
      }
      
      // Vérifier que la réponse a bien un contenu avant de tenter de la parser
      const responseText = await response.text()
      if (!responseText) {
        console.warn("La réponse de l'API est vide")
        setStats({
          total_revenue: 0,
          monthly_revenue: 0,
          total_expenses: 0,
          profit: 0,
          active_clients: 0
        })
        return
      }
      
      // Parser manuellement la réponse pour éviter les erreurs de parsing
      let responseData: any
      try {
        responseData = JSON.parse(responseText)
        console.log("Données financières reçues:", responseData)
      } catch (e) {
        console.error("Erreur lors du parsing de la réponse JSON:", e)
        console.error("Contenu de la réponse:", responseText)
        throw new Error("Format de réponse invalide reçu du serveur")
      }
      
      // Vérifier si la réponse contient des données valides
      console.log("Données brutes reçues de l'API:", responseData)
      
      if (!responseData) {
        console.warn("Aucune donnée valide reçue de l'API")
        setStats({
          total_revenue: 0,
          monthly_revenue: 0,
          total_expenses: 0,
          profit: 0,
          active_clients: 0
        })
        return
      }

      // Initialiser les totaux à 0
      let monthlyRevenue = 0
      
      // Vérifier si les données nécessaires sont disponibles
      if (responseData.monthly_stats && responseData.monthly_stats.length > 0) {
        // Utiliser les statistiques mensuelles si disponibles
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        
        // Trouver les statistiques du mois en cours
        const currentMonthStats = responseData.monthly_stats.find((stat: any) => {
          const [year, month] = stat.month.split('-')
          return parseInt(month) === currentMonth + 1 && parseInt(year) === currentYear
        })
        
        if (currentMonthStats) {
          monthlyRevenue = currentMonthStats.revenue || 0
        }
      } else {
        // Si pas de statistiques mensuelles, essayer de calculer à partir des données brutes
        try {
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          
          // Fonction pour filtrer les éléments du mois en cours
          const filterCurrentMonth = (items: any[]) => {
            return items.filter(item => {
              if (!item.date_creation) return false
              const itemDate = new Date(item.date_creation)
              return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
            })
          }
          
          // Calculer le total des abonnements du mois s'ils sont disponibles
          if (responseData.subscriptions) {
            const monthlySubscriptions = filterCurrentMonth(responseData.subscriptions)
            monthlyRevenue += monthlySubscriptions.reduce(
              (sum: number, sub: any) => sum + (parseFloat(sub.montant) || 0), 0
            )
          }
          
          // Calculer le total des séances du mois si elles sont disponibles
          if (responseData.sessions) {
            console.log("Sessions trouvées:", responseData.sessions)
            const monthlySessions = filterCurrentMonth(responseData.sessions)
            console.log("Sessions du mois en cours:", monthlySessions)
            const sessionsRevenue = monthlySessions.reduce(
              (sum: number, session: any) => {
                const montant = parseFloat(session.prix) || 0
                console.log(`Session ID ${session.id}: ${session.prix} (${montant})`)
                return sum + montant
              }, 0
            )
            console.log("Total des sessions ce mois-ci:", sessionsRevenue)
            monthlyRevenue += sessionsRevenue
          }
        } catch (error) {
          console.error("Erreur lors du calcul des revenus mensuels:", error)
        }
      }
      
      // Mettre à jour les statistiques avec les données du serveur
      setStats({
        total_revenue: Number(responseData.total_revenue) || 0,
        monthly_revenue: monthlyRevenue,
        total_expenses: Number(responseData.total_expenses) || 0,
        profit: Number(responseData.profit) || 0,
        active_clients: Number(responseData.active_clients) || 0
      })
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      // Afficher un message d'erreur à l'utilisateur
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur inconnue est survenue'}`)
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total revenue de ce Mois </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.monthly_revenue?.toLocaleString() || 0} FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {stats?.total_revenue?.toLocaleString() || 0} FCFA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Totales de mois </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.total_expenses?.toLocaleString() || 0} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personnel le plus assidue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats?.profit?.toLocaleString() || 0} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements le plus demande</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.active_clients || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="abonnements">Type_Abonnement</TabsTrigger>
          <TabsTrigger value="seances">Séances</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="financial">Finances</TabsTrigger>
          <TabsTrigger value="abonnement-client">Abonnement Client</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement key={userKey} ref={userManagementRef} onReload={() => setUserKey(k => k + 1)} />
        </TabsContent>

        <TabsContent value="personnel">
          <PersonnelManagement key={personnelKey} onReload={() => setPersonnelKey(k => k + 1)} />
        </TabsContent>

        <TabsContent value="abonnements">
          <AbonnementManagement key={abonnementKey} onReload={() => setAbonnementKey(k => k + 1)} />
        </TabsContent>

        <TabsContent value="seances">
          <SeanceManagement key={seanceKey} onReload={() => setSeanceKey(k => k + 1)} />
        </TabsContent>

        <TabsContent value="charges">
          <ChargeManagement key={chargeKey} onReload={() => setChargeKey(k => k + 1)} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialReport />
        </TabsContent>

        <TabsContent value="abonnement-client">
          <AbonnementClientManagement />
        </TabsContent>

        <TabsContent value="reports">
          <RapportPresence />
        </TabsContent>
      </Tabs>
    </div>
  )
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
export { AdminDashboard };
