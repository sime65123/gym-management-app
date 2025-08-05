
//export const API_BASE_URL = "http://127.0.0.1:8000/api" 
export const API_BASE_URL = "https://typhanieyel.pythonanywhere.com/api"

  // export const API_BASE_URL = "http://127.0.0.1:8000/api" 
//export const API_BASE_URL = "https://33fd2f83-888e-4b9d-a899-f82716e74537-00-2i0tlxi804sf6.spock.replit.dev/api"


// Déclaration de l'interface pour étendre Error avec des propriétés personnalisées
declare global {
  interface Error {
    response?: Response;
    data?: any;
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

export interface PresenceRapport {
  id: number
  personnel?: PersonnelInfo
  employe?: {
    id: number
    nom: string
    prenom: string
    email: string
    role?: string
  }
  statut: "PRESENT" | "ABSENT"
  heure_arrivee: string
  date_jour: string
}

export interface Abonnement {
  id: number
  nom: string
  description: string
  prix: number
  duree_jours: number
  actif: boolean
}

export interface HistoriquePaiementItem {
  id: number
  montant_ajoute: number
  montant_total_apres: number
  date_modification: string
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
  historique_paiements: HistoriquePaiementItem[]
  facture_pdf_url?: string | null
}

export interface FactureResponse {
  facture_url: string
  message?: string
}

export interface User {
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

export interface Ticket {
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
  id: number;
  nom_client: string;
  type_reservation: 'SEANCE' | 'ABONNEMENT';
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE';
  description: string;
  montant: number;
  montant_total_paye?: string;
  ticket_url?: string;
  
  // Champs techniques
  created_at?: string;
  updated_at?: string;
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

export interface Paiement {
  id: number
  montant: number
  date_paiement: string
  mode_paiement: 'ESPECE' | 'CARTE' | 'CHEQUE' | 'VIREMENT' | 'AUTRE'
  statut: 'EN_ATTENTE' | 'VALIDE' | 'ANNULE' | 'REMBOURSE'
  reference: string
  client_id: number
  client_nom: string
  client_prenom: string
  reservation_id?: number
  created_at: string
  updated_at: string
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
    const token = localStorage.getItem("access_token");
    console.log('Token d\'accès actuel:', token ? 'Présent' : 'Manquant');
    
    if (!token) {
      console.warn('Aucun token d\'accès trouvé dans le localStorage');
    return {
      "Content-Type": "application/json",
      };
    }
    
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  /**
   * Normalise les données de liste pour gérer à la fois les tableaux simples
   * et les réponses paginées avec une propriété `results`
   */
  private normalizeList<T>(data: any): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ('results' in data && Array.isArray(data.results)) return data.results;
    return [];
  }

  private async handleResponse<T = any>(response: Response): Promise<T> {
    console.log(`Réponse reçue - Status: ${response.status} ${response.statusText}`, response);
    
    // Si la réponse est vide (comme pour une suppression réussie), on retourne une valeur par défaut
    if (response.status === 204) {
      return undefined as T;
    }
    
    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      let errorData: any = {};
      
      try {
        const text = await response.text();
        
        // Essayer de parser le JSON
        try {
          errorData = JSON.parse(text);
          errorMessage = errorData.detail || errorData.message || errorMessage;
          
          // Ajouter les erreurs de validation si elles existent
          if (errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            errorMessage += ` | Détails: ${errorMessages}`;
          }
        } catch (e) {
          // Si ce n'est pas du JSON, utiliser le texte brut
          errorData = { raw: text };
          
          // Gestion des erreurs HTML (comme les pages d'erreur Django)
          if (text.includes('<html>')) {
            errorMessage = 'Le serveur a renvoyé une page HTML au lieu de données.';
            
            // Essayer d'extraire un message d'erreur de la page HTML
            const errorMatch = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            if (errorMatch && errorMatch[1]) {
              const errorDetails = errorMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
              errorMessage += ` Détails: ${errorDetails.substring(0, 200)}...`;
            }
          } else if (text) {
            errorMessage = text.substring(0, 200);
          }
        }
      } catch (e) {
        console.error('Erreur lors de la lecture de la réponse:', e);
        errorMessage = `Erreur lors de la lecture de la réponse du serveur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`;
      }
      
      // Si l'erreur est liée à l'authentification, on déconnecte l'utilisateur
      if (response.status === 401 || response.status === 403) {
        console.warn('Erreur d\'autorisation, déconnexion...');
        // On supprime les tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // On redirige vers la page de connexion
          window.location.href = '/login';
        }
      }
      
      // Créer et lancer l'erreur
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.data = errorData;
      error.response = response;
      
      console.error('Erreur API:', { 
        status: response.status, 
        statusText: response.statusText,
        url: response.url,
        message: errorMessage, 
        data: errorData 
      });
      
      throw error;
    }
    
    try {
      // Si la réponse est vide, retourner une valeur par défaut en fonction du type attendu
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || !contentLength) {
        return undefined as T;
      }
      
      const data = await response.json();
      return data as T;
    } catch (e) {
      console.error('Erreur lors du parsing de la réponse JSON:', e);
      // Si on ne peut pas parser la réponse comme JSON, retourner une valeur par défaut
      return undefined as T;
    }
  }

  // Authentication
  async login(credentials: LoginCredentials) {
    console.log('Tentative de connexion avec les identifiants:', JSON.stringify(credentials, null, 2));
    
    try {
      // Vérifier que l'URL de l'API est correcte
      const loginUrl = `${API_BASE_URL}/login/`;
      console.log('URL de connexion:', loginUrl);
      
      const response = await fetch(loginUrl, {
      method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Accept': 'application/json'
        },
      body: JSON.stringify(credentials),
        credentials: 'include' // Important pour les cookies de session
      });
      
      console.log('Réponse brute du serveur:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      // Essayer d'abord de lire le texte de la réponse pour le débogage
      const responseText = await response.text();
      console.log('Réponse texte brute:', responseText);
      
      // Essayer de parser le JSON si possible
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Erreur lors du parsing de la réponse JSON:', e);
        throw new Error('Réponse du serveur invalide');
      }
      
      if (!response.ok) {
        console.error('Erreur de connexion - Détails:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Gestion spécifique des erreurs courantes
        if (response.status === 400) {
          throw new Error(data.detail || 'Identifiants invalides');
        } else if (response.status === 401) {
          throw new Error('Non autorisé. Veuillez vérifier vos identifiants.');
        } else if (response.status === 403) {
          throw new Error('Accès refusé. Votre compte n\'a pas les permissions nécessaires.');
        } else if (response.status >= 500) {
          throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
        } else {
          throw new Error(data.detail || `Erreur lors de la connexion: ${response.statusText}`);
        }
      }
      
      console.log('Réponse de connexion réussie:', data);
      
      // Vérification des données requises
      if (!data.access) {
        console.error('Token d\'accès manquant dans la réponse:', data);
        throw new Error('Réponse de connexion invalide: token d\'accès manquant');
      }
      
      if (!data.refresh) {
        console.warn('Token de rafraîchissement manquant dans la réponse');
      }
      
      // Stockage des tokens
      localStorage.setItem("access_token", data.access);
      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
      }
      
      console.log('Tokens enregistrés avec succès dans le localStorage');
      return data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
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
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await this.handleResponse<any>(response);
      return this.normalizeList<Ticket>(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des tickets:', error);
      return [];
    }
  }

  // Récupérer les tickets pour une réservation spécifique
  async getTicketsByReservation(reservationId: number): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/?reservation=${reservationId}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Ticket[]>(response)
  }
  
  // Récupérer les tickets d'un client
  async getTicketsByClient(clientId: number): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/?client_id=${clientId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Ticket[]>(response);
  }
  
  // Récupérer les réservations d'un client avec gestion de la pagination
  async getReservationsByClient(clientId: number): Promise<Reservation[]> {
    try {
      let allReservations: Reservation[] = [];
      let nextUrl: string | null = `${API_BASE_URL}/reservations/?client_id=${clientId}`;
      
      console.log(`[API] Récupération des réservations pour le client ${clientId}`);
      
      // Tant qu'il y a une page suivante, on continue de récupérer les réservations
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: this.getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json() as Reservation[] | { results: Reservation[]; next: string | null } | undefined;
        
        // Gérer les différents formats de réponse
        if (Array.isArray(data)) {
          // Si la réponse est un tableau, on l'ajoute directement
          allReservations = [...allReservations, ...data];
          nextUrl = null; // Pas de pagination dans ce cas
        } else if (data && 'results' in data && Array.isArray(data.results)) {
          // Si la réponse est un objet avec une propriété 'results'
          allReservations = [...allReservations, ...data.results];
          
          // Mettre à jour l'URL de la page suivante
          nextUrl = data.next || null;
          
          // Si l'URL de la page suivante est relative, on la transforme en URL absolue
          if (nextUrl && !nextUrl.startsWith('http')) {
            const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            nextUrl = `${baseUrl}${nextUrl}`;
          }
        } else {
          // Format de réponse inattendu, on arrête la boucle
          console.warn('Format de réponse inattendu:', data);
          nextUrl = null;
        }
        
        console.log(`[API] ${allReservations.length} réservations récupérées jusqu'à présent`);
      }
      
      console.log(`[API] Total des réservations récupérées: ${allReservations.length}`);
      return allReservations;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des réservations:', error.message);
      } else {
        console.error('Erreur inconnue lors de la récupération des réservations');
      }
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }
  




  
  // Récupérer les paiements d'un client
  async getPaiementsByClient(clientId: number): Promise<Paiement[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/paiements/?client_id=${clientId}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as Paiement[] | { results: Paiement[] } | undefined;
      
      // Gérer à la fois les formats de réponse possibles
      if (Array.isArray(data)) {
        return data;
      } else if (data && 'results' in data && Array.isArray(data.results)) {
        return data.results;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  async updateProfile(userData: Partial<User> & { currentPassword?: string; newPassword?: string }): Promise<User> {
    try {
      // Préparer les données à envoyer
      const dataToSend: any = { ...userData };
      
      // Si un nouveau mot de passe est fourni, on l'ajoute dans le format attendu par le backend
      if (userData.newPassword) {
        dataToSend.new_password = userData.newPassword;
      }
      
      // Si un mot de passe actuel est fourni, on l'ajoute
      if (userData.currentPassword) {
        dataToSend.current_password = userData.currentPassword;
      }
      
      console.log('Envoi des données de mise à jour du profil:', dataToSend);
      console.log('URL:', `${API_BASE_URL}/me/`);
      console.log('Headers:', this.getAuthHeaders());
      
      const response = await fetch(`${API_BASE_URL}/me/`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      console.log('Réponse du serveur:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {};
        }
        
        console.error('Erreur lors de la mise à jour du profil:', errorData);
        
        // Gérer les différents formats d'erreur
        let errorMessage = 'Erreur lors de la mise à jour du profil';
        
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.errors) {
          // Si c'est un objet d'erreurs de validation
          if (typeof errorData.errors === 'object' && Object.keys(errorData.errors).length > 0) {
            const errorMessages = [];
            for (const [field, errors] of Object.entries(errorData.errors)) {
              if (Array.isArray(errors)) {
                errorMessages.push(`${field}: ${errors.join(', ')}`);
              } else {
                errorMessages.push(`${field}: ${errors}`);
              }
            }
            errorMessage = errorMessages.join('\n');
          } else if (errorData.errors) {
            errorMessage = String(errorData.errors);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (Object.keys(errorData).length === 0) {
          // Si l'objet d'erreur est vide, utiliser le statut HTTP
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
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

  async getClientsAbonnes(abonnementId: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/abonnements/${abonnementId}/clients/`, {
        headers: this.getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    } catch (error) {
      console.error("Erreur lors de la récupération des clients abonnés:", error);
      return [];
    }
  }

// Réservations
async getReservations(): Promise<Reservation[]> {
  try {
    let allReservations: Reservation[] = [];
    let nextUrl: string | null = `${API_BASE_URL}/reservations/`;
    let page = 1;
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data: any = await response.json();
      let normalizedData: Reservation[] = [];
      if (Array.isArray(data)) {
        normalizedData = data;
        nextUrl = null;
      } else if (data && Array.isArray(data.results)) {
        normalizedData = data.results;
        nextUrl = data.next || null;
      } else {
        normalizedData = [];
        nextUrl = null;
      }
      allReservations = [...allReservations, ...normalizedData];
      page++;
    }
    return allReservations;
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return [];
  }
}

// Paiements
async getPaiements(): Promise<Paiement[]> {
  try {
    let allPaiements: Paiement[] = [];
    let nextUrl: string | null = `${API_BASE_URL}/paiements/`;
    let page = 1;
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data: any = await response.json();
      let normalizedData: Paiement[] = [];
      if (Array.isArray(data)) {
        normalizedData = data;
        nextUrl = null;
      } else if (data && Array.isArray(data.results)) {
        normalizedData = data.results;
        nextUrl = data.next || null;
      } else {
        normalizedData = [];
        nextUrl = null;
      }
      allPaiements = [...allPaiements, ...normalizedData];
      page++;
    }
    return allPaiements;
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    return [];
  }
}

// Charges
async getCharges(): Promise<Charge[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/charges/`, {
      headers: this.getAuthHeaders(),
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des charges:", error);
    return [];
  }
}

// Abonnements clients présentiels
async getAbonnementsClientsPresentiels(): Promise<AbonnementClientPresentiel[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients-presentiels/`, {
      headers: this.getAuthHeaders(),
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements clients présentiels:", error);
    return [];
  }
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
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Une erreur est survenue" }));
      throw new Error(error.message || `Erreur ${response.status}`);
    }
    
    // Retourner le blob pour le téléchargement
    return response.blob();
  }

  async getUserReservations(userId: number): Promise<{
    client: {
      id: number
      nom: string
      prenom: string
      email: string
    }
    reservations: Reservation[]
    total_reservations: number
  }> {
    console.log(`[API] Récupération des réservations pour l'utilisateur ${userId}`);
    try {
      const url = `${API_BASE_URL}/users/${userId}/reservations/`;
      console.log('[API] URL de la requête:', url);
      
      const headers = this.getAuthHeaders();
      console.log('[API] En-têtes de la requête:', headers);
      
      const response = await fetch(url, { headers });
      console.log('[API] Réponse reçue, statut:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('[API] Corps de la réponse:', responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          errorData = { message: 'Réponse non-JSON' };
        }
        const errorMessage = errorData.error || errorData.message || response.statusText;
        console.error('[API] Erreur de l\'API:', { status: response.status, errorMessage, errorData });
        throw new Error(`Erreur lors de la récupération des réservations: ${errorMessage}`);
      }
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
        console.log('[API] Données parsées:', responseData);
        
        if (!responseData || !Array.isArray(responseData.reservations)) {
          console.error('[API] Format de réponse inattendu:', responseData);
          throw new Error('Format de réponse inattendu de l\'API');
        }
        
        return responseData;
      } catch (e) {
        console.error('[API] Erreur lors du parsing de la réponse:', e);
        throw new Error('Erreur lors de l\'analyse de la réponse du serveur');
      }
    } catch (error) {
      console.error('[API] Erreur lors de la récupération des réservations:', error);
      throw error;
    }
  }
}

// Les types sont déjà exportés lors de leur déclaration, pas besoin de les réexporter ici

// Export API client instance
export const apiClient = new ApiClient();
