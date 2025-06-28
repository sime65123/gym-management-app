const API_BASE_URL = "http://127.0.0.1:8000/api"

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  nom: string
  prenom: string
  password: string
}

interface User {
  id: number
  email: string
  nom: string
  prenom: string
  role: "ADMIN" | "EMPLOYE" | "CLIENT"
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

class ApiClient {
  private getAuthHeaders() {
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
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/me/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<User>(response)
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
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async updateUser(id: number, userData: any) {
    const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async deleteUser(id: number) {
    const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
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
    return this.handleResponse(response)
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

  async createReservation(data: { date_heure_souhaitee: string; nombre_heures: number; description?: string }) {
    const response = await fetch(`${API_BASE_URL}/reservations/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
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

  // Tickets (remplace Factures)
  async getTickets(): Promise<ApiResponse<Ticket>> {
    const response = await fetch(`${API_BASE_URL}/tickets/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<ApiResponse<Ticket>>(response)
  }

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
    return this.handleResponse(response)
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
    const response = await fetch(`${API_BASE_URL}/presences/`, {
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
  async getFinancialReport() {
    const response = await fetch(`${API_BASE_URL}/financial-report/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Profil utilisateur
  async updateProfile(userData: any) {
    const response = await fetch(`${API_BASE_URL}/me/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  // Personnel
  async getPersonnel() {
    const response = await fetch(`${API_BASE_URL}/personnel/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createPersonnel(data: any) {
    const response = await fetch(`${API_BASE_URL}/personnel/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
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
    return this.handleResponse(response)
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

  async getTicketsByReservation(reservationId: number): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/?reservation=${reservationId}`, {
      headers: this.getAuthHeaders(),
    })
    const data = await this.handleResponse<ApiResponse<Ticket>>(response)
    return data.results || []
  }

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
}

export const apiClient = new ApiClient()
export type { User, Ticket, ApiResponse }
