const API_BASE_URL = "http://127.0.0.1:8000/api"

// Déclaration de l'interface pour étendre Error avec des propriétés personnalisées
declare global {
  interface Error {
    response?: Response;
    errors?: any;
  }
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  nom: string
  prenom: string
  telephone?: string
  password: string
}

interface PersonnelInfo {
  id: number
  nom: string
  prenom: string
  categorie: string
}

interface User {
  telephone: string
  id: number
  email: string
  nom: string
  prenom: string
  role: "ADMIN" | "EMPLOYE" | "CLIENT"
  personnel?: PersonnelInfo
  solde?: number
}

interface ApiResponse<T> {
  results?: T[]
  count?: number
  next?: string
  previous?: string
}

interface Ticket {
  id: number
  uuid: string
  date_generation: string
  type_ticket: "ABONNEMENT" | "SEANCE"
  paiement: any
  fichier_pdf_url: string
}

export interface Seance {
  id: number
  titre: string
  description: string
  date_heure: string
  coach: {
    id: number
    nom: string
    prenom: string
    categorie: string
  } | null
  capacite: number
  client_id?: number | null
  client_nom?: string | null
  client_prenom?: string | null
  client_email?: string | null
  date_jour?: string | null
  nombre_heures?: number | null
  montant_paye?: number | null
  paye_directement?: boolean
  ticket_id?: number | null
  ticket_pdf_url?: string | null
}

export interface Reservation {
  id: number
  client: number | { id: number; nom: string; prenom: string; email: string }
  client_nom?: string
  client_prenom?: string
  seance: any
  date_reservation: string
  statut: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE"
  paye?: boolean
  ticket_pdf_url?: string | null
  facture_pdf_url?: string | null
  date_heure_souhaitee?: string | null
  nombre_heures?: number
  montant_calcule?: number | null
  description?: string
}


export interface Charge {
  id: number
  titre: string
  montant: number
  date: string
  description: string
  created_at: string
  updated_at: string
}

export interface FinancialData {
  total_revenue: number
  total_expenses: number
  total_charges: number
  profit: number
  active_clients: number
  monthly_stats?: Array<{
    month: string
    revenue: number
    expenses: number
    charges: number
    profit: number
  }>
  subscription_stats?: Array<{
    name: string
    count: number
    revenue: number
  }>
  session_stats?: Array<{
    title: string
    bookings: number
    revenue: number
  }>
}

export interface HistoriquePaiement {
  id: number
  abonnement_presentiel: number
  montant_ajoute: number
  montant_total_apres: number
  date_modification: string
  client_nom: string
  client_prenom: string
}

export interface AbonnementClientPresentiel {
  id: number
  client: number | null
  client_nom: string
  client_prenom: string
  abonnement: number
  abonnement_nom: string
  abonnement_prix: number
  date_debut: string
  date_fin: string
  montant_total: number
  montant_paye: number
  statut_paiement: 'PAIEMENT_INACHEVE' | 'PAIEMENT_TERMINE'
  statut: 'EN_COURS' | 'TERMINE' | 'EXPIRE'
  date_creation: string
  employe_creation: number | null
  employe_nom?: string
  employe_prenom?: string
  paiements_tranches: PaiementTranche[]
  historique_paiements: HistoriquePaiement[]
  facture_pdf_url?: string | null
}

export interface PaiementTranche {
  id: number
  abonnement_presentiel: number
  montant: number
  date_paiement: string
  mode_paiement: 'ESPECE' | 'CARTE' | 'CHEQUE'
  employe: number | null
  employe_nom?: string
  employe_prenom?: string

}

