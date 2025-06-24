"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, Users, Download } from "lucide-react"
import { apiClient } from "@/lib/api"

interface FinancialReportData {
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

export function FinancialCharts() {
  const [reportData, setReportData] = useState<FinancialReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    try {
      // Utiliser l'endpoint qui existe réellement dans le backend
      const response = await apiClient.getFinancialReport()
      setReportData(response)
    } catch (error) {
      console.error("Erreur lors du chargement du rapport financier:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    // Fonction d'export simplifiée car l'endpoint n'existe pas dans le backend
    alert("Fonctionnalité d'export en cours de développement côté backend")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Aucune donnée financière disponible</div>
        </CardContent>
      </Card>
    )
  }

  const profitMargin =
    reportData.total_revenue > 0 ? ((reportData.profit / reportData.total_revenue) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rapport Financier</h2>
          <p className="text-gray-600">Vue d'ensemble des performances financières</p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter (Bientôt disponible)
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.total_revenue.toLocaleString()} FCFA</div>
            <p className="text-xs text-green-100">Total des revenus</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
            <TrendingDown className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.total_expenses.toLocaleString()} FCFA</div>
            <p className="text-xs text-red-100">Total des charges</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-r ${reportData.profit >= 0 ? "from-blue-500 to-cyan-600" : "from-orange-500 to-red-600"} text-white`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
            {reportData.profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.profit.toLocaleString()} FCFA</div>
            <p className="text-xs opacity-90">Marge: {profitMargin}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.active_clients}</div>
            <p className="text-xs text-purple-100">Clients actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Stats */}
        {reportData.monthly_stats && reportData.monthly_stats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle</CardTitle>
              <CardDescription>Revenus, dépenses et bénéfices par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.monthly_stats.map((item, index) => {
                  const maxValue = Math.max(...reportData.monthly_stats!.map((d) => Math.max(d.revenue, d.expenses)))
                  const revenueWidth = (item.revenue / maxValue) * 100
                  const expenseWidth = (item.expenses / maxValue) * 100

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.month}</span>
                        <span className={`font-semibold ${item.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.profit.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-16 text-xs text-gray-600">Revenus</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${revenueWidth}%` }}
                            />
                          </div>
                          <div className="w-20 text-xs text-right font-medium">{item.revenue.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 text-xs text-gray-600">Dépenses</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${expenseWidth}%` }}
                            />
                          </div>
                          <div className="w-20 text-xs text-right font-medium">{item.expenses.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Stats */}
        {reportData.subscription_stats && reportData.subscription_stats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenus par Abonnement</CardTitle>
              <CardDescription>Performance des différents types d'abonnements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.subscription_stats.map((item, index) => {
                  const maxRevenue = Math.max(...reportData.subscription_stats!.map((d) => d.revenue))
                  const width = (item.revenue / maxRevenue) * 100
                  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"]

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.name}</span>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{item.revenue.toLocaleString()} FCFA</div>
                          <div className="text-xs text-gray-500">{item.count} souscriptions</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className={`${colors[index % colors.length]} h-3 rounded-full transition-all duration-300`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600">
                          {((item.revenue / reportData.total_revenue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Indicateurs de Performance</CardTitle>
          <CardDescription>Métriques clés pour évaluer la santé financière</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">{profitMargin}%</div>
              <div className="text-sm text-gray-600">Marge Bénéficiaire</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {reportData.monthly_stats && reportData.monthly_stats.length > 0
                  ? (reportData.total_revenue / reportData.monthly_stats.length).toLocaleString()
                  : reportData.total_revenue.toLocaleString()}{" "}
                FCFA
              </div>
              <div className="text-sm text-gray-600">Revenu Moyen</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {reportData.active_clients > 0
                  ? Math.round(reportData.total_revenue / reportData.active_clients).toLocaleString()
                  : 0}{" "}
                FCFA
              </div>
              <div className="text-sm text-gray-600">Revenu/Client</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
