"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Download, RotateCcw } from "lucide-react"
import { apiClient, type User, type Abonnement } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AbonnementClient {
  id: number
  client: User
  abonnement: Abonnement
  date_debut: string
  date_fin: string
  actif: boolean
  ticket_pdf_url?: string | null
}

export function AbonnementClientManagement() {
  const [abonnementsClients, setAbonnementsClients] = useState<AbonnementClient[]>([])
  const [clients, setClients] = useState<User[]>([])
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    client_id: "",
    abonnement_id: "",
    date_debut: new Date().toISOString().split('T')[0],
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadAbonnementsClients()
  }, [])

  const loadData = async () => {
    try {
      const [clientsData, abonnementsData] = await Promise.all([
        apiClient.getClients(),
        apiClient.getAbonnements(),
      ])
      setClients(clientsData)
      setAbonnements(Array.isArray(abonnementsData.results) ? abonnementsData.results : abonnementsData)
      // TODO: Charger les abonnements clients depuis l'API
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAbonnementsClients = async () => {
    try {
      const abonnementsClientsData = await apiClient.getAbonnementsClients()
      setAbonnementsClients(Array.isArray(abonnementsClientsData.results) ? abonnementsClientsData.results : abonnementsClientsData)
    } catch (error) {
      setAbonnementsClients([])
    }
  }

  const handleCreateAbonnementClient = async () => {
    try {
      await apiClient.createAbonnementClientDirect(formData)
      loadAbonnementsClients()
      setIsCreateDialogOpen(false)
      setFormData({
        client_id: "",
        abonnement_id: "",
        date_debut: new Date().toISOString().split('T')[0],
      })
      loadData()
      toast({
        title: "Ajout réussi",
        description: "L'abonnement client a été enregistré et la facture générée.",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "L'ajout a échoué.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Abonnements Clients</CardTitle>
              <CardDescription>Enregistrez les abonnements des clients venus sur place</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} title="Actualiser la liste">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel abonnement client
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Facture</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abonnementsClients.map((abClient) => (
                <TableRow key={abClient.id}>
                  <TableCell>{abClient.client.prenom} {abClient.client.nom}</TableCell>
                  <TableCell>{abClient.abonnement.nom}</TableCell>
                  <TableCell>{new Date(abClient.date_debut).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{new Date(abClient.date_fin).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <Badge className={abClient.actif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {abClient.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {abClient.facture_pdf_url ? (
                      <a href={abClient.facture_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        <Download className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-gray-400">Aucune</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel abonnement client</DialogTitle>
            <DialogDescription>
              Enregistrez un abonnement pour un client venu sur place
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.prenom} {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="abonnement">Abonnement</Label>
              <Select value={formData.abonnement_id} onValueChange={(value) => setFormData({ ...formData, abonnement_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un abonnement" />
                </SelectTrigger>
                <SelectContent>
                  {abonnements.map((abonnement) => (
                    <SelectItem key={abonnement.id} value={abonnement.id.toString()}>
                      {abonnement.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date_debut">Date de début</Label>
              <Input
                id="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              />
            </div>
            <div>
              <Button onClick={handleCreateAbonnementClient}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 