class ApiClient {
  private getAuthHeaders(): { [key: string]: string } {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Une erreur est survenue" }))
      throw new Error(error.message || `Erreur ${response.status}`)
    }
    return response.json()
  }

  // Authentication
  async login(credentials: LoginCredentials) {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    const data = await this.handleResponse<{ access: string; refresh: string }>(response)
    localStorage.setItem("access_token", data.access)
    localStorage.setItem("refresh_token", data.refresh)
    return data
  }

  async register(userData: RegisterData) {
    // Ajout du rôle CLIENT par défaut
    const userDataWithRole = {
      ...userData,
      role: "CLIENT"
    };
    
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userDataWithRole),
    })
    return this.handleResponse(response)
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/me/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<User>(response)
  }

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    return this.handleResponse(
      await fetch(`${API_BASE_URL}/tickets/`, {
        headers: this.getAuthHeaders(),
      })
    )
  }

  // Récupérer les tickets pour une réservation spécifique
  async getTicketsByReservation(reservationId: number): Promise<Ticket[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/by-reservation/${reservationId}/`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des tickets: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Données des tickets reçues:', data);
      
      // Gérer à la fois les formats de réponse possibles
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tickets:', error);
      throw error;
    }
  }

  async updateProfile(userData: Partial<User> & { currentPassword?: string; newPassword?: string }): Promise<User> {
    try {
      // Préparer les données à envoyer
      const dataToSend: any = { ...userData };
      
      // Si un nouveau mot de passe est fourni, on l'ajoute dans le format attendu
      if (userData.newPassword) {
        dataToSend.password = userData.newPassword;
      }
      
      // On ne veut pas envoyer ces champs supplémentaires au backend
      delete dataToSend.currentPassword;
      delete dataToSend.newPassword;
      
      console.log('Envoi des données de mise à jour du profil:', dataToSend);
      
      const response = await fetch(`${API_BASE_URL}/me/`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur lors de la mise à jour du profil:', errorData);
        throw new Error(errorData.detail || 'Erreur lors de la mise à jour du profil');
      }
      
      const updatedUser = await response.json();
      return updatedUser;
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) throw new Error("No refresh token")

    const response = await fetch(`${API_BASE_URL}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    const data = await this.handleResponse<{ access: string }>(response)
    localStorage.setItem("access_token", data.access)
    return data
  }

  logout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  }

  // Users (Admin only)
  async getUsers(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<ApiResponse<User>>(response)
  }

  async createUser(userData: any) {
    try {
      // Créer une copie des données pour éviter les effets de bord
      const requestData = { ...userData };
      
      // Forcer le type de rôle à être une chaîne valide
      if (requestData.role && typeof requestData.role === 'string') {
        requestData.role = requestData.role.toUpperCase();
      } else {
        requestData.role = 'CLIENT';
      }
      
      // S'assurer que le mot de passe est une chaîne
      if (requestData.password === undefined || requestData.password === null) {
        requestData.password = ''; // Le backend devrait gérer la validation
      }
      
      const url = `${API_BASE_URL}/users/`;
      const headers = {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Log des données avant envoi
      console.log('======= DONNÉES UTILISATEUR AVANT ENVOI =======');
      console.log('URL:', url);
      console.log('Méthode: POST');
      console.log('En-têtes:', headers);
      console.log('Données brutes:', userData);
      console.log('Données traitées:', requestData);
      console.log('Rôle dans les données traitées:', requestData.role);
      console.log('Corps de la requête (stringifié):', JSON.stringify(requestData, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData),
      });

      // Log de la réponse brute
      console.log('======= RÉPONSE DU SERVEUR =======');
      console.log('Statut:', response.status, response.statusText);
      console.log('En-têtes:', Object.fromEntries(response.headers.entries()));
      
      // Lire le corps de la réponse une seule fois
      const responseText = await response.text();
      let responseData: any = {};
      
      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log('Corps de la réponse (JSON):', responseData);
          console.log('Rôle dans la réponse:', responseData.role);
        }
      } catch (e) {
        console.error('Erreur lors du parsing de la réponse JSON:', e);
        console.log('Corps de la réponse (texte brut):', responseText);
      }

      if (!response.ok) {
        console.error('======= ERREUR DU SERVEUR =======');
        console.error('Statut:', response.status, response.statusText);
        
        // Utiliser responseData déjà parsé
        const errorData = responseData || {};
        console.error('Détails de l\'erreur:', errorData);
        
        // Vérifier si le rôle est présent dans la réponse d'erreur
        if (errorData.role) {
          console.error('Rôle dans la réponse d\'erreur:', errorData.role);
        }
        
        // Gestion des erreurs de validation
        if (response.status === 400) {
          const errorMessages = [];
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${errors}`);
            }
          }
          throw new Error(errorMessages.join('\n'));
        }
        
        throw new Error(errorData.detail || errorData.message || `Erreur lors de la création de l'utilisateur (${response.status} ${response.statusText})`);
      }

      // Retourner les données déjà parsées
      return responseData;
    } catch (error) {
      console.error('Erreur dans createUser:', error)
      throw error
    }
  }

  async updateUser(id: number, userData: any) {
    const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Une erreur est survenue" }))
      throw new Error(error.message || `Erreur ${response.status}`)
    }
    
    // Pour une suppression réussie, on ne s'attend pas à avoir de contenu dans la réponse
    if (response.status !== 204) { // 204 No Content est la réponse standard pour DELETE
      try {
        return await response.json()
      } catch (e) {
        // Si la réponse n'est pas du JSON, on ignore car la suppression a réussi
        return
      }
    }
  }

  // Abonnements
  async getAbonnements() {
    const response = await fetch(`${API_BASE_URL}/abonnements/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createAbonnement(data: any) {
    const response = await fetch(`${API_BASE_URL}/abonnements/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async updateAbonnement(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/abonnements/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deleteAbonnement(id: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    
    // Pour les réponses DELETE, on ne s'attend pas à du contenu
    if (response.status === 204) {
      return { success: true }
    }
    
    // Si on a du contenu, on le parse
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.indexOf('application/json') !== -1) {
      return response.json()
    }
    
    return { success: true }
  }

  async getClientsAbonnes(abonnementId: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements/${abonnementId}/clients/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Séances
  async getSeances() {
    const response = await fetch(`${API_BASE_URL}/seances/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createSeance(data: any) {
    const response = await fetch(`${API_BASE_URL}/seances/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async updateSeance(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/seances/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deleteSeance(id: number) {
    const response = await fetch(`${API_BASE_URL}/seances/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getSeanceParticipants(seanceId: number) {
    const response = await fetch(`${API_BASE_URL}/seances/${seanceId}/participants/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getCoachs() {
    const response = await fetch(`${API_BASE_URL}/seances/coachs/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Réservations
  async getReservations() {
    const response = await fetch(`${API_BASE_URL}/reservations/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createReservation(data: { 
    date_heure_souhaitee: string; 
    nombre_heures: number; 
    description?: string;
    montant: number;
    type_ticket: string;
    statut?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/reservations/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        date_heure_souhaitee: data.date_heure_souhaitee,
        nombre_heures: data.nombre_heures,
        description: data.description || "",
        montant: data.montant,
        type_ticket: data.type_ticket,
        statut: data.statut || 'EN_ATTENTE'
      }),
    })
    return this.handleResponse(response)
  }

  async updateReservation(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deleteReservation(id: number) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Paiements
  async getPaiements() {
    const response = await fetch(`${API_BASE_URL}/paiements/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Validation des paiements (Employé)
  async validerPaiement(paiementId: number) {
    const response = await fetch(`${API_BASE_URL}/valider-paiement/${paiementId}/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Paiement direct à la salle (Employé)
  async paiementDirect(data: {
    client_id: number
    montant: number
    mode_paiement?: string
    abonnement_id?: number
    seance_id?: number
  }) {
    const response = await fetch(`${API_BASE_URL}/paiement-direct/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  // Abonnement direct à la salle (Employé)
  async abonnementDirect(data: {
    client_id: number
    abonnement_id: number
    mode_paiement?: string
  }) {
    const response = await fetch(`${API_BASE_URL}/abonnement-direct/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  // La méthode getTickets est déjà définie plus haut, cette déclaration en double est supprimée

  async downloadTicketPDF(ticketId: number) {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/`, {
      headers: this.getAuthHeaders(),
    })
    const ticket = await this.handleResponse<Ticket>(response)
    
    if (ticket.fichier_pdf_url) {
      window.open(ticket.fichier_pdf_url, '_blank')
    }
  }

  // Charges
  async getCharges() {
    const response = await fetch(`${API_BASE_URL}/charges/`, {
      headers: this.getAuthHeaders(),
    })
    const data = await response.json()
    
    // Handle both array and { results: [] } response formats
    if (Array.isArray(data)) {
      return data
    } else if (data && Array.isArray(data.results)) {
      return data.results
    }
    
    return []
  }

  async createCharge(data: any) {
    const response = await fetch(`${API_BASE_URL}/charges/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async updateCharge(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/charges/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deleteCharge(id: number) {
    const response = await fetch(`${API_BASE_URL}/charges/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Présence Personnel
  async getPresences() {
    const response = await fetch(`${API_BASE_URL}/presences/?page_size=1000`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createPresence(data: { date: string; present: boolean; commentaire?: string }) {
    const response = await fetch(`${API_BASE_URL}/presences/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async updatePresence(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/presences/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deletePresence(id: number) {
    const response = await fetch(`${API_BASE_URL}/presences/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Rapports Financiers
  async getFinancialReport(): Promise<{
    total_revenue: number
    total_expenses: number
    total_charges: number
    profit: number
    active_clients: number
    monthly_stats?: Array<{
      month: string
      revenue: number
      expenses: number
      charges: number
      profit: number
    }>
    subscription_stats?: Array<{
      name: string
      count: number
      revenue: number
    }>
    session_stats?: Array<{
      title: string
      bookings: number
      revenue: number
    }>
  }> {
    const response = await fetch(`${API_BASE_URL}/financial-report/`, {
      headers: this.getAuthHeaders(),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch financial report')
    }
    
    return response.json()
  }

  // La méthode updateProfile est déjà définie plus haut avec une meilleure implémentation

  // Personnel
  async getPersonnel() {
    const response = await fetch(`${API_BASE_URL}/personnel/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createPersonnel(data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/personnel/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.detail || 'Erreur lors de la création du personnel')
        error.response = response
        error.errors = errorData
        throw error
      }
      
      return await response.json()
    } catch (error) {
      console.error("Erreur dans createPersonnel:", error)
      throw error
    }
  }

  async updatePersonnel(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deletePersonnel(id: number) {
    const response = await fetch(`${API_BASE_URL}/personnel/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    
    // Pour les réponses DELETE, on ne s'attend pas à du contenu
    if (response.status === 204) {
      return { success: true }
    }
    
    // Si on a du contenu, on le parse
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    
    return { success: true }
  }

  // Rapport journalier
  async getRapportJournalier() {
    const response = await fetch(`${API_BASE_URL}/presences/rapport_journalier/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getClients(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/?role=CLIENT`, {
      headers: this.getAuthHeaders(),
    })
    const data = await this.handleResponse<ApiResponse<User>>(response)
    return data.results || []
  }

  async createSeanceDirect(data: any) {
    const response = await fetch(`${API_BASE_URL}/seances/direct/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse<Seance>(response)
  }

  // La méthode getTicketsByReservation est déjà définie plus haut, cette déclaration en double est supprimée

  async validerReservation(reservationId: number) {
    const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/valider/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createAbonnementReservation(abonnementId: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements-client/reserver/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ abonnement_id: abonnementId }),
    })
    return this.handleResponse(response)
  }

  // Abonnements clients (employé)
  async getAbonnementsClients() {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createAbonnementClientDirect(data: { client_id: string; abonnement_id: string; date_debut: string }) {
    const response = await fetch(`${API_BASE_URL}/abonnements-client/direct/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  // Abonnements clients présentiels
  async getAbonnementsClientsPresentiels() {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createAbonnementClientPresentiel(data: any) {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async updateAbonnementClientPresentiel(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async deleteAbonnementClientPresentiel(id: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async ajouterPaiementTranche(abonnementId: number, data: { montant: number; mode_paiement?: string }) {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/${abonnementId}/ajouter_paiement/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async genererFactureAbonnementPresentiel(abonnementId: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/${abonnementId}/generer_facture/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async modifierMontantPaye(abonnementId: number, montantAjoute: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/${abonnementId}/modifier_montant_paye/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ montant_ajoute: montantAjoute }),
    })
    return this.handleResponse(response)
  }

  async telechargerFactureAbonnementPresentiel(abonnementId: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/${abonnementId}/telecharger_facture/`, {
      headers: this.getAuthHeaders(),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Une erreur est survenue" }))
      throw new Error(error.message || `Erreur ${response.status}`)
    }
    
    // Retourner le blob pour le téléchargement
    return response.blob()
  }
}


// Export types
export type { User, Ticket, ApiResponse }

// Export Charge interface
// Export API client instance

export const apiClient = new ApiClient()
