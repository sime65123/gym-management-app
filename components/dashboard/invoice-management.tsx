"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Search, Calendar, DollarSign, ExternalLink, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Facture {
  id: number
  uuid: string
  date_generation: string
  paiement: {
    id: number
    client: string
    abonnement?: {
      nom: string
    }
    seance?: {
      titre: string
    }
    montant: number
    date_paiement: string
    status: string
    mode_paiement: string
  }
  fichier_pdf_url: string
}

export function InvoiceManagement() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    loadFactures()
  }, [])

  const loadFactures = async () => {
    try {
      const response = await apiClient.getFactures()
      setFactures(response.results || response)
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (facture: Facture) => {
    setDownloadingId(facture.id)
    try {
      // Utiliser l'URL directe du PDF fournie par le backend
      const link = document.createElement("a")
      link.href = facture.fichier_pdf_url
      link.download = `facture-${facture.uuid}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      alert("Erreur lors du téléchargement de la facture")
    } finally {
      setDownloadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAYE":
        return <Badge className="bg-green-100 text-green-800">Payée</Badge>
      case "EN_ATTENTE":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case "ECHEC":
        return <Badge className="bg-red-100 text-red-800">Échec</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPaymentModeBadge = (mode: string) => {
    switch (mode) {
      case "CINETPAY":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            CinetPay
          </Badge>
        )
      case "ESPECE":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Espèces
          </Badge>
        )
      case "SOLDE":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Solde
          </Badge>
        )
      default:
        return <Badge variant="outline">{mode}</Badge>
    }
  }

  const filteredFactures = factures.filter((facture) => {
    const matchesSearch =
      facture.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facture.paiement.client.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getFactureStats = () => {
    const total = factures.length
    const totalAmount = factures.reduce((sum, f) => sum + f.paiement.montant, 0)
    const payees = factures.filter((f) => f.paiement.status === "PAYE").length

    return { total, totalAmount, payees }
  }

  const stats = getFactureStats()

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalAmount.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures Payées</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.payees}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des Factures</CardTitle>
              <CardDescription>Consultez et téléchargez les factures</CardDescription>
            </div>
            <Button variant="outline" onClick={loadFactures} title="Actualiser la liste">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Factures Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Mode Paiement</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFactures.map((facture) => (
                <TableRow key={facture.id}>
                  <TableCell className="font-medium">{facture.uuid}</TableCell>
                  <TableCell>{facture.paiement.client}</TableCell>
                  <TableCell>
                    {facture.paiement.abonnement?.nom || facture.paiement.seance?.titre || "Recharge compte"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {facture.paiement.montant.toLocaleString()} FCFA
                    </div>
                  </TableCell>
                  <TableCell>{getPaymentModeBadge(facture.paiement.mode_paiement)}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(facture.date_generation).toLocaleDateString("fr-FR")}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(facture.paiement.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(facture)}
                        disabled={downloadingId === facture.id}
                      >
                        {downloadingId === facture.id ? (
                          "Téléchargement..."
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(facture.fichier_pdf_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFactures.length === 0 && (
            <div className="text-center py-8 text-gray-500">Aucune facture trouvée</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
