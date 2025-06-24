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
  telephone?: string
}

interface User {
  id: number
  email: string
  nom: string
  prenom: string
  telephone?: string
  role: "ADMIN" | "EMPLOYE" | "CLIENT"
  solde: number
}

interface ApiResponse<T> {
  results?: T[]
  count?: number
  next?: string
  previous?: string
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

  async createReservation(seanceId: number) {
    const response = await fetch(`${API_BASE_URL}/reservations/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ seance: seanceId }),
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
  async initPaiement(data: { montant: number; abonnement?: number; seance?: number; use_balance?: boolean }) {
    const response = await fetch(`${API_BASE_URL}/init-paiement/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse(response)
  }

  async rechargeCompte(montant: number) {
    const response = await fetch(`${API_BASE_URL}/recharge-compte/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ montant }),
    })
    return this.handleResponse(response)
  }

  async getPaiements() {
    const response = await fetch(`${API_BASE_URL}/paiements/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Factures
  async getFactures() {
    const response = await fetch(`${API_BASE_URL}/factures/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async downloadFacturePDF(factureId: number) {
    // Le backend utilise le champ fichier_pdf_url directement
    const response = await fetch(`${API_BASE_URL}/factures/${factureId}/`, {
      headers: this.getAuthHeaders(),
    })
    const facture = await this.handleResponse(response)
    // Retourner l'URL du PDF depuis le champ fichier_pdf_url
    return facture.fichier_pdf_url
  }

  async sendFactureByEmail(factureId: number) {
    // Cette méthode n'existe pas dans le backend selon la documentation
    throw new Error("Fonctionnalité non disponible")
  }

  // Charges (Admin only)
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

  // Présences
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

  // Rapports financiers (Admin only)
  async getFinancialReport() {
    const response = await fetch(`${API_BASE_URL}/financial-report/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async updateProfile(userData: any) {
    const response = await fetch(`${API_BASE_URL}/me/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  // Personnel (Admin only)
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

  // Rapport journalier des présences (Admin only)
  async getRapportJournalier() {
    const response = await fetch(`${API_BASE_URL}/presences/rapport_journalier/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }
}

export const apiClient = new ApiClient()
export type { User, LoginCredentials, RegisterData }
