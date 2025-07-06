export interface CoachDetails {
  id: number;
  prenom: string;
  nom: string;
  // Ajoutez d'autres propriétés si nécessaire
}

export interface Seance {
  id: number;
  client_nom: string;
  client_prenom: string;
  date_jour: string;
  nombre_heures: number;
  montant_paye: number;
  coach_id?: number | null;
  coach_details?: CoachDetails | null;
  // Ajoutez d'autres propriétés si nécessaire
}
