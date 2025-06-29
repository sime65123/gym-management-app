"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Users, Download, Calendar } from "lucide-react"
import { apiClient } from "@/lib/api"
import { format, parseISO } from "date-fns"
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
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6months')
  const [activeTab, setActiveTab] = useState('table')

  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = async () => {
    try {
      const data = await apiClient.getFinancialReport()
      setFinancialData(data)
    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error)
    } finally {
      setLoading(false)
    }
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
    name: format(parseISO(item.month), 'MMM yyyy', { locale: fr }),
    revenue: item.revenue,
    abonnements: item.revenue * 0.75, // Estimation pour la démo
    seances: item.revenue * 0.25,     // Estimation pour la démo
    profit: item.profit
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
    monthFormatted: format(parseISO(item.month), 'MMMM yyyy', { locale: fr }),
    revenue: item.revenue,
    abonnements: Math.round(item.revenue * 0.75), // Estimation pour la démo
    seances: Math.round(item.revenue * 0.25),     // Estimation pour la démo
    profit: item.profit
  })).sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()) || []
  
  // Calculer les totaux généraux
  const totalRevenus = tableData.reduce((sum, item) => sum + item.revenue, 0)
  const totalAbonnements = tableData.reduce((sum, item) => sum + item.abonnements, 0)
  const totalSeances = tableData.reduce((sum, item) => sum + item.seances, 0)
  const totalProfit = tableData.reduce((sum, item) => sum + item.profit, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Rapport Financier</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenus.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Cumul des 12 derniers mois
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
              {totalAbonnements.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRevenus > 0 ? Math.round((totalAbonnements / totalRevenus) * 100) : 0}% du total
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
              {totalSeances.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRevenus > 0 ? Math.round((totalSeances / totalRevenus) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Sur les 12 derniers mois
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
                          <TableCell className="text-right">{totalAbonnements.toLocaleString()} FCFA</TableCell>
                          <TableCell className="text-right">{totalSeances.toLocaleString()} FCFA</TableCell>
                          <TableCell className="text-right">{totalRevenus.toLocaleString()} FCFA</TableCell>
                          <TableCell className={`text-right ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalProfit.toLocaleString()} FCFA
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
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Revenus</CardTitle>
              <CardDescription>
                Comparaison des revenus mensuels par type
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, '']}
                    labelFormatter={(label) => `Mois: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="abonnements" 
                    name="Abonnements" 
                    stackId="1"
                    stroke="#4f46e5" 
                    fill="#c7d2fe" 
                    fillOpacity={0.8} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="seances" 
                    name="Séances" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#d1fae5" 
                    fillOpacity={0.8} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bénéfice Mensuel</CardTitle>
              <CardDescription>
                Évolution du bénéfice net par mois
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, '']}
                    labelFormatter={(label) => `Mois: ${label}`}
                  />
                  <Bar 
                    dataKey="profit" 
                    name="Bénéfice Net" 
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  >
                    {filteredData.map((entry, index) => (
                      <rect 
                        key={`bar-${index}`} 
                        fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} 
                        x={entry.x} 
                        y={entry.y} 
                        width={entry.width} 
                        height={entry.height}
                        rx="4"
                        ry="4"
                      />
                    ))}
                  </Bar>
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
