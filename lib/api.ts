// export const API_BASE_URL = "http://127.0.0.1:8000/api" 
export const API_BASE_URL = "https://33fd2f83-888e-4b9d-a899-f82716e74537-00-2i0tlxi804sf6.spock.replit.dev/api"

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
      
      const data = await response.json() as Ticket[] | { results: Ticket[] } | undefined;
      
      // Gérer à la fois les formats de réponse possibles
      if (Array.isArray(data)) {
        return data;
      } else if (data && 'results' in data && Array.isArray(data.results)) {
        return data.results;
      }
      
      return [];
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

  async createSeance(data: any): Promise<Seance> {
    const response = await fetch(`${API_BASE_URL}/seances/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return this.handleResponse<Seance>(response)
  }

  async updateSeance(id: number, data: any) {
    try {
      console.log('[API] Updating session with ID:', id);
      console.log('[API] Original data to update:', JSON.stringify(data, null, 2));
      
      // Nettoyer les données avant envoi
      const cleanData: any = { ...data };
      
      // Convertir les valeurs numériques
      if (cleanData.nombre_heures !== undefined) {
        cleanData.nombre_heures = Number(cleanData.nombre_heures);
      }
      if (cleanData.montant_paye !== undefined) {
        cleanData.montant_paye = cleanData.montant_paye === '' ? null : Number(cleanData.montant_paye);
      }
      
      // Gérer le coach_id de manière plus robuste
      if ('coach_id' in cleanData) {
        if (cleanData.coach_id === 'none' || cleanData.coach_id === '' || cleanData.coach_id === null) {
          cleanData.coach_id = null; // Envoyer explicitement null pour supprimer le coach
        } else if (!isNaN(Number(cleanData.coach_id))) {
          cleanData.coach_id = Number(cleanData.coach_id); // Convertir en nombre si c'est un ID valide
        }
        // Si ce n'est ni null ni un nombre valide, on laisse la valeur telle quelle
      }
      
      console.log('[API] Cleaned data before sending:', JSON.stringify(cleanData, null, 2));
      
    const response = await fetch(`${API_BASE_URL}/seances/${id}/`, {
      method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(cleanData),
      });
      
      console.log('[API] Response status:', response.status);
      
      // Si la réponse n'est pas OK, essayer de lire le message d'erreur
      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('[API] Error details:', errorData);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          console.error('[API] Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        
        const error = new Error(`Erreur ${response.status}: ${errorData.detail || errorData.message || 'Erreur lors de la modification de la séance'}`);
        (error as any).response = response;
        (error as any).data = errorData;
        throw error;
      }
      
      const result = await response.json();
      console.log('[API] Update successful:', result);
      return result;
    } catch (error) {
      console.error('[API] Error updating session:', error);
      throw error;
    }
  }

  async deleteSeance(id: number) {
    const response = await fetch(`${API_BASE_URL}/seances/${id}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<{ success: boolean }>(response)
  }

  async getSeanceParticipants(seanceId: number): Promise<Array<{id: number, nom: string, prenom: string}>> {
    const response = await fetch(`${API_BASE_URL}/seances/${seanceId}/participants/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Array<{id: number, nom: string, prenom: string}>>(response)
  }

  async getCoachs() {
    const response = await fetch(`${API_BASE_URL}/seances/coachs/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<Array<{id: number, nom: string, prenom: string}>>(response)
  }

  // Réservations
  async getReservations(): Promise<Reservation[]> {
    try {
      let allReservations: Reservation[] = [];
      let nextUrl: string | null = `${API_BASE_URL}/reservations/`;
      let page = 1;
      
      console.log('[API] Début de la récupération des réservations');
      
      // Tant qu'il y a une page suivante, on continue de récupérer les réservations
      while (nextUrl) {
        console.log(`[API] Récupération de la page ${page} des réservations...`);
        const response = await fetch(nextUrl, {
          headers: this.getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json() as { results?: Reservation[], next?: string };
        
        // Ajouter les réservations de la page courante
        if (data.results && Array.isArray(data.results)) {
          allReservations = [...allReservations, ...data.results];
          console.log(`[API] ${data.results.length} réservations récupérées (total: ${allReservations.length})`);
        }
        
        // Vérifier s'il y a une page suivante
        nextUrl = data.next || null;
        page++;
      }
      
      console.log(`[API] Récupération terminée. Total des réservations: ${allReservations.length}`);
      return allReservations;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      throw error; // Propager l'erreur pour une meilleure gestion en amont
    }
  }

  async getReservation(id: number): Promise<Reservation | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${id}/`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Réservation non trouvée
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json() as Reservation;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la réservation:`, error);
      throw error;
    }
  }

  async createReservation(data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Validation des données requises
      const requiredFields = ['nom_client', 'type_reservation', 'montant'] as const;
      const missingFields = requiredFields.filter(field => !(field in data) || data[field as keyof typeof data] === undefined || data[field as keyof typeof data] === '');
      
      if (missingFields.length > 0) {
        const error = new Error(`Champs manquants : ${missingFields.join(', ')}`);
        (error as any).name = 'ValidationError';
        console.error('[API] Validation error:', error);
        throw error;
      }
      
      // Préparer les données pour l'API
      const reservationData = {
        ...data
      };
      
      console.log('[API] Données formatées pour l\'API:', JSON.stringify(reservationData, null, 2));
      
      // Afficher les en-têtes d'authentification
      const authHeaders = this.getAuthHeaders();
      console.log('[API] En-têtes d\'authentification:', authHeaders);
      
      // Afficher l'URL complète de l'API
      const apiUrl = `${API_BASE_URL}/reservations/`;
      console.log('[API] URL de l\'API:', apiUrl);
      
      // Afficher les données complètes qui seront envoyées
      console.log('[API] Données à envoyer:', JSON.stringify(reservationData, null, 2));
      
      // Effectuer la requête avec un timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout
      
      try {
        console.log('[API] Envoi de la requête POST à:', apiUrl);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify(reservationData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('[API] Réponse du serveur - Statut:', response.status);
        console.log('[API] En-têtes de la réponse:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('[API] Réponse brute du serveur:', responseText);
        
        let parsedData;
        try {
          parsedData = responseText ? JSON.parse(responseText) : {};
          console.log('[API] Réponse parsée:', parsedData);
          
          // Afficher plus de détails sur l'erreur si elle existe
          if (response.status >= 400) {
            console.error('[API] Détails de l\'erreur:', {
              status: response.status,
              statusText: response.statusText,
              data: parsedData,
              headers: Object.fromEntries(response.headers.entries())
            });
          }
        } catch (e) {
          console.error('[API] Erreur lors du parsing de la réponse:', e, 'Réponse texte:', responseText);
          parsedData = {};
        }
        
        if (!response.ok) {
          console.error('[API] Erreur de l\'API:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: parsedData
          });
          
          const errorMessage = parsedData.detail || 
                             parsedData.message || 
                             response.statusText || 
                             'Erreur inconnue';
          
          const error = new Error(`Erreur ${response.status}: ${errorMessage}`);
          error.name = 'APIError';
          (error as any).response = response;
          (error as any).data = parsedData;
          throw error;
        }
        
        return parsedData;
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('[API] La requête a expiré (timeout)');
          throw new Error('La requête a pris trop de temps. Veuillez réessayer.');
        }
        console.error('[API] Erreur lors de la création de la réservation:', error);
        throw error;
      }
    } catch (error: unknown) {
      // Vérifier si c'est une erreur personnalisée avec des propriétés supplémentaires
      if (error instanceof Error) {
        const customError = error as Error & {
          response?: Response;
          data?: any;
          name?: string;
        };
        
        console.error('[API] Erreur lors de la création de la réservation:', {
          error: customError.message,
          stack: customError.stack,
          response: customError.response,
          data: customError.data
        });

        // Améliorer le message d'erreur pour les erreurs de validation
        if (customError.name === 'ValidationError') {
          throw customError;
        } else if (customError.response) {
          // Erreur de l'API avec réponse
          const apiError = new Error(
            customError.data?.detail || 
            customError.data?.message || 
            `Erreur ${customError.response.status}: ${customError.response.statusText}`
          );
          apiError.name = 'APIError';
          throw apiError;
        } else {
          // Erreur réseau ou autre
          const networkError = new Error(
            customError.message || 'Erreur réseau lors de la communication avec le serveur'
          );
          networkError.name = 'NetworkError';
          throw networkError;
        }
      } else {
        // Pour les erreurs non-Error
        const unknownError = new Error('Une erreur inconnue est survenue');
        unknownError.name = 'UnknownError';
        throw unknownError;
      }
    }
  }

  async updateReservation(id: number, data: Partial<Reservation>) {
    // Seuls les champs autorisés peuvent être mis à jour
    const allowedFields = ['type_reservation', 'statut', 'description', 'montant', 'nom_client'];
    const updateData: Partial<Reservation> = {};
    
    // Filtrer uniquement les champs autorisés
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        (updateData as any)[key] = data[key as keyof Reservation];
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    
    return this.handleResponse<Reservation>(response);
  }

  async deleteReservation(id: number): Promise<boolean> {
    try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/`, {
        method: 'DELETE',
      headers: this.getAuthHeaders(),
      });
      
      if (response.status === 204) {
        // Succès - pas de contenu retourné
        return true;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || response.statusText;
        throw new Error(`Erreur lors de la suppression de la réservation: ${errorMessage}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la réservation ${id}:`, error);
      throw error;
    }
  }

  // Paiements
  async getPaiements() {
    try {
      const response = await fetch(`${API_BASE_URL}/paiements/`, {
      headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<Paiement[]>(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  }

  // Validation des paiements (Employé)
  async validerPaiement(paiementId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/paiements/${paiementId}/valider/`, {
        method: 'POST',
      headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<Paiement>(response);
    } catch (error) {
      console.error(`Erreur lors de la validation du paiement ${paiementId}:`, error);
      throw error;
    }
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

  // La méthode getTickets est définie plus haut (ligne 457)

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

  async createPresence(data: { 
    date: string; 
    present: boolean; 
    commentaire?: string;
    personnel_id?: number;
    employe_id?: number;
  }) {
    // Transformer les données pour correspondre au format attendu par le backend
    const backendData = {
      date_jour: data.date,
      statut: data.present ? "PRESENT" : "ABSENT",
      heure_arrivee: data.present ? data.commentaire?.replace("Heure d'arrivée: ", "") || null : null,
      personnel_id: data.personnel_id,
      employe_id: data.employe_id
    };

    console.log("Données transformées pour le backend:", backendData);

    const response = await fetch(`${API_BASE_URL}/presences/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(backendData),
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
    try {
      console.log('[API] Tentative de récupération du rapport financier...');
    const response = await fetch(`${API_BASE_URL}/financial-report/`, {
        headers: this.getAuthHeaders(),
      })
      
      console.log('[API] Réponse du serveur - Statut:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API] Erreur du serveur:', errorData);
        
        let errorMessage = 'Failed to fetch financial report';
        if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail)
            ? errorData.detail.map((err: any) => 
                `${err.loc ? err.loc.join('.') + ' - ' : ''}${err.msg}`
              ).join('\n')
            : errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        const error = new Error(errorMessage);
        (error as any).response = response;
        (error as any).data = errorData;
        throw error;
      }
      
      const data = await response.json();
      console.log('[API] Données financières reçues:', data);
      
      return data;
    } catch (error) {
      console.error('[API] Erreur lors de la récupération du rapport financier:', error);
      throw error;
    }
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

  // Rapport journalier - Utilise l'endpoint /presences/ avec le paramètre date_jour
  async getRapportJournalier() {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/presences/?date_jour=${today}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Array<PresenceRapport>>(response);
  }

  // Récupère les présences pour une date spécifique
  async getRapportParDate(date: string) {
    const response = await fetch(`${API_BASE_URL}/presences/?date_jour=${date}`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<Array<PresenceRapport>>(response);
    return data;
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

  async validerReservation(reservationId: number, data?: { montant: number }) {
    const response = await this.handleResponse(
      await fetch(`${API_BASE_URL}/reservations/${reservationId}/valider/`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      })
    )
    return response
  }

  async createAbonnementReservation(abonnementId: number) {
    const response = await fetch(`${API_BASE_URL}/abonnements-client/reserver/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ abonnement_id: abonnementId }),
    })
    return this.handleResponse(response)
  }

  // Abonnements
  async getAbonnements(): Promise<Abonnement[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/abonnements/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Si la réponse est un objet avec une propriété 'results', on la retourne
      if (data && Array.isArray(data.results)) {
        return data.results;
      }
      
      // Si c'est directement un tableau, on le retourne
      if (Array.isArray(data)) {
        return data;
      }
      
      // Si c'est un objet vide, on retourne un tableau vide
      if (data && typeof data === 'object' && Object.keys(data).length === 0) {
        console.warn('La réponse de l\'API est un objet vide');
        return [];
      }
      
      // Si on arrive ici, le format de la réponse est inattendu
      console.error('Format de réponse inattendu pour les abonnements:', data);
      return [];
      
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  // Abonnements clients (employé)
  async getAbonnementsClients() {
    const response = await fetch(`${API_BASE_URL}/abonnements-clients/`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<AbonnementClientPresentiel[]>(response);
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
