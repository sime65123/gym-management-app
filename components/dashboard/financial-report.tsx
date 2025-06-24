"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Users, Download, BarChart3 } from "lucide-react"
import { apiClient } from "@/lib/api"

interface FinancialData {
  total_revenue: number
  total_expenses: number
  profit: number
  active_clients: number
  monthly_stats?: Array<{
    month: string
    revenue: number
    expenses: number
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
  const [selectedPeriod, setSelectedPeriod] = useState('current')

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

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rapport Financier</h2>
          <p className="text-gray-600">Vue d'ensemble de la performance financière</p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.total_revenue.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-green-100">
              +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
            <TrendingDown className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.total_expenses.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-red-100">
              +5% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${financialData.profit >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600'} text-white`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.profit.toLocaleString()} FCFA
            </div>
            <p className="text-xs opacity-90">
              Marge: {profitMargin}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.active_clients}
            </div>
            <p className="text-xs text-purple-100">
              +8% ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="monthly">Mensuel</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="sessions">Séances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Revenus</CardTitle>
                <CardDescription>
                  Sources principales de revenus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Abonnements</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Séances individuelles</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '20%'}}></div>
                      </div>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Autres</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '5%'}}></div>
                      </div>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances</CardTitle>
                <CardDescription>
                  Évolution des performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Revenus en hausse</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+12%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Nouveaux clients</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">+8%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Taux de rétention</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">85%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle</CardTitle>
              <CardDescription>
                Performance financière par mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.monthly_stats && financialData.monthly_stats.length > 0 ? (
                <div className="space-y-4">
                  {financialData.monthly_stats.map((month, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{month.month}</h4>
                        <Badge className={month.profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {month.profit >= 0 ? 'Bénéfice' : 'Perte'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Revenus:</span>
                          <div className="font-medium text-green-600">
                            {month.revenue.toLocaleString()} FCFA
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Dépenses:</span>
                          <div className="font-medium text-red-600">
                            {month.expenses.toLocaleString()} FCFA
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Résultat:</span>
                          <div className={`font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {month.profit.toLocaleString()} FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée mensuelle disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Abonnements</CardTitle>
              <CardDescription>
                Statistiques par type d'abonnement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.subscription_stats && financialData.subscription_stats.length > 0 ? (
                <div className="space-y-4">
                  {financialData.subscription_stats.map((sub, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{sub.name}</h4>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{sub.count} souscriptions</div>
                          <div className="font-medium text-green-600">
                            {sub.revenue.toLocaleString()} FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée d'abonnement disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Séances</CardTitle>
              <CardDescription>
                Statistiques par type de séance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.session_stats && financialData.session_stats.length > 0 ? (
                <div className="space-y-4">
                  {financialData.session_stats.map((session, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{session.title}</h4>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{session.bookings} réservations</div>
                          <div className="font-medium text-blue-600">
                            {session.revenue.toLocaleString()} FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée de séance disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
export default FinancialReport
