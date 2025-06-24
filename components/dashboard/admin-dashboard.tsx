"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, Calendar, TrendingUp, FileText } from "lucide-react"
import { apiClient } from "@/lib/api"
import { UserManagement } from "./user-management"
import { AbonnementManagement } from "./abonnement-management"
import { SeanceManagement } from "./seance-management"
import { ChargeManagement } from "./charge-management"
import FinancialReport from "./financial-report"
import { InvoiceManagement } from "./invoice-management"
import { PersonnelManagement } from "./personnel-management"
import { RapportPresence } from "./rapport-presence"

interface DashboardStats {
  total_revenue: number
  total_expenses: number
  profit: number
  active_clients: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [seanceKey, setSeanceKey] = useState(0)
  const [abonnementKey, setAbonnementKey] = useState(0)
  const [personnelKey, setPersonnelKey] = useState(0)
  const [chargeKey, setChargeKey] = useState(0)
  const [userKey, setUserKey] = useState(0)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const financialData = await apiClient.getFinancialReport()
      setStats(financialData)
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.total_revenue?.toLocaleString() || 0} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.total_expenses?.toLocaleString() || 0} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
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
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
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
          <TabsTrigger value="abonnements">Abonnements</TabsTrigger>
          <TabsTrigger value="seances">Séances</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="financial">Finances</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement key={userKey} onReload={() => setUserKey(k => k + 1)} />
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

        <TabsContent value="invoices">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="reports">
          <RapportPresence />
        </TabsContent>
      </Tabs>
    </div>
  )
}
