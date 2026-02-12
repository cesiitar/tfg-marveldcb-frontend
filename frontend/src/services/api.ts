import { Card, CardSet, Hero, Deck, DeckComment } from '../types/card'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://marveldcb-backend.onrender.com/api'

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

  // Buscar carta por código de MarvelCDB
  async getCardByMarvelCDBCode(marvelcdbCode: string): Promise<Card | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/marvelcdb-code/${marvelcdbCode}`)
      if (!response.ok) {
        if (response.status === 404) {
          return null // Carta no encontrada
        }
        throw new Error('Error al buscar la carta por código de MarvelCDB')
      }
      const data = await response.json()
      return data.card || data
    } catch (error) {
      console.error('Error fetching card by MarvelCDB code:', error)
      return null
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

  async getHeroCards(heroId: number): Promise<Card[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/heroes/${heroId}/cards`)
      if (!response.ok) {
        throw new Error(`Error al obtener las cartas del héroe con ID ${heroId}`)
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

  async createDeck(deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'>, auth0Id?: string): Promise<Deck> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (auth0Id) {
        headers['X-Auth0-ID'] = auth0Id
      }
      const response = await fetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers,
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

  // Obtener lista de villanos con IDs (RECOMENDADO)
  async getVillainsWithIds(): Promise<{ id: number; name: string }[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/villains/with-ids`)
      if (!response.ok) {
        throw new Error('Error al obtener los villanos con IDs')
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching villains with IDs:', error)
      throw error
    }
  }

  // Obtener lista de villanos (solo nombres - para compatibilidad)
  async getVillains(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/villains`)
      if (!response.ok) {
        throw new Error('Error al obtener los villanos')
      }
      const data = await response.json()
      // El backend devuelve directamente un array de strings
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching villains:', error)
      throw error
    }
  }

  // Guardar configuración de partida
  async saveGameConfiguration(gameConfig: {
    deck_id: number
    difficulty: 'normal' | 'expert'
    villain_id: number  // ← Cambiado de villain (string) a villain_id (number)
    result: 'win' | 'loss'
    played_at: string
  }, auth0Id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/game-configurations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id,
        },
        body: JSON.stringify(gameConfig),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al guardar la configuración de partida: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error saving game configuration:', error)
      throw error
    }
  }

  // Eliminar una partida del historial (solo propias)
  async deleteGameConfiguration(gameId: number, auth0Id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/game-configurations/${gameId}`, {
      method: 'DELETE',
      headers: {
        'X-Auth0-ID': auth0Id,
      },
    })
    if (response.status === 404) {
      throw new Error('Partida no encontrada o no puedes eliminarla')
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Error al eliminar la partida')
    }
    const data = await response.json()
    return data
  }

  // Obtener favoritos del usuario
  async getUserFavorites(auth0Id: string): Promise<Deck[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/favorites`, {
        method: 'GET',
        headers: {
          'X-Auth0-ID': auth0Id,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Error al obtener favoritos: ${response.status}`)
      }
      
      const data = await response.json()
      return data.favorites || []
    } catch (error) {
      console.error('Error fetching user favorites:', error)
      throw error
    }
  }

  // Verificar si un mazo es favorito
  async isFavorite(deckId: number, auth0Id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}/is-favorite`, {
        method: 'GET',
        headers: {
          'X-Auth0-ID': auth0Id,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Error al verificar favorito: ${response.status}`)
      }
      
      const data = await response.json()
      return data.is_favorite || false
    } catch (error) {
      console.error('Error checking if favorite:', error)
      return false // En caso de error, asumir que no es favorito
    }
  }

  // Obtener historial de partidas del usuario (o todas las partidas públicas)
  async getGameHistory(auth0Id: string | null, myGamesOnly: boolean = false): Promise<{
    games: Array<{
      id: number
      deck_id: number
      deck_name: string
      hero_name: string
      aspect: string
      villain_id: number
      villain_name: string
      difficulty: 'normal' | 'expert'
      result: 'win' | 'loss'
      played_at: string
      creator_name?: string  // Autor del mazo/usuario que jugó la partida
    }>
  }> {
    try {
      const headers: Record<string, string> = {}
      
      // Si se proporciona auth0Id, añadirlo al header
      if (auth0Id) {
        headers['X-Auth0-ID'] = auth0Id
      }
      
      // Definir la URL
      const url = myGamesOnly 
        ? `${API_BASE_URL}/game-configurations` 
        : `${API_BASE_URL}/game-configurations/all`
      
      const response = await fetch(url, {
        headers,
      })
      
      if (!response.ok) {
        throw new Error('Error al obtener el historial de partidas')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching game history:', error)
      throw error
    }
  }

  // Añadir/quitar favorito
  async toggleFavorite(deckId: number, auth0Id: string): Promise<{ is_favorite: boolean; message: string }> {
    try {
      // Primero verificar si ya es favorito
      const isCurrentlyFavorite = await this.isFavorite(deckId, auth0Id)
      const action = isCurrentlyFavorite ? 'remove' : 'add'
      
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id,
        },
        body: JSON.stringify({
          deck_id: deckId,
          action: action
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al ${action === 'add' ? 'añadir' : 'quitar'} favorito: ${response.status}`)
      }
      
      const data = await response.json()
      return {
        is_favorite: data.is_favorite,
        message: data.message
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  // Obtener comentarios de un mazo
  async getDeckComments(deckId: number): Promise<DeckComment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}/comments`)
      if (!response.ok) {
        throw new Error('Error al obtener los comentarios')
      }
      const data = await response.json()
      return data.comments || data || []
    } catch (error) {
      console.error('Error fetching deck comments:', error)
      throw error
    }
  }

  // Crear un nuevo comentario en un mazo
  async createDeckComment(deckId: number, commentText: string, auth0Id: string): Promise<DeckComment> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id,
        },
        body: JSON.stringify({
          comment_text: commentText
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al crear el comentario: ${response.status}`)
      }
      
      const data = await response.json()
      return data.comment || data
    } catch (error) {
      console.error('Error creating deck comment:', error)
      throw error
    }
  }

  // Actualizar un comentario existente
  async updateDeckComment(commentId: number, commentText: string, auth0Id: string): Promise<DeckComment> {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id,
        },
        body: JSON.stringify({
          comment_text: commentText
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al actualizar el comentario: ${response.status}`)
      }
      
      const data = await response.json()
      return data.comment || data
    } catch (error) {
      console.error('Error updating deck comment:', error)
      throw error
    }
  }

  // Eliminar un comentario
  async deleteDeckComment(commentId: number, auth0Id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'X-Auth0-ID': auth0Id,
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`Error al eliminar el comentario: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting deck comment:', error)
      throw error
    }
  }

  // Generar mazo basado en villano (nuevo enfoque)
  async generateDeckForVillain(
    data: {
      villain_id: number
      difficulty: 'normal' | 'expert'
      patches?: string[]
      max_decks?: number  // Opcional: número de mazos a generar (1-4, por defecto 3)
    },
    auth0Id: string
  ): Promise<{
    decks: Deck[]  // Array de mazos generados
    message?: string
    total_requested?: number  // Número de mazos solicitados
    total_generated?: number  // Número de mazos realmente generados
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/deck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-ID': auth0Id,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({ detail: 'Modelo de IA no disponible' }))
          throw new Error(errorData.detail || 'Modelo de IA no disponible. Necesita ser entrenado primero.')
        }
        const errorText = await response.text()
        let errorMessage = 'Error al generar el mazo con IA'
        try {
          const parsed = JSON.parse(errorText)
          errorMessage = parsed.detail || parsed.message || errorMessage
        } catch {}
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error generating deck for villain:', error)
      throw error
    }
  }

  // Importar cartas faltantes desde MarvelCDB
  // Si las cartas NO existen, pasar TODOS los datos completos (cards)
  // Si solo pasas códigos, el backend buscará los datos en MarvelCDB
  async importMissingCards(
    cardCodes?: string[], // Solo códigos (si no tenemos datos completos)
    cards?: Array<{      // Datos completos (SI LA CARTA NO EXISTE - RECOMENDADO)
      code: string
      name: string
      type_code: string
      faction_code: string
      pack_code: string
      pack_name?: string
      cost?: number
      deck_limit?: number
      health?: number
      attack?: number
      threat?: number
      scheme?: number
      traits?: string
      text?: string
      is_unique?: boolean
      quantity?: number
      card_set_name?: string
    }>,
    auth0Id?: string
  ): Promise<{
    imported: number
    failed: number
    skipped: number
    message: string
    errors?: Array<{ code: string; error: string }>
  }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (auth0Id) {
        headers['X-Auth0-ID'] = auth0Id
      }

      // Construir el body: si tenemos datos completos, pasarlos; si no, solo códigos
      const body: {
        card_codes?: string[]
        cards?: Array<{
          code: string
          name: string
          type_code: string
          faction_code: string
          pack_code: string
          pack_name?: string
          cost?: number
          deck_limit?: number
          health?: number
          attack?: number
          threat?: number
          scheme?: number
          traits?: string
          text?: string
          is_unique?: boolean
          quantity?: number
          card_set_name?: string
        }>
      } = {}

      if (cards && cards.length > 0) {
        // SI LA CARTA NO EXISTE: pasar TODOS los datos completos
        body.cards = cards
      } else if (cardCodes && cardCodes.length > 0) {
        // Fallback: solo códigos (el backend buscará los datos)
        body.card_codes = cardCodes
      }

      const response = await fetch(`${API_BASE_URL}/cards/import-missing`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Error al importar cartas'
        try {
          const parsed = JSON.parse(errorText)
          errorMessage = parsed.detail || parsed.message || errorMessage
        } catch {}
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error importing missing cards:', error)
      throw error
    }
  }

  // Verificar qué cartas faltan en nuestra base de datos
  async checkMissingCards(
    cardCodes: string[]
  ): Promise<{
    missing: string[]
    existing: string[]
    total_checked: number
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/check-missing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_codes: cardCodes
        })
      })

      if (!response.ok) {
        throw new Error('Error al verificar cartas faltantes')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error checking missing cards:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
