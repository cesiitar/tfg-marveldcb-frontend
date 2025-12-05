// Servicio para interactuar con la API de MarvelCDB
// Documentación: https://marvelcdb.com/api/doc

const MARVELCDB_API_BASE = 'https://marvelcdb.com/api/public'

export interface MarvelCDBCard {
  code: string
  name: string
  type_code: string
  faction_code: string
  pack_code: string
  quantity?: number
}

export interface MarvelCDBDeck {
  id: number
  name: string
  description_md?: string
  description?: string
  investigator_code?: string
  investigator_name?: string
  aspect?: string
  slots: Record<string, number> // { card_code: quantity }
  version?: string
  date_creation?: string
  date_update?: string
  // Campos adicionales que pueden venir de la API
  slots_json?: string // Algunos mazos pueden tener slots como JSON string
}

export interface MarvelCDBDecklist {
  id: number
  name: string
  description_md?: string
  investigator_code?: string
  investigator_name?: string
  aspect?: string
  slots: Record<string, number>
  version?: string
  date_creation?: string
  date_update?: string
}

class MarvelCDBService {
  /**
   * Obtiene un mazo público de MarvelCDB por su ID
   */
  async getDeckById(deckId: number): Promise<MarvelCDBDeck> {
    try {
      const response = await fetch(`${MARVELCDB_API_BASE}/decklist/${deckId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Mazo no encontrado en MarvelCDB. Verifica que el ID sea correcto y que el mazo sea público.')
        }
        throw new Error(`Error al obtener el mazo: ${response.status}`)
      }
      const data = await response.json()
      
      // Debug: mostrar todos los campos que vienen de la API para identificar el héroe
      console.log('=== MarvelCDB Deck Response ===')
      console.log('Todos los campos:', Object.keys(data))
      console.log('Datos completos:', JSON.stringify(data, null, 2))
      console.log('investigator_name:', data.investigator_name)
      console.log('investigator_code:', data.investigator_code)
      console.log('investigator:', (data as any).investigator)
      console.log('hero:', (data as any).hero)
      console.log('================================')
      
      // Si slots viene como string JSON, parsearlo
      if (data.slots_json && typeof data.slots_json === 'string') {
        try {
          data.slots = JSON.parse(data.slots_json)
        } catch (e) {
          console.warn('Error parsing slots_json:', e)
        }
      }
      
      // Si no hay slots, inicializar como objeto vacío
      if (!data.slots) {
        data.slots = {}
      }
      
      return data
    } catch (error) {
      console.error('Error fetching deck from MarvelCDB:', error)
      throw error
    }
  }

  /**
   * Obtiene información de una carta por su código
   */
  async getCardByCode(cardCode: string): Promise<MarvelCDBCard> {
    try {
      const response = await fetch(`${MARVELCDB_API_BASE}/card/${cardCode}`)
      if (!response.ok) {
        throw new Error(`Error al obtener la carta: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching card from MarvelCDB:', error)
      throw error
    }
  }

  /**
   * Obtiene todas las cartas (para mapeo)
   */
  async getAllCards(): Promise<MarvelCDBCard[]> {
    try {
      const response = await fetch(`${MARVELCDB_API_BASE}/cards/`)
      if (!response.ok) {
        throw new Error(`Error al obtener las cartas: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching all cards from MarvelCDB:', error)
      throw error
    }
  }

  /**
   * Extrae el ID del mazo desde una URL de MarvelCDB
   * Ejemplo: https://marvelcdb.com/decklist/view/12345 -> 12345
   */
  extractDeckIdFromUrl(url: string): number | null {
    try {
      // Patrones posibles:
      // https://marvelcdb.com/decklist/view/12345
      // https://marvelcdb.com/decklist/view/12345/nombre-del-mazo
      // marvelcdb.com/decklist/view/12345
      const match = url.match(/decklist\/view\/(\d+)/)
      if (match && match[1]) {
        return parseInt(match[1], 10)
      }
      
      // Si es solo un número, intentar parsearlo directamente
      const numMatch = url.match(/^(\d+)$/)
      if (numMatch && numMatch[1]) {
        return parseInt(numMatch[1], 10)
      }
      
      return null
    } catch (error) {
      console.error('Error extracting deck ID from URL:', error)
      return null
    }
  }
}

export const marvelcdbService = new MarvelCDBService()

