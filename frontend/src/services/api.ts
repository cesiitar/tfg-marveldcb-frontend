import { Card, CardSet, Hero, Deck } from '../types/card'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api'

class ApiService {

  async getSets(): Promise<CardSet[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/sets`)
      if (!response.ok) {
        throw new Error('Error al obtener los sets')
      }
      const data = await response.json()
      return data.sets
    } catch (error) {
      console.error('Error fetching sets:', error)
      throw error
    }
  }

  async getCardsBySet(
    setId: number, 
    search?: string, 
    sortBy?: string
  ): Promise<{ set: string; cards: Card[] }> {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (sortBy) params.append('sort_by', sortBy)
      
      const url = `${API_BASE_URL}/sets/${setId}/cards${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al obtener las cartas del set')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching cards by set:', error)
      throw error
    }
  }

  async getAllCards(): Promise<Card[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards`)
      if (!response.ok) {
        throw new Error('Error al obtener todas las cartas')
      }
      const data = await response.json()
      return data.cards
    } catch (error) {
      console.error('Error fetching all cards:', error)
      throw error
    }
  }

  async searchCards(filters: {
    name?: string
    aspect?: string
    type?: string
    cost?: number
    set_name?: string
  }): Promise<Card[]> {
    try {
      const params = new URLSearchParams()
      
      if (filters.name) params.append('name', filters.name)
      if (filters.aspect) params.append('aspect', filters.aspect)
      if (filters.type) params.append('type', filters.type)
      if (filters.cost !== undefined) params.append('cost', filters.cost.toString())
      if (filters.set_name) params.append('set_name', filters.set_name)

      const response = await fetch(`${API_BASE_URL}/cards/search?${params}`)
      if (!response.ok) {
        throw new Error('Error al buscar cartas')
      }
      const data = await response.json()
      return data.cards
    } catch (error) {
      console.error('Error searching cards:', error)
      throw error
    }
  }

  // Métodos para héroes - Temporalmente deshabilitados hasta que el backend los implemente
  async getHeroes(): Promise<Hero[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/heroes`)
      if (!response.ok) {
        throw new Error('Error al obtener los héroes')
      }
      const data = await response.json()
      return data.heroes || data
    } catch (error) {
      console.error('Error fetching heroes:', error)
      throw error
    }
  }

  async getHeroCards(heroName: string): Promise<Card[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/heroes/${encodeURIComponent(heroName)}/cards`)
      if (!response.ok) {
        throw new Error(`Error al obtener las cartas del héroe ${heroName}`)
      }
      const data = await response.json()
      return data.cards || data
    } catch (error) {
      console.error('Error fetching hero cards:', error)
      throw error
    }
  }

  // Método para obtener cartas por aspecto
  async getCardsByAspect(aspect: string): Promise<Card[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/aspect/${aspect}`)
      if (!response.ok) {
        throw new Error(`Error al obtener las cartas del aspecto ${aspect}`)
      }
      const data = await response.json()
      return data.cards || data
    } catch (error) {
      console.error('Error fetching cards by aspect:', error)
      throw error
    }
  }

  // Nuevos métodos para mazos
  async getDecks(): Promise<Deck[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`)
      if (!response.ok) {
        throw new Error('Error al obtener los mazos')
      }
      const data = await response.json()
      return data.decks || data
    } catch (error) {
      console.error('Error fetching decks:', error)
      throw error
    }
  }

  async getDeckById(id: number): Promise<Deck> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${id}`)
      if (!response.ok) {
        throw new Error('Error al obtener el mazo')
      }
      const data = await response.json()
      return (data.deck || data) as Deck
    } catch (error) {
      console.error('Error fetching deck by id:', error)
      throw error
    }
  }

  async createDeck(deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'>, auth0Id: string): Promise<Deck> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id,
        },
        body: JSON.stringify(deck),
      })
      if (!response.ok) {
        const errorText = await response.text()
        let detail = `Error al crear el mazo: ${response.status}`
        try {
          const parsed = JSON.parse(errorText)
          if (parsed) {
            if (parsed.card_name && (parsed.allowed !== undefined || parsed.limit !== undefined)) {
              const allowed = parsed.allowed ?? parsed.limit
              detail = `Límite excedido: "${parsed.card_name}" permite máximo ${allowed} copias`
            } else if (parsed.detail || parsed.message) {
              detail = parsed.detail || parsed.message
            }
          }
        } catch {}
        console.error('Error response body:', errorText)
        throw new Error(detail)
      }
      const data = await response.json()
      return data.deck || data
    } catch (error) {
      console.error('Error creating deck:', error)
      throw error
    }
  }

  // Método para obtener estadísticas del usuario
  async getUserStats(auth0Id: string): Promise<{ deckCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id, // Enviar el auth0_id como header personalizado
        },
      })
      if (!response.ok) {
        throw new Error('Error al obtener las estadísticas del usuario')
      }
      const data = await response.json()
      
      return data
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  }

  // Método para obtener información del perfil del usuario
  async getUserProfile(token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Error al obtener el perfil del usuario')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  // Método para obtener los mazos del usuario
  async getUserDecks(auth0Id: string): Promise<Deck[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/decks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id,
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al obtener los mazos del usuario: ${response.status}`)
      }
      const data = await response.json()
      return data.decks || data
    } catch (error) {
      console.error('Error fetching user decks:', error)
      throw error
    }
  }

  // Actualizar un mazo existente
  async updateDeck(deckId: number, deckData: any, auth0Id: string): Promise<any> {
    try {
      if (!auth0Id) {
        throw new Error('No hay Auth0 ID')
      }

      const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id // Enviar solo el Auth0 SUB, no el JWT token
        },
        body: JSON.stringify(deckData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al actualizar el mazo: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating deck:', error)
      throw error
    }
  }

  // Eliminar un mazo
  async deleteDeck(deckId: number, auth0Id: string): Promise<void> {
    try {
      if (!auth0Id) {
        throw new Error('No hay Auth0 ID')
      }

      const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'DELETE',
        headers: {
          'X-Auth0-ID': auth0Id // Enviar solo el Auth0 SUB, no el JWT token
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al eliminar el mazo: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting deck:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
