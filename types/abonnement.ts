export interface HistoriquePaiementItem {
  id: number;
  montant?: number;
  date_paiement?: string;
  mode_paiement: string;
  reference: string;
  montant_ajoute: number;
  montant_total_apres: number;
  date_modification: string;
}

export interface AbonnementClientPresentiel {
  id: number;
  client?: number;
  client_nom: string;
  client_prenom: string;
  abonnement: {
    id: number;
    nom: string;
    duree_jours: number;
    prix: number;
  };
  abonnement_nom: string;
  date_debut: string;
  date_fin: string;
  montant_paye: number;
  montant_total: number;
  statut_paiement: 'EN_ATTENTE' | 'PARTIEL' | 'PAIEMENT_TERMINE' | 'PAIEMENT_INACHEVE' | 'PAIEMENT_TERMINE';
  statut: 'EN_COURS' | 'TERMINE' | 'EXPIRE';
  facture_pdf_url?: string;
  historique_paiements: HistoriquePaiementItem[];
  employe_creation?: number;
  date_creation?: string;
}
