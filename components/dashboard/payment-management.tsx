"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CreditCard, CheckCircle, Clock, User, DollarSign } from "lucide-react";
import { apiClient, type User as UserType } from "@/lib/api";

interface Paiement {
  id: number;
  client: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  montant: number;
  date_paiement: string;
  status: "EN_ATTENTE" | "PAYE" | "ECHEC";
  mode_paiement: "ESPECE" | "CARTE" | "CHEQUE";
  abonnement?: { nom: string; prix: number };
  seance?: { titre: string };
  reservation?: { id: number };
}

interface Abonnement {
  id: number;
  nom: string;
  description: string;
  prix: number;
  duree_jours: number;
  actif: boolean;
}

interface Seance {
  id: number;
  titre: string;
  description: string;
  date_heure: string;
  coach: string;
  capacite: number;
}

export function PaymentManagement() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [clients, setClients] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les modales
  const [isPaiementDirectOpen, setIsPaiementDirectOpen] = useState(false);
  const [isAbonnementDirectOpen, setIsAbonnementDirectOpen] = useState(false);

  // Define the interface for the payment form data
  interface PaiementFormData {
    client_id: string;
    montant: number;
    mode_paiement: "ESPECE" | "CARTE" | "CHEQUE";
    seance_id: string;
    abonnement_id: string;
  }

  // États pour les formulaires
  const [paiementDirectData, setPaiementDirectData] = useState<PaiementFormData>({
    client_id: "",
    montant: 0,
    mode_paiement: "ESPECE",
    seance_id: "",
    abonnement_id: "",
  });

  const [abonnementDirectData, setAbonnementDirectData] = useState({
    client_id: "",
    abonnement_id: "",
    mode_paiement: "ESPECE",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paiementsData, abonnementsData, seancesData, clientsData] = await Promise.all([
        apiClient.getPaiements(),
        apiClient.getAbonnements(),
        apiClient.getSeances(),
        apiClient.getUsers(),
      ]);

      setPaiements((paiementsData as any).results || (paiementsData as Paiement[]));
      setAbonnements((abonnementsData as any).results || (abonnementsData as Abonnement[]));
      setSeances((seancesData as any).results || (seancesData as Seance[]));
      setClients((clientsData as any).results || (clientsData as UserType[]));
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValiderPaiement = async (paiementId: number) => {
    try {
      await apiClient.validerPaiement(paiementId);
      alert("Paiement validé avec succès!");
      loadData();
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      alert("Erreur lors de la validation du paiement");
    }
  };

  const handlePaiementDirect = async () => {
    try {
      if (!paiementDirectData.client_id || !paiementDirectData.montant) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }

      await apiClient.paiementDirect({
        client_id: parseInt(paiementDirectData.client_id),
        montant: parseFloat(paiementDirectData.montant),
        mode_paiement: paiementDirectData.mode_paiement,
        seance_id: paiementDirectData.seance_id ? parseInt(paiementDirectData.seance_id) : undefined,
        abonnement_id: paiementDirectData.abonnement_id ? parseInt(paiementDirectData.abonnement_id) : undefined,
      });

      alert("Paiement enregistré avec succès!");
      setIsPaiementDirectOpen(false);
      setPaiementDirectData({
        client_id: "",
        montant: "",
        mode_paiement: "ESPECE",
        seance_id: "",
        abonnement_id: "",
      });
      loadData();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement du paiement");
    }
  };

  const handleAbonnementDirect = async () => {
    try {
      if (!abonnementDirectData.client_id || !abonnementDirectData.abonnement_id) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }

      await apiClient.abonnementDirect({
        client_id: parseInt(abonnementDirectData.client_id),
        abonnement_id: parseInt(abonnementDirectData.abonnement_id),
        mode_paiement: abonnementDirectData.mode_paiement,
      });

      alert("Abonnement enregistré avec succès!");
      setIsAbonnementDirectOpen(false);
      setAbonnementDirectData({
        client_id: "",
        abonnement_id: "",
        mode_paiement: "ESPECE",
      });
      loadData();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement de l'abonnement");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAYE":
        return <Badge className="bg-green-100 text-green-800">Payé</Badge>;
      case "EN_ATTENTE":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case "ECHEC":
        return <Badge className="bg-red-100 text-red-800">Échec</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const paiementsEnAttente = paiements.filter((p) => p.status === "EN_ATTENTE");
  const paiementsPayes = paiements.filter((p) => p.status === "PAYE");
  const clientsClients = clients.filter((c) => c.role === "CLIENT");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gestion des Paiements
          </CardTitle>
          <CardDescription>
            Validez les paiements en attente et enregistrez les paiements directs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Dialog open={isPaiementDirectOpen} onOpenChange={setIsPaiementDirectOpen}>
              <DialogTrigger asChild>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Paiement Direct
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer un Paiement Direct</DialogTitle>
                  <DialogDescription>
                    Enregistrez un paiement effectué directement à la salle
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={paiementDirectData.client_id}
                      onValueChange={(value) => setPaiementDirectData({ ...paiementDirectData, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsClients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.prenom} {client.nom} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="montant">Montant</Label>
                    <Input
                      type="number"
                      value={paiementDirectData.montant}
                      onChange={(e) =>
                        setPaiementDirectData({
                          ...paiementDirectData,
                          montant: parseFloat(e.target.value) || 0,
                        })
                      }
                      id="montant"
                      placeholder="Entrez le montant"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mode_paiement">Mode de Paiement</Label>
                    <Select
                      value={paiementDirectData.mode_paiement}
                      onValueChange={(value) => setPaiementDirectData({ ...paiementDirectData, mode_paiement: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ESPECE">Espèces</SelectItem>
                        <SelectItem value="CARTE">Carte</SelectItem>
                        <SelectItem value="CHEQUE">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="seance">Séance (optionnel)</Label>
                    <Select
                      value={paiementDirectData.seance_id}
                      onValueChange={(value) => setPaiementDirectData({ ...paiementDirectData, seance_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une séance" />
                      </SelectTrigger>
                      <SelectContent>
                        {seances.map((seance) => (
                          <SelectItem key={seance.id} value={seance.id.toString()}>
                            {seance.titre} - {new Date(seance.date_heure).toLocaleString("fr-FR")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="abonnement">Abonnement (optionnel)</Label>
                    <Select
                      value={paiementDirectData.abonnement_id}
                      onValueChange={(value) => setPaiementDirectData({ ...paiementDirectData, abonnement_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un abonnement" />
                      </SelectTrigger>
                      <SelectContent>
                        {abonnements.filter((a) => a.actif).map((abonnement) => (
                          <SelectItem key={abonnement.id} value={abonnement.id.toString()}>
                            {abonnement.nom} - {abonnement.prix.toLocaleString()} FCFA
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handlePaiementDirect} className="w-full">
                    Enregistrer le Paiement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAbonnementDirectOpen} onOpenChange={setIsAbonnementDirectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Abonnement Direct
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer un Abonnement Direct</DialogTitle>
                  <DialogDescription>
                    Enregistrez un abonnement payé directement à la salle
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={abonnementDirectData.client_id}
                      onValueChange={(value) => setAbonnementDirectData({ ...abonnementDirectData, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsClients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.prenom} {client.nom} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="abonnement">Abonnement *</Label>
                    <Select
                      value={abonnementDirectData.abonnement_id}
                      onValueChange={(value) => setAbonnementDirectData({ ...abonnementDirectData, abonnement_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un abonnement" />
                      </SelectTrigger>
                      <SelectContent>
                        {abonnements.filter((a) => a.actif).map((abonnement) => (
                          <SelectItem key={abonnement.id} value={abonnement.id.toString()}>
                            {abonnement.nom} - {abonnement.prix.toLocaleString()} FCFA
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mode_paiement">Mode de Paiement</Label>
                    <Select
                      value={abonnementDirectData.mode_paiement}
                      onValueChange={(value) => setAbonnementDirectData({ ...abonnementDirectData, mode_paiement: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ESPECE">Espèces</SelectItem>
                        <SelectItem value="CARTE">Carte</SelectItem>
                        <SelectItem value="CHEQUE">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAbonnementDirect} className="w-full">
                    Enregistrer l'Abonnement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="en-attente" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="en-attente">
            <Clock className="h-4 w-4 mr-2" />
            En Attente ({paiementsEnAttente.length})
          </TabsTrigger>
          <TabsTrigger value="payes">
            <CheckCircle className="h-4 w-4 mr-2" />
            Payés ({paiementsPayes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en-attente">
          <Card>
            <CardHeader>
              <CardTitle>Paiements en Attente</CardTitle>
              <CardDescription>Validez les paiements des clients qui ont réservé en ligne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paiementsEnAttente.map((paiement) => (
                  <Card key={paiement.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-semibold">
                              {paiement.client.prenom} {paiement.client.nom}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Email: {paiement.client.email}</div>
                            <div>Montant: {paiement.montant.toLocaleString()}</div>
                            <div>Date: {new Date(paiement.date_paiement).toLocaleString("fr-FR")}</div>
                            {paiement.abonnement && (
                              <div>Abonnement: {paiement.abonnement.nom}</div>
                            )}
                            {paiement.seance && (
                              <div>Séance: {paiement.seance.titre}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(paiement.status)}
                          <Button
                            size="sm"
                            onClick={() => handleValiderPaiement(paiement.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {paiementsEnAttente.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Aucun paiement en attente</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payes">
          <Card>
            <CardHeader>
              <CardTitle>Paiements Validés</CardTitle>
              <CardDescription>Historique des paiements validés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paiementsPayes.map((paiement) => (
                  <Card key={paiement.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-semibold">
                              {paiement.client.prenom} {paiement.client.nom}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Email: {paiement.client.email}</div>
                            <div>Montant: {paiement.montant.toLocaleString()} </div>
                            <div>Date: {new Date(paiement.date_paiement).toLocaleString("fr-FR")}</div>
                            <div>Mode: {paiement.mode_paiement}</div>
                            {paiement.abonnement && (
                              <div>Abonnement: {paiement.abonnement.nom}</div>
                            )}
                            {paiement.seance && (
                              <div>Séance: {paiement.seance.titre}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(paiement.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {paiementsPayes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Aucun paiement validé</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 