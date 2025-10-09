import { Card, CardSet, Hero, Deck } from '../types/card'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api'

class ApiService {
  private getAuthHeaders = async (): Promise<HeadersInit> => {
    // Esta función se implementará cuando tengamos el contexto de auth
    return {
      'Content-Type': 'application/json',
    }
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })
    return response
  }
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
    // TODO: Implementar cuando el backend tenga el endpoint /api/heroes
    console.warn('Endpoint /api/heroes no implementado en el backend')
    return []
  }

  async getHeroCards(heroName: string): Promise<Card[]> {
    // TODO: Implementar cuando el backend tenga el endpoint /api/heroes/{name}/cards
    console.warn(`Endpoint /api/heroes/${heroName}/cards no implementado en el backend`)
    return []
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

  async createDeck(deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'>): Promise<Deck> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deck),
      })
      if (!response.ok) {
        throw new Error('Error al crear el mazo')
      }
      const data = await response.json()
      return data.deck || data
    } catch (error) {
      console.error('Error creating deck:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
