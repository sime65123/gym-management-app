"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Eye, FileText, Calendar, Clock } from "lucide-react"
import { apiClient, Ticket } from "@/lib/api"
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
      setLoading(true);
      const response = await apiClient.getTickets() as { results?: Ticket[] } | Ticket[];
      console.log("Données des tickets chargées:", response);
      
      // Gérer les différents formats de réponse
      if (response && typeof response === 'object' && 'results' in response) {
        setTickets(Array.isArray(response.results) ? response.results : []);
      } 
      // Si c'est directement un tableau
      else if (Array.isArray(response)) {
        setTickets(response);
      } else {
        console.error("Format de réponse inattendu:", response);
        setTickets([]);
        toast({
          title: "Erreur de format",
          description: "Le format des données reçues est incorrect.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des tickets:", error);
      
      let errorMessage = "Échec du chargement des tickets";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à accéder à ces données. Veuillez vous reconnecter.";
        } else if (status === 500) {
          errorMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        } else if (data && data.detail) {
          errorMessage = data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ?")) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://typhanieyel.pythonanywhere.com/api'}/tickets/${ticketId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      toast({
        title: "Succès",
        description: "Ticket supprimé avec succès",
        duration: 5000,
      });
      
      // Recharger la liste des tickets
      loadTickets();
    } catch (error: any) {
      console.error("Erreur lors de la suppression du ticket:", error);
      
      let errorMessage = "Impossible de supprimer le ticket";
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`Erreur HTTP ${status}:`, data);
        
        if (status === 401 || status === 403) {
          errorMessage = "Vous n'êtes pas autorisé à effectuer cette action.";
        } else if (status === 404) {
          errorMessage = "Le ticket spécifié est introuvable.";
        } else if (data && data.detail) {
          errorMessage = data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
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
