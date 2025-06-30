"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, CheckCircle, XCircle, Clock, Download } from "lucide-react"
import { apiClient } from "@/lib/api"

interface PresenceRapport {
  id: number
  personnel?: {
    id: number
    nom: string
    prenom: string
    categorie: string
  }
  employe?: {
    id: number
    nom: string
    prenom: string
    email: string
  }
  statut: "PRESENT" | "ABSENT"
  heure_arrivee: string
  date_jour: string
}

interface ApiResponse {
  results?: PresenceRapport[]
  [key: string]: any
}

export function RapportPresence() {
  const [presences, setPresences] = useState<PresenceRapport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRapportJournalier()
  }, [])

  const loadRapportJournalier = async () => {
    try {
      const response = await apiClient.getRapportJournalier() as ApiResponse | PresenceRapport[]
      if (Array.isArray(response)) {
        setPresences(response)
      } else if (response && 'results' in response) {
        setPresences(response.results || [])
      } else {
        setPresences([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement du rapport:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "PRESENT":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Présent
          </Badge>
        )
      case "ABSENT":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        )
      default:
        return <Badge className="bg-gray-100 text-gray-800">{statut}</Badge>
    }
  }

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case "COACH":
        return "Coach"
      case "MENAGE":
        return "Ménage"
      case "AIDE_SOIGNANT":
        return "Aide-soignant"
      case "AUTRE":
        return "Autre"
      default:
        return categorie
    }
  }

  const getCategorieBadgeColor = (categorie: string) => {
    switch (categorie) {
      case "COACH":
        return "bg-blue-100 text-blue-800"
      case "MENAGE":
        return "bg-green-100 text-green-800"
      case "AIDE_SOIGNANT":
        return "bg-purple-100 text-purple-800"
      case "AUTRE":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRapportStats = () => {
    const total = presences.length
    const present = presences.filter((p) => p.statut === "PRESENT").length
    const absent = presences.filter((p) => p.statut === "ABSENT").length
    const tauxPresence = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, tauxPresence }
  }

  const stats = getRapportStats()

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personnel</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présents</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absents</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.tauxPresence}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapport Journalier des Présences</CardTitle>
              <CardDescription>Liste des présences du personnel pour aujourd'hui</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personnel</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Heure d'arrivée</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Aucune présence enregistrée pour aujourd'hui
                  </TableCell>
                </TableRow>
              ) : (
                presences.map((presence) => (
                  <TableRow key={presence.id}>
                    <TableCell className="font-medium">
                      {presence.personnel?.prenom} {presence.personnel?.nom}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategorieBadgeColor(presence.personnel?.categorie || "")}>
                        {getCategorieLabel(presence.personnel?.categorie || "")}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatutBadge(presence.statut)}</TableCell>
                    <TableCell>{presence.heure_arrivee || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(presence.date_jour).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 