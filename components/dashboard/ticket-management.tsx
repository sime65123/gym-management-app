"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Eye, FileText, Calendar, Clock } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Ticket } from "@/lib/api"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

export function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getTickets()
      setTickets(Array.isArray(data) ? data : data?.results || [])
    } catch (error) {
      console.error("Erreur lors du chargement des tickets:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ?")) return
    
    try {
      await apiClient.delete(`/tickets/${ticketId}/`)
      toast({
        title: "Succès",
        description: "Ticket supprimé avec succès",
      })
      loadTickets()
    } catch (error) {
      console.error("Erreur lors de la suppression du ticket:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le ticket",
        variant: "destructive",
      })
    }
  }

  const getTicketType = (type: string) => {
    return type === "ABONNEMENT" ? "Abonnement" : "Séance"
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPpp", { locale: fr })
  }

  const viewTicket = (ticket: Ticket) => {
    window.open(`/ticket/${ticket.id}?url=${encodeURIComponent(`/api/tickets/${ticket.id}/`)}`, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date de génération</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ticket.type_ticket === "ABONNEMENT" ? (
                          <FileText className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Calendar className="h-4 w-4 text-green-500" />
                        )}
                        <span>{getTicketType(ticket.type_ticket)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(ticket.date_generation)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.type_ticket === "ABONNEMENT" 
                        ? `Abonnement #${ticket.id}` 
                        : `Séance #${ticket.id}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => viewTicket(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteTicket(ticket.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun ticket trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
