"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Search, Calendar, DollarSign, ExternalLink, RotateCcw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { DocumentHeader } from "@/components/shared/document-header"

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

  // Remove ApiResponse interface since we're not using it anymore

  useEffect(() => {
    loadFactures()
  }, [])

  const loadFactures = async () => {
    try {
      const response = await apiClient.getPaiements()
      // Transform Paiement[] to Facture[]
      const facturesData = (Array.isArray(response) ? response : []).map(paiement => ({
        id: paiement.id,
        uuid: `FACT-${paiement.reference || paiement.id}`,
        date_generation: new Date().toISOString(),
        paiement: {
          id: paiement.id,
          client: paiement.client_nom ? `${paiement.client_prenom} ${paiement.client_nom}` : 'Client inconnu',
          montant: paiement.montant,
          date_paiement: paiement.date_paiement,
          status: paiement.statut,
          mode_paiement: paiement.mode_paiement,
        },
        fichier_pdf_url: '' // You might want to update this based on your API response
      }));
      setFactures(facturesData)
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (facture: Facture) => {
    try {
      setDownloadingId(facture.id)
      
      // Créer un conteneur pour le contenu HTML
      const container = document.createElement('div')
      container.style.padding = '20px'
      container.style.maxWidth = '800px'
      container.style.margin = '0 auto'
      
      // Ajouter l'en-tête personnalisé
      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; margin: 0 auto 10px; border: 2px solid #fff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <img src="${window.location.origin}/lg1.jpg" alt="Logo GYM ZONE" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin: 5px 0;">GYM ZONE</h1>
          <p style="color: #4b5563; font-size: 14px; margin: 0;">Votre salle de sport professionnelle</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
          <h2 style="font-size: 18px; color: #111827; margin: 10px 0;">FACTURE #${facture.uuid}</h2>
        </div>
      `
      
      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Facture ${facture.uuid} - GYM ZONE</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .logo { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; margin: 0 auto 10px; border: 2px solid #fff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .logo img { width: 100%; height: 100%; object-fit: cover; }
                h1 { font-size: 24px; font-weight: bold; color: #111827; margin: 5px 0; }
                .subtitle { color: #4b5563; font-size: 14px; margin: 0 0 15px; }
                .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 18px; font-weight: bold; color: #111827; margin: 10px 0; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .info-item strong { display: block; margin-bottom: 5px; color: #4b5563; font-size: 14px; }
                .info-item span { display: block; font-weight: 500; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { text-align: left; padding: 10px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; }
                td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
                .text-right { text-align: right; }
                .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
                @media print {
                  @page { margin: 0; }
                  body { padding: 20px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">
                    <img src="${window.location.origin}/lg1.jpg" alt="Logo GYM ZONE" />
                  </div>
                  <h1>GYM ZONE</h1>
                  <p class="subtitle">Votre salle de sport professionnelle</p>
                  <div class="divider"></div>
                  <h2>FACTURE #${facture.uuid}</h2>
                </div>
                
                <div class="info-grid">
                  <div>
                    <div class="info-item">
                      <strong>Date d'émission</strong>
                      <span>${new Date(facture.date_generation).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div class="info-item">
                      <strong>Client</strong>
                      <span>${facture.paiement.client}</span>
                    </div>
                  </div>
                  <div>
                    <div class="info-item">
                      <strong>Service</strong>
                      <span>${facture.paiement.abonnement?.nom || facture.paiement.seance?.titre || 'Recharge compte'}</span>
                    </div>
                    <div class="info-item">
                      <strong>Statut</strong>
                      <span>${facture.paiement.status === 'PAYE' ? 'Payé' : 'En attente'}</span>
                    </div>
                  </div>
                </div>
                
                <div class="section">
                  <h3 class="section-title">Détails du paiement</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th class="text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>${facture.paiement.abonnement?.nom || facture.paiement.seance?.titre || 'Recharge de compte'}</td>
                        <td class="text-right">${facture.paiement.montant.toLocaleString()} FCFA</td>
                      </tr>
                      <tr>
                        <td class="text-right" colspan="2">
                          <strong>Total: ${facture.paiement.montant.toLocaleString()} FCFA</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div class="footer">
                  <p>Merci pour votre confiance !</p>
                  <p>GYM ZONE - Tél: +225 XX XX XX XX - Email: contact@gymzone.ci</p>
                  <p>Cet email est une facture pour le paiement ci-dessus.</p>
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                  <button onclick="window.print()" style="padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                    Imprimer la facture
                  </button>
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
      } else {
        // Fallback si la fenêtre ne s'ouvre pas (bloqueur de popup)
        const link = document.createElement('a')
        link.href = facture.fichier_pdf_url
        link.download = `facture-${facture.uuid}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement du PDF:", error)
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
      case "ESPECE":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Espèces
          </Badge>
        )
      case "CARTE":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Carte
          </Badge>
        )
      case "CHEQUE":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Chèque
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
