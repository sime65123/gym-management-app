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
  const [error, setError] = useState<string | null>(null)
  const [seanceKey, setSeanceKey] = useState(0)
  const [abonnementKey, setAbonnementKey] = useState(0)
  const [personnelKey, setPersonnelKey] = useState(0)
  const [chargeKey, setChargeKey] = useState(0)
  const [userKey, setUserKey] = useState(0)
  const userManagementRef = useRef<{ loadUsers: () => Promise<void> } | null>(null)

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
    setLoading(true);
    setError(null);
    
    try {
      console.log("Tentative de chargement des données du tableau de bord...");
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        console.error("Aucun token d'authentification trouvé");
        throw new Error("Non authentifié. Veuillez vous connecter.");
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/financial-report/`;
      console.log("URL de l'API:", apiUrl);
      
      // Envoyer la requête
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include' as RequestCredentials
      });
      
      // Lire la réponse une seule fois
      const responseText = await response.text();
      let responseData;
      
      // Essayer de parser la réponse en JSON
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error("La réponse n'est pas du JSON valide:", e);
        throw new Error("La réponse du serveur est invalide");
      }
      
      // Vérifier si la réponse est une erreur
      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        
        if (responseData) {
          // Essayer d'extraire un message d'erreur détaillé
          if (responseData.detail) {
            errorMessage = Array.isArray(responseData.detail)
              ? responseData.detail.map((err: any) => 
                  `${err.loc ? err.loc.join('.') + ' - ' : ''}${err.msg}`
                ).join('\n')
              : responseData.detail;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.error) {
            errorMessage = responseData.error;
          }
        }
        
        // Gestion spécifique des erreurs d'authentification
        if (response.status === 401) {
          console.warn("Session expirée ou invalide, déconnexion...");
          // Ici vous pourriez appeler une fonction de déconnexion
          errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
        }
        
        throw new Error(errorMessage);
      }
      
      // Si on arrive ici, la réponse est OK (200-299)
      if (!responseData) {
        throw new Error("Aucune donnée valide reçue du serveur");
      }

      // Initialiser les totaux à 0
      let monthlyRevenue = 0;
      
      // Vérifier si les données nécessaires sont disponibles
      if (responseData.monthly_stats && responseData.monthly_stats.length > 0) {
        // Utiliser les statistiques mensuelles si disponibles
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Trouver les statistiques du mois en cours
        const currentMonthStats = responseData.monthly_stats.find((stat: any) => {
          const [year, month] = stat.month.split('-')
          return parseInt(month) === currentMonth + 1 && parseInt(year) === currentYear
        });
        
        if (currentMonthStats) {
          monthlyRevenue = currentMonthStats.revenue || 0;
        }
      } else if (responseData.subscriptions || responseData.sessions) {
        // Si pas de statistiques mensuelles, essayer de calculer à partir des données brutes
        try {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          // Fonction pour filtrer les éléments du mois en cours
          const filterCurrentMonth = (items: any[]) => {
            if (!items || !Array.isArray(items)) return [];
            return items.filter(item => {
              if (!item.date_creation) return false;
              const itemDate = new Date(item.date_creation);
              return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            });
          };
          
          // Calculer le total des abonnements du mois s'ils sont disponibles
          if (responseData.subscriptions) {
            const monthlySubscriptions = filterCurrentMonth(responseData.subscriptions);
            monthlyRevenue += monthlySubscriptions.reduce(
              (sum: number, sub: any) => sum + (parseFloat(sub.montant) || 0), 0
            );
          }
          
          // Calculer le total des séances du mois si elles sont disponibles
          if (responseData.sessions) {
            const monthlySessions = filterCurrentMonth(responseData.sessions);
            const sessionsRevenue = monthlySessions.reduce(
              (sum: number, session: any) => {
                const montant = parseFloat(session.prix) || 0;
                return sum + montant;
              }, 0
            );
            monthlyRevenue += sessionsRevenue;
          }
        } catch (error) {
          console.error("Erreur lors du calcul des revenus mensuels:", error);
        }
      }
      
      // Mettre à jour les statistiques avec les données du serveur
      setStats({
        total_revenue: Number(responseData.total_revenue) || 0,
        monthly_revenue: monthlyRevenue,
        total_expenses: Number(responseData.total_expenses) || 0,
        profit: Number(responseData.profit) || 0,
        active_clients: Number(responseData.active_clients) || 0
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError(error instanceof Error ? error.message : 'Une erreur inconnue est survenue');
      
      // Afficher un message d'erreur à l'utilisateur
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur inconnue est survenue'}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Obtenir l'heure actuelle pour le message de bienvenue
  const currentHour = new Date().getHours();
  let greeting = 'Bonsoir';
  if (currentHour < 12) {
    greeting = 'Bonjour';
  } else if (currentHour < 18) {
    greeting = 'Bon après-midi';
  }

  return (
    <div className="space-y-6">
      {/* Bannière de bienvenue */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{greeting}, Administrateur</h1>
        <p className="text-blue-100">Gérez efficacement votre salle de sport depuis ce tableau de bord.</p>
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
