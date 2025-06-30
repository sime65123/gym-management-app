"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RotateCcw, Ticket, User, Calendar, Clock, X } from "lucide-react"
import { apiClient } from "@/lib/api"
import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Seance {
  id: number
  client_nom: string
  client_prenom: string
  date_jour: string
  nombre_heures: number
  montant_paye: number
  ticket_url?: string
}

interface Coach {
  id: number
  nom: string
  prenom: string
  categorie: string
}
export function SeanceManagement({ onReload }: { onReload?: () => void }) {
  const [seances, setSeances] = useState<Seance[]>([])
  const [coachs, setCoachs] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  
  const { toast } = useToast()

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const userRole = localStorage.getItem("user_role");
    setIsAdmin(userRole === "admin");
  }, []);

  // Charger les séances depuis l'API
  const loadSeances = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSeances()
      
      // Vérifier si la réponse est un tableau
      if (Array.isArray(response)) {
        setSeances(response)
      } 
      // Vérifier si c'est un objet avec une propriété results qui est un tableau
      else if (response && typeof response === 'object' && response !== null && 'results' in response && Array.isArray(response.results)) {
        setSeances(response.results)
      } 
      // Gestion des autres cas
      else {
        console.error("Format de réponse inattendu:", response)
        setSeances([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des séances:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les séances. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Charger les coachs disponibles
  const loadCoachs = useCallback(async () => {
    try {
      const response = await apiClient.getPersonnel()
      // Vérifier si la réponse contient une propriété results
      const coachsData = Array.isArray(response) 
        ? response 
        : (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results))
          ? response.results 
          : [];
      setCoachs(coachsData.filter((coach: any) => coach.categorie === "COACH"))
    } catch (error) {
      console.error("Erreur lors du chargement des coachs:", error)
    }
  }, [])

  // Charger les données au montage du composant
  useEffect(() => {
    loadSeances()
    loadCoachs()
  }, [loadSeances, loadCoachs])

  // Ouvrir le ticket PDF dans un nouvel onglet
  const handleViewTicket = (ticketUrl: string) => {
    window.open(ticketUrl, '_blank');
  };

  // Gérer la suppression d'une séance
  const handleDeleteSeance = async (id: number) => {
    try {
      await apiClient.deleteSeance(id)
      
      // Recharger la liste des séances
      await loadSeances()
      
      // Afficher un message de succès
      toast({
        title: "Succès",
        description: "La séance a été supprimée avec succès.",
      })
      
      // Appeler la fonction de rechargement parent si elle existe
      if (onReload) {
        onReload()
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la séance:", error)
      
      toast({
        title: "Erreur",
        description: "La suppression de la séance a échoué. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  // Gérer le téléchargement du ticket
  const handleDownloadTicket = async (ticketUrl: string, clientName: string) => {
    try {
      // Afficher un indicateur de chargement
      toast({
        title: "Téléchargement en cours",
        description: "Préparation du ticket...",
        duration: 2000,
      });

      // Vérifier si l'URL est valide
      if (!ticketUrl) {
        throw new Error("Aucun ticket disponible pour le téléchargement");
      }

      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      
      // Vérifier si c'est une URL complète ou un chemin relatif
      const fullUrl = ticketUrl.startsWith('http') 
        ? ticketUrl 
        : `${window.location.origin}${ticketUrl.startsWith('/') ? '' : '/'}${ticketUrl}`;
      
      // S'assurer que l'URL est absolue
      const response = await fetch(fullUrl, {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error("Impossible d'accéder au ticket");
      }

      // Définir le nom du fichier pour le téléchargement
      const fileName = `ticket-${clientName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Pour les navigateurs modernes, utiliser l'API de téléchargement
      if ('showSaveFilePicker' in window) {
        try {
          const fileResponse = await fetch(fullUrl);
          const blob = await fileResponse.blob();
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Fichier PDF',
              accept: { 'application/pdf': ['.pdf'] },
            }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          toast({
            title: "Téléchargement réussi",
            description: `Le ticket a été enregistré avec succès.`,
          });
          return;
        } catch (saveError) {
          console.warn("L'API de sélection de fichier n'est pas supportée, utilisation du téléchargement direct", saveError);
          // Continuer avec la méthode de téléchargement standard
        }
      }

      // Méthode de téléchargement standard pour les navigateurs plus anciens
      link.href = fullUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Téléchargement démarré",
        description: `Le ticket pour ${clientName} est en cours de téléchargement.`,
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement du ticket:", error);
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Le téléchargement du ticket a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  }



  // Formater la date en français
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'PPP', { locale: fr })
    } catch (error) {
      console.error("Erreur de formatage de date:", error)
      return dateString
    }
  }

  // Filtrer les séances en fonction du terme de recherche
  const filteredSeances = seances.filter(seance => {
    const searchLower = searchTerm.toLowerCase()
    return (
      seance.client_nom.toLowerCase().includes(searchLower) ||
      seance.client_prenom.toLowerCase().includes(searchLower) ||
      formatDate(seance.date_jour).toLowerCase().includes(searchLower) ||
      seance.montant_paye.toString().includes(searchTerm)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Liste des Séances</h2>
          <p className="text-sm text-muted-foreground">
            Seances payees par les clients
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input
              placeholder="Rechercher par nom, prénom, date ou montant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={loadSeances} title="Actualiser">
            <RotateCcw className="h-4 w-4" />
          </Button>

        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Montant</TableHead>
                {isAdmin && <TableHead>Ticket</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSeances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    {searchTerm 
                      ? "Aucune séance ne correspond à votre recherche" 
                      : "Aucune séance trouvée"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSeances.map((seance) => (
                  <TableRow key={seance.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{seance.client_prenom} {seance.client_nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(seance.date_jour)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{seance.nombre_heures} heure{seance.nombre_heures > 1 ? 's' : ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>{seance.montant_paye.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {seance.ticket_url ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewTicket(seance.ticket_url!)}
                            title="Voir le ticket"
                          >
                            <Ticket className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pas de ticket</span>
                        )}
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
