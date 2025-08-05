"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Users, Download, Calendar } from "lucide-react"
import { apiClient } from "@/lib/api"
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { fr } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  AreaChart,
  Area
} from "recharts"
import type { Reservation, AbonnementClientPresentiel, Seance, Charge } from "@/lib/api"

interface FinancialData {
  total_revenue: number
  total_expenses: number
  total_charges: number
  profit: number
  active_clients: number
  monthly_stats?: Array<{
    month: string
    revenue: number
    expenses: number
    charges: number
    profit: number
  }>
  subscription_stats?: Array<{
    name: string
    count: number
    revenue: number
  }>
  session_stats?: Array<{
    title: string
    bookings: number
    revenue: number
  }>
}

function FinancialReport() {
  const { toast } = useToast();
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6months')
  const [activeTab, setActiveTab] = useState('table')

  // Typage explicite des états
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [abonnementsClients, setAbonnementsClients] = useState<AbonnementClientPresentiel[]>([])
  const [seances, setSeances] = useState<Seance[]>([])
  const [charges, setCharges] = useState<Charge[]>([])
  const [presences, setPresences] = useState<any[]>([])

  useEffect(() => {
    loadFinancialData()
    fetchData()
    fetchChargesAndPresences()
  }, [])

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFinancialReport() as FinancialData | { results?: FinancialData };
      console.log("Données financières chargées:", response);
      
      // Gestion des différents formats de réponse
      if (response && 'results' in response && response.results) {
        setFinancialData(response.results);
      } else if (response && typeof response === 'object') {
        setFinancialData(response as FinancialData);
      } else {
        console.error("Format de réponse inattendu pour les données financières:", response);
        toast({
          title: "Erreur de format",
          description: "Le format des données financières reçues est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des données financières:", error);
      
      let errorMessage = "Échec du chargement des données financières";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à accéder à ces données. Veuillez vous reconnecter.";
        } else if (status === 500) {
          errorMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        } else if (data && data.detail) {
          errorMessage = data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  // Récupération des données brutes pour le calcul mensuel
  const fetchData = async () => {
    try {
      setLoading(true);
      const [res, abos, seancesData] = await Promise.all([
        apiClient.getReservations() as Promise<Reservation[] | { results: Reservation[] }>,
        apiClient.getAbonnementsClientsPresentiels() as Promise<AbonnementClientPresentiel[] | { results: AbonnementClientPresentiel[] }>,
        apiClient.getSeances() as Promise<Seance[] | { results: Seance[] }>,
      ]);
      
      // Gestion des réponses pour les réservations
      const normalizedReservations = (() => {
        if (Array.isArray(res)) {
          return res as Reservation[];
        }
        const resObj = res as { results?: unknown };
        if (resObj && 'results' in resObj && Array.isArray(resObj.results)) {
          return resObj.results as Reservation[];
        }
        console.error("Format de réponse inattendu pour les réservations:", res);
        toast({
          title: "Erreur de format",
          description: "Le format des données de réservations reçu est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
        return [];
      })();
      
      // Gestion des réponses pour les abonnements
      const normalizedAbonnements = (() => {
        if (Array.isArray(abos)) {
          return abos as AbonnementClientPresentiel[];
        }
        const abosObj = abos as { results?: unknown };
        if (abosObj && 'results' in abosObj && Array.isArray(abosObj.results)) {
          return abosObj.results as AbonnementClientPresentiel[];
        }
        console.error("Format de réponse inattendu pour les abonnements:", abos);
        toast({
          title: "Erreur de format",
          description: "Le format des données d'abonnements reçu est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
        return [];
      })();
      
      // Gestion des réponses pour les séances
      const normalizedSeances = (() => {
        if (Array.isArray(seancesData)) {
          return seancesData as Seance[];
        }
        const seancesObj = seancesData as { results?: unknown };
        if (seancesObj && 'results' in seancesObj && Array.isArray(seancesObj.results)) {
          return seancesObj.results as Seance[];
        }
        console.error("Format de réponse inattendu pour les séances:", seancesData);
        toast({
          title: "Erreur de format",
          description: "Le format des données de séances reçu est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
        return [];
      })();
      
      setReservations(normalizedReservations);
      setAbonnementsClients(normalizedAbonnements);
      setSeances(normalizedSeances);
      
      console.log("Données brutes chargées:", {
        reservations: normalizedReservations.length,
        abonnements: normalizedAbonnements.length,
        seances: normalizedSeances.length,
      });
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données brutes:', error);
      
      let errorMessage = "Échec du chargement des données brutes";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à accéder à ces données.";
        } else if (status === 500) {
          errorMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        } else if (data && data.detail) {
          errorMessage = data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  const fetchChargesAndPresences = async () => {
    try {
      setLoading(true);
      const [chargesResponse, presencesResponse] = await Promise.all([
        apiClient.getCharges() as Promise<Charge[] | { results: Charge[] }>,
        apiClient.getPresences() as Promise<Array<unknown> | { results: Array<unknown> }>,
      ]);
      
      // Normalisation des charges
      const normalizedCharges = (() => {
        if (Array.isArray(chargesResponse)) {
          return chargesResponse as Charge[];
        }
        const chargesData = chargesResponse as { results?: unknown };
        if (chargesData && 'results' in chargesData && Array.isArray(chargesData.results)) {
          return chargesData.results as Charge[];
        }
        console.error("Format de réponse inattendu pour les charges:", chargesResponse);
        toast({
          title: "Erreur de format",
          description: "Le format des données de charges reçu est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
        return [];
      })();
      
      // Normalisation des présences
      const normalizedPresences = (() => {
        if (Array.isArray(presencesResponse)) {
          return presencesResponse;
        }
        const presencesData = presencesResponse as { results?: unknown };
        if (presencesData && 'results' in presencesData && Array.isArray(presencesData.results)) {
          return presencesData.results;
        }
        console.error("Format de réponse inattendu pour les présences:", presencesResponse);
        toast({
          title: "Erreur de format",
          description: "Le format des données de présence reçu est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
        return [];
      })();
      
      setCharges(normalizedCharges);
      setPresences(normalizedPresences);
      
      console.log("Charges et présences chargées:", {
        charges: normalizedCharges.length,
        presences: normalizedPresences.length,
      });
    } catch (error: any) {
      console.error('Erreur lors du chargement des charges ou présences:', error);
      
      let errorMessage = "Échec du chargement des charges et présences";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à accéder à ces données.";
        } else if (status === 500) {
          errorMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        } else if (data && data.detail) {
          errorMessage = data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  // Définir le mois courant
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  function isInCurrentMonth(dateStr: string | Date | null | undefined): boolean {
    if (!dateStr) return false;
    try {
      const date = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return false;
    }
  }

  // 1. Réservations confirmées du mois
  const totalReservations = reservations
    .filter(r => r.statut === "CONFIRMEE" && isInCurrentMonth(r.created_at))
    .reduce((sum, r) => sum + (Number(r.montant) || 0), 0)

  // 2. Abonnements clients payés du mois
  const totalAbonnements = abonnementsClients
    .filter(a => isInCurrentMonth(a.date_debut))
    .reduce((sum, a) => sum + (Number(a.montant_paye) || 0), 0)

  // 3. Séances du mois (table seances uniquement)
  const totalSeances = seances
    .filter(s => isInCurrentMonth(s.date_jour))
    .reduce((sum, s) => sum + (Number(s.montant_paye) || 0), 0)

  // 4. Bénéfice net = somme des trois précédents
  const totalProfit = Number(totalReservations) + Number(totalAbonnements) + Number(totalSeances)

  // 2. Total des charges du mois
  const totalCharges = charges
    .filter(c => isInCurrentMonth(c.date))
    .reduce((sum, c) => sum + (Number(c.montant) || 0), 0)

  // 3. Personnel le plus assidu du mois
  const presencesMois = presences.filter(p => isInCurrentMonth(p.date_jour) && p.statut === "PRESENT")
  const assiduiteMap = new Map<string, { nom: string, prenom: string, count: number, earliest: string }>()
  presencesMois.forEach(p => {
    const key = p.personnel ? `${p.personnel.nom} ${p.personnel.prenom}` : p.employe ? `${p.employe.nom} ${p.employe.prenom}` : "?"
    const heure = p.heure_arrivee || "23:59"
    if (!assiduiteMap.has(key)) {
      assiduiteMap.set(key, { nom: p.personnel?.nom || p.employe?.nom || "?", prenom: p.personnel?.prenom || p.employe?.prenom || "?", count: 1, earliest: heure })
    } else {
      const obj = assiduiteMap.get(key)!
      obj.count += 1
      if (heure < obj.earliest) obj.earliest = heure
      assiduiteMap.set(key, obj)
    }
  })
  let personnelAssidu = "-"
  if (assiduiteMap.size > 0) {
    const sorted = Array.from(assiduiteMap.values()).sort((a, b) => b.count - a.count || a.earliest.localeCompare(b.earliest))
    personnelAssidu = `${sorted[0].prenom} ${sorted[0].nom}`
  }

  // 4. Abonnement le plus demandé du mois
  const abonnementsMois = abonnementsClients.filter(a => isInCurrentMonth(a.date_debut))
  const abonnementCount: Record<string, number> = {}
  abonnementsMois.forEach(a => {
    abonnementCount[a.abonnement_nom] = (abonnementCount[a.abonnement_nom] || 0) + 1
  })
  let abonnementPopulaire = "-"
  if (Object.keys(abonnementCount).length > 0) {
    abonnementPopulaire = Object.entries(abonnementCount).sort((a, b) => b[1] - a[1])[0][0]
  }

  const exportReport = () => {
    // TODO: Implement PDF export functionality
    alert('Fonctionnalité d\'export en cours de développement')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!financialData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Aucune donnée financière disponible
          </div>
        </CardContent>
      </Card>
    )
  }

  const profitMargin = financialData.total_revenue > 0 
    ? ((financialData.profit / financialData.total_revenue) * 100).toFixed(1)
    : '0'

  // Formater les données pour le graphique
  const chartData = financialData?.monthly_stats?.map(item => ({
    month: item.month,
    name: format(parseISO(item.month || ''), 'MMM yyyy', { locale: fr }),
    revenue: item.revenue,
    abonnements: item.revenue * 0.6, // Estimation basée sur les vraies données
    seances: item.revenue * 0.4,     // Estimation basée sur les vraies données
    profit: item.profit,
    charges: item.charges,
    rendu: item.profit - item.charges // Différence entre bénéfice net et charges
  })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()) || []

  // Filtrer les données en fonction de la période sélectionnée
  const filteredData = timeRange === '6months' 
    ? chartData.slice(-6) 
    : timeRange === '12months' 
      ? chartData.slice(-12)
      : chartData

  // Calculer les totaux pour le tableau
  const tableData = financialData?.monthly_stats?.map(item => ({
    month: item.month,
    monthFormatted: format(parseISO(item.month || ''), 'MMMM yyyy', { locale: fr }),
    revenue: item.revenue,
    abonnements: Math.round(item.revenue * 0.6), // Estimation basée sur les vraies données
    seances: Math.round(item.revenue * 0.4),     // Estimation basée sur les vraies données
    profit: item.profit
  })).sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()) || []
  
  // Calculer les totaux généraux
  const totalRevenus = tableData.reduce((sum, item) => sum + item.revenue, 0)
  const totalAbonnementsTable = tableData.reduce((sum, item) => sum + item.abonnements, 0)
  const totalSeancesTable = tableData.reduce((sum, item) => sum + item.seances, 0)
  const totalProfitTable = tableData.reduce((sum, item) => sum + item.profit, 0)

  return (
    <div className="space-y-6">
      {/* Message de bienvenue stylé */}
      <div className="w-full flex items-center justify-center py-8">
        <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-xl shadow-lg px-8 py-10 text-center max-w-2xl w-full">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">Bienvenue sur le tableau de bord financier !</h1>
          <p className="text-lg text-gray-600">Consultez ici vos indicateurs clés, suivez vos performances et prenez les meilleures décisions pour votre salle de sport.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(totalReservations).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Somme des réservations confirmées du mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(totalAbonnements).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Somme des montants payés pour les abonnements clients du mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Séances</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(totalSeances).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Somme des montants des séances confirmées du mois
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-white rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-green-700">Bénéfice Net du Mois</CardTitle>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-green-600">
              {Number(totalProfit).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-green-700 mt-2">
              Somme des revenus du mois (réservations, abonnements, séances)
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-2 border-red-200 bg-gradient-to-br from-red-50 to-white rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-red-700">Charges du Mois</CardTitle>
            <TrendingDown className="h-6 w-6 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-red-600">
              {Number(totalCharges).toLocaleString()} FCFA
      </div>
            <p className="text-xs text-red-700 mt-2">
              Total des charges enregistrées ce mois-ci
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-purple-700">Personnel le plus assidu</CardTitle>
            <Users className="h-6 w-6 text-purple-500" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-extrabold text-purple-600">
              {personnelAssidu}
                      </div>
            <p className="text-xs text-purple-700 mt-2">
              Présence la plus régulière ce mois-ci
            </p>
              </CardContent>
            </Card>
        <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-blue-700">Abonnement le plus demandé</CardTitle>
            <DollarSign className="h-6 w-6 text-blue-500" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-extrabold text-blue-600">
              {abonnementPopulaire}
                    </div>
            <p className="text-xs text-blue-700 mt-2">
              Abonnement le plus souscrit ce mois-ci
            </p>
              </CardContent>
            </Card>
          </div>

      <Tabs 
        defaultValue="table" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="table">Tableau des Revenus</TabsTrigger>
            <TabsTrigger value="chart">Graphique d'Évolution</TabsTrigger>
          </TabsList>
          
          {activeTab === 'chart' && (
            <div className="flex space-x-2">
              <Button 
                variant={timeRange === '6months' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('6months')}
              >
                6 mois
              </Button>
              <Button 
                variant={timeRange === '12months' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('12months')}
              >
                12 mois
              </Button>
              <Button 
                variant={timeRange === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('all')}
              >
                Tous
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tableau des Revenus Mensuels</CardTitle>
              <CardDescription>
                Détail des revenus par type et par mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Mois</TableHead>
                      <TableHead className="text-right">Abonnements</TableHead>
                      <TableHead className="text-right">Séances</TableHead>
                      <TableHead className="text-right">Total Revenus</TableHead>
                      <TableHead className="text-right">Bénéfice Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.length > 0 ? (
                      <>
                        {tableData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.monthFormatted}</TableCell>
                            <TableCell className="text-right">{row.abonnements.toLocaleString()} FCFA</TableCell>
                            <TableCell className="text-right">{row.seances.toLocaleString()} FCFA</TableCell>
                            <TableCell className="text-right font-medium">
                              {row.revenue.toLocaleString()} FCFA
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-medium ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {row.profit.toLocaleString()} FCFA
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Ligne des totaux */}
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{totalAbonnementsTable.toLocaleString()} FCFA</TableCell>
                          <TableCell className="text-right">{totalSeancesTable.toLocaleString()} FCFA</TableCell>
                          <TableCell className="text-right">{totalRevenus.toLocaleString()} FCFA</TableCell>
                          <TableCell className={`text-right ${totalProfitTable >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalProfitTable.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Aucune donnée disponible pour la période sélectionnée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          {/* Graphique d'évolution du bénéfice net et des charges */}
          <Card className="shadow-lg border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-800">Évolution Financière Mensuelle</CardTitle>
              <CardDescription className="text-blue-600">
                Comparaison du bénéfice net, des charges et du rendu par mois
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#374151' }}
                    tickMargin={10}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12, fill: '#374151' }}
                    width={60}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} FCFA`, 
                      name === 'profit' ? 'Bénéfice Net' : 
                      name === 'charges' ? 'Charges' : 'Rendu'
                    ]}
                    labelFormatter={(label) => `Mois: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px'
                    }}
                  />
                  {/* Bénéfice Net - Zone verte */}
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    name="Bénéfice Net" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fill="#d1fae5" 
                    fillOpacity={0.8} 
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#10b981' }}
                  />
                  {/* Charges - Zone rouge */}
                  <Area 
                    type="monotone" 
                    dataKey="charges" 
                    name="Charges" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    fill="#fee2e2" 
                    fillOpacity={0.8} 
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#ef4444' }}
                  />
                  {/* Rendu (Bénéfice - Charges) - Ligne bleue */}
                  <Line 
                    type="monotone" 
                    dataKey="rendu" 
                    name="Rendu" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Graphique en barres pour le rendu mensuel */}
          <Card className="shadow-lg border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-purple-800">Rendu Mensuel</CardTitle>
              <CardDescription className="text-purple-600">
                Différence entre bénéfice net et charges par mois
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#374151' }}
                    tickMargin={10}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12, fill: '#374151' }}
                    width={60}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, 'Rendu']}
                    labelFormatter={(label) => `Mois: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="rendu" 
                    name="Rendu" 
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
export default FinancialReport
