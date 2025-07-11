"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, CheckCircle, XCircle, Clock, Download } from "lucide-react"
import { apiClient } from "@/lib/api"

interface PersonnelInfo {
  id: number
  nom: string
  prenom: string
  categorie: string
}

interface EmployeInfo {
  id: number
  nom: string
  prenom: string
  email: string
  role?: string
}

interface PresenceRapport {
  id: number
  personnel?: PersonnelInfo
  employe?: EmployeInfo
  statut: "PRESENT" | "ABSENT"
  heure_arrivee: string
  date_jour: string
}

type PersonnelComplet = (PersonnelInfo | EmployeInfo) & {
  categorie: string
}

interface ApiResponse {
  results?: PresenceRapport[]
  [key: string]: any
}

export function RapportPresence() {
  const getPersonnelInfo = useCallback((presence: PresenceRapport): PersonnelComplet => {
    if (presence.employe) {
      return {
        ...presence.employe,
        categorie: presence.employe.role || 'EMPLOYE'
      } as PersonnelComplet;
    } else if (presence.personnel) {
      return {
        ...presence.personnel,
        email: '' // Ajout d'un email vide pour la compatibilité avec le type
      } as PersonnelComplet;
    }
    return { 
      id: 0, 
      nom: 'Inconnu', 
      prenom: '', 
      email: '',
      categorie: 'INCONNU' 
    };
  }, []);
  const [presences, setPresences] = useState<PresenceRapport[]>([])
  const [anciensRapports, setAnciensRapports] = useState<PresenceRapport[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAnciens, setLoadingAnciens] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showAnciensRapports, setShowAnciensRapports] = useState(false)
  const [dateRecherche, setDateRecherche] = useState('')

  useEffect(() => {
    loadRapportJournalier()
  }, [])

  const loadRapportJournalier = async () => {
    try {
      setLoading(true)
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
    switch (statut?.toUpperCase()) {
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
    switch (categorie?.toUpperCase()) {
      case "COACH":
        return "Coach"
      case "RECEPTIONNISTE":
        return "Réceptionniste"
      case "ENTRAINEUR":
        return "Entraîneur"
      case "ADMIN":
        return "Administrateur"
      case "EMPLOYE":
        return "Employé"
      default:
        return categorie || "Non défini"
    }
  }

  const rechercherAnciensRapports = async (date: string) => {
    if (!date) return
    
    try {
      setLoadingAnciens(true)
      // Ici, vous devrez implémenter l'appel API pour récupérer les rapports par date
      // Par exemple : const response = await apiClient.getRapportParDate(date)
      // setAnciensRapports(Array.isArray(response) ? response : response?.results || [])
      
      // Simulation de chargement (à remplacer par l'appel API réel)
      setTimeout(() => {
        setAnciensRapports([]) // Remplacer par les données réelles
        setLoadingAnciens(false)
      }, 500)
    } catch (error) {
      console.error('Erreur lors de la récupération des anciens rapports:', error)
      setLoadingAnciens(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    setDateRecherche(date)
    if (date) {
      rechercherAnciensRapports(date)
    }
  }

  const getCategorieBadgeColor = (categorie: string) => {
    const cat = categorie?.toUpperCase() || '';
    switch (cat) {
      case "COACH":
        return "bg-blue-100 text-blue-800"
      case "MENAGE":
        return "bg-yellow-100 text-yellow-800"
      case "ENTRAINEUR":
        return "bg-purple-100 text-purple-800"
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "EMPLOYE":
      case "RÉCEPTIONNISTE":
        return "bg-green-100 text-green-800"
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

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      // Créer le contenu HTML pour le PDF
      const date = new Date().toLocaleDateString('fr-FR')
      const title = 'Rapport de Présence'
      
      // Créer le tableau HTML
      let tableRows = ''
      presences.forEach(presence => {
        const personnel = getPersonnelInfo(presence)
        tableRows += `
          <tr>
            <td>${personnel.prenom} ${personnel.nom}</td>
            <td>${getCategorieLabel(personnel.categorie)}</td>
            <td>${presence.statut === 'PRESENT' ? 'Présent' : 'Absent'}</td>
            <td>${presence.heure_arrivee || '-'}</td>
            <td>${new Date(presence.date_jour).toLocaleDateString('fr-FR')}</td>
          </tr>
        `
      })
      
      // Créer le contenu HTML complet
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; text-align: center; }
            .date { text-align: right; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #3498db; color: white; text-align: left; padding: 10px; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .stats { margin-top: 30px; }
            .stats h2 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .stat-item { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="date">Date: ${date}</div>
          
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Heure</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="stats">
            <h2>Statistiques</h2>
            <div class="stat-item"><strong>Total:</strong> ${stats.total}</div>
            <div class="stat-item"><strong>Présents:</strong> ${stats.present}</div>
            <div class="stat-item"><strong>Absents:</strong> ${stats.absent}</div>
            <div class="stat-item"><strong>Taux de présence:</strong> ${stats.tauxPresence}%</div>
          </div>
        </body>
        </html>
      `
      
      // Ouvrir une nouvelle fenêtre avec le contenu HTML
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Donner le temps au contenu de se charger avant d'imprimer
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        // Fallback si la fenêtre d'impression ne s'ouvre pas
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rapport_presence_${date.replace(/\//g, '-')}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      alert('Une erreur est survenue lors de la génération du rapport')
    } finally {
      setIsDownloading(false)
    }
  }

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
              <CardTitle>Rapport de présence</CardTitle>
              <CardDescription>Gérez les présences du personnel</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAnciensRapports(!showAnciensRapports)}
              >
                {showAnciensRapports ? 'Masquer' : 'Afficher'} les anciens rapports
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownload}
                disabled={isDownloading || presences.length === 0}
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAnciensRapports && (
            <div className="mb-8 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Anciens rapports</h3>
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="date"
                  value={dateRecherche}
                  onChange={handleDateChange}
                  className="p-2 border rounded"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              {loadingAnciens ? (
                <div className="text-center py-4">Chargement des rapports...</div>
              ) : anciensRapports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Heure d'arrivée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anciensRapports.map((presence) => {
                      const personnelInfo = getPersonnelInfo(presence);
                      const categorie = personnelInfo.categorie || "INCONNU";

                      return (
                        <TableRow key={presence.id}>
                          <TableCell className="font-medium">
                            {personnelInfo.prenom} {personnelInfo.nom}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getCategorieBadgeColor(categorie)}>
                              {getCategorieLabel(categorie)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {presence.statut === "PRESENT" ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                  <span>Présent</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                  <span>Absent</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {presence.heure_arrivee || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : dateRecherche ? (
                <div className="text-center py-4 text-gray-500">
                  Aucun rapport trouvé pour cette date
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Sélectionnez une date pour afficher les rapports
                </div>
              )}
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-4">Rapport du jour</h3>
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
                presences.map((presence) => {
                  const personnelInfo = getPersonnelInfo(presence);
                  const categorie = personnelInfo.categorie || "INCONNU";
                  
                  return (
                    <TableRow key={presence.id}>
                      <TableCell className="font-medium">
                        {personnelInfo.prenom} {personnelInfo.nom}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategorieBadgeColor(categorie)}>
                          {getCategorieLabel(categorie)}
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
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 