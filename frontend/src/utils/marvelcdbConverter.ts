// Utilidades para convertir mazos de MarvelCDB al formato de nuestra aplicación

import { MarvelCDBDeck, MarvelCDBCard } from '../services/marvelcdbService'
import { Deck, DeckCard, Card } from '../types/card'
import { apiService } from '../services/api'

/**
 * Mapea el aspecto de MarvelCDB al formato de nuestra aplicación
 */
function mapAspect(marvelcdbAspect?: string): 'aggression' | 'justice' | 'leadership' | 'protection' | 'pool' | undefined {
  if (!marvelcdbAspect) return undefined
  
  const normalized = marvelcdbAspect.toLowerCase().trim()
  
  const aspectMap: Record<string, 'aggression' | 'justice' | 'leadership' | 'protection' | 'pool'> = {
    'aggression': 'aggression',
    'justice': 'justice',
    'leadership': 'leadership',
    'protection': 'protection',
    'pool': 'pool',
  }
  
  return aspectMap[normalized]
}

/**
 * Normaliza el nombre del héroe de MarvelCDB para búsqueda
 */
function normalizeHeroName(marvelcdbHeroName?: string): string {
  if (!marvelcdbHeroName) return ''
  
  // Normalizar: quitar guiones bajos, convertir a minúsculas, etc.
  return marvelcdbHeroName
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .trim()
}

/**
 * Busca una carta en nuestra base de datos por nombre, set y aspecto
 */
async function findCardInOurDB(
  cardName: string,
  packCode: string | undefined,
  allCards: Card[] | undefined,
  expectedAspect?: string // Aspecto esperado de MarvelCDB
): Promise<Card | null> {
  try {
    // Si no tenemos todas las cartas, buscarlas
    if (!allCards) {
      allCards = await apiService.getAllCards()
    }
    
    // Normalizar el nombre para búsqueda
    const normalizedName = cardName.toLowerCase().trim()
    
    // Mapear el aspecto esperado a nuestro formato
    const mappedAspect = expectedAspect ? mapAspect(expectedAspect) : undefined
    
    // 1. Buscar por nombre exacto Y aspecto (si tenemos aspecto)
    if (mappedAspect) {
      let foundCard = allCards.find(c => 
        c.name.toLowerCase() === normalizedName &&
        c.clase === mappedAspect
      )
      
      if (foundCard) {
        return foundCard
      }
    }
    
    // 2. Buscar por nombre exacto Y set (si tenemos pack_code)
    if (packCode) {
      const normalizedPack = packCode.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ')
      let foundCard = allCards.find(c => 
        c.name.toLowerCase() === normalizedName &&
        (c.set.toLowerCase().includes(normalizedPack) || normalizedPack.includes(c.set.toLowerCase()))
      )
      
      // Si encontramos y tenemos aspecto, verificar que coincida
      if (foundCard && mappedAspect) {
        if (foundCard.clase === mappedAspect) {
          return foundCard
        }
        // Si no coincide el aspecto, seguir buscando
      } else if (foundCard) {
        return foundCard
      }
    }
    
    // 3. Buscar por nombre exacto solamente
    let foundCard = allCards.find(c => 
      c.name.toLowerCase() === normalizedName
    )
    
    // Si encontramos y tenemos aspecto, verificar que coincida
    if (foundCard && mappedAspect) {
      if (foundCard.clase === mappedAspect) {
        return foundCard
      }
      // Si no coincide, buscar otra con el mismo nombre pero aspecto correcto
      foundCard = allCards.find(c => 
        c.name.toLowerCase() === normalizedName &&
        c.clase === mappedAspect
      )
    }
    
    if (foundCard) {
      return foundCard
    }
    
    // 4. Último recurso: buscar por nombre parcial
    foundCard = allCards.find(c => 
      c.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(c.name.toLowerCase())
    )
    
    return foundCard || null
  } catch (error) {
    console.error('Error finding card in our DB:', error)
    return null
  }
}

/**
 * Busca un héroe en nuestra base de datos por nombre o código
 */
async function findHeroInOurDB(
  heroName: string,
  heroCode?: string
): Promise<{ id: number; name: string } | null> {
  try {
    const heroes = await apiService.getHeroes()
    const normalizedHeroName = normalizeHeroName(heroName)
    
    // Función helper para normalizar nombres de héroes
    const normalizeForComparison = (name: string): string => {
      return name.toLowerCase().replace(/[_-]/g, ' ').trim()
    }
    
    // 1. Buscar por nombre exacto (normalizado)
    let foundHero = heroes.find(h => {
      const hName = normalizeForComparison(h.name)
      const hHeroName = normalizeForComparison(h.hero_name)
      return hName === normalizedHeroName || hHeroName === normalizedHeroName
    })
    
    // 2. Si no se encuentra, buscar por nombre parcial
    if (!foundHero) {
      foundHero = heroes.find(h => {
        const hName = normalizeForComparison(h.name)
        const hHeroName = normalizeForComparison(h.hero_name)
        return hName.includes(normalizedHeroName) || 
               normalizedHeroName.includes(hName) ||
               hHeroName.includes(normalizedHeroName) ||
               normalizedHeroName.includes(hHeroName)
      })
    }
    
    // 3. Si tenemos código y aún no encontramos, buscar por alter_ego o pack_name
    if (!foundHero && heroCode) {
      // Intentar buscar por código en el pack_name o alter_ego
      const codeNormalized = heroCode.toLowerCase().replace(/_/g, ' ')
      foundHero = heroes.find(h => {
        const packName = normalizeForComparison(h.pack_name || '')
        const alterEgo = normalizeForComparison(h.alter_ego || '')
        return packName.includes(codeNormalized) || 
               alterEgo.includes(codeNormalized) ||
               codeNormalized.includes(packName) ||
               codeNormalized.includes(alterEgo)
      })
    }
    
    if (foundHero) {
      return { id: foundHero.id, name: foundHero.hero_name || foundHero.name }
    }
    
    return null
  } catch (error) {
    console.error('Error finding hero in our DB:', error)
    return null
  }
}

/**
 * Resultado de la conversión de un mazo de MarvelCDB
 */
export interface ConvertedDeck {
  deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'>
  cardCodes: string[] // Códigos de MarvelCDB de todas las cartas del mazo
  notFoundCardCodes: string[] // Códigos de cartas que no se encontraron en nuestra BD
}

/**
 * Convierte un mazo de MarvelCDB al formato de nuestra aplicación
 */
export async function convertMarvelCDBDeck(
  marvelcdbDeck: MarvelCDBDeck,
  marvelcdbCards: Map<string, MarvelCDBCard> = new Map()
): Promise<ConvertedDeck> {
  try {
    // Obtener todas nuestras cartas una vez
    const allOurCards = await apiService.getAllCards()
    
    // Obtener información del héroe
    // Usar investigator_name si está disponible, sino investigator_code
    const heroName = marvelcdbDeck.investigator_name || marvelcdbDeck.investigator_code || ''
    const heroCode = marvelcdbDeck.investigator_code
    
    if (!heroName) {
      throw new Error('No se pudo determinar el héroe del mazo. El mazo debe tener investigator_name o investigator_code.')
    }
    
    const heroInfo = await findHeroInOurDB(heroName, heroCode)
    
    if (!heroInfo) {
      throw new Error(`No se pudo encontrar el héroe "${heroName}" (código: ${heroCode || 'N/A'}) en nuestra base de datos. Verifica que el héroe esté disponible.`)
    }
    
    // Mapear el aspecto - intentar obtenerlo del mazo o de las cartas
    let aspect = mapAspect(marvelcdbDeck.aspect)
    
    // Si no hay aspecto en el mazo, intentar inferirlo de las cartas del aspecto
    if (!aspect && Object.keys(marvelcdbDeck.slots).length > 0) {
      // Contar aspectos de las cartas (excluyendo basic, hero, encounter, campaign)
      const aspectCounts: Record<string, number> = {}
      
      for (const cardCode of Object.keys(marvelcdbDeck.slots)) {
        const card = marvelcdbCards.get(cardCode)
        if (card && card.faction_code) {
          const cardAspect = mapAspect(card.faction_code)
          // Solo contar aspectos válidos para mazos (no basic, hero, encounter, campaign)
          if (cardAspect && ['aggression', 'justice', 'leadership', 'protection', 'pool'].includes(cardAspect)) {
            aspectCounts[cardAspect] = (aspectCounts[cardAspect] || 0) + 1
          }
        }
      }
      
      // El aspecto más común es el del mazo
      if (Object.keys(aspectCounts).length > 0) {
        aspect = Object.entries(aspectCounts)
          .sort((a, b) => b[1] - a[1])[0][0] as 'aggression' | 'justice' | 'leadership' | 'protection' | 'pool'
      }
    }
    
    if (!aspect) {
      throw new Error('No se pudo determinar el aspecto del mazo. Asegúrate de que el mazo tenga un aspecto válido (aggression, justice, leadership, protection).')
    }
    
    // Convertir las cartas del mazo
    const deckCards: DeckCard[] = []
    const notFoundCards: string[] = []
    const allCardCodes: string[] = [] // Guardar los códigos de MarvelCDB para importación
    const notFoundCardCodes: string[] = [] // Códigos de cartas no encontradas
    
    for (const [cardCode, quantity] of Object.entries(marvelcdbDeck.slots)) {
      // Guardar el código para posible importación
      allCardCodes.push(cardCode)
      // Obtener información de la carta de MarvelCDB
      let marvelcdbCard = marvelcdbCards.get(cardCode)
      
      if (!marvelcdbCard) {
        // Si no está en el mapa, intentar obtenerla (esto puede ser lento)
        try {
          const { marvelcdbService } = await import('../services/marvelcdbService')
          marvelcdbCard = await marvelcdbService.getCardByCode(cardCode)
          marvelcdbCards.set(cardCode, marvelcdbCard)
        } catch (error) {
          console.warn(`No se pudo obtener la carta ${cardCode} de MarvelCDB`)
          continue
        }
      }
      
      // Mapear el aspecto esperado de la carta desde MarvelCDB
      const expectedAspect = mapAspect(marvelcdbCard.faction_code)
      
      // BUSCAR POR CÓDIGO DE MARVELCDB (más preciso y confiable)
      let ourCard: Card | null = null
      
      // Intentar buscar por código de MarvelCDB primero
      ourCard = await apiService.getCardByMarvelCDBCode(cardCode)
      
      // Si no se encuentra por código, buscar por nombre, set Y aspecto (fallback)
      if (!ourCard) {
        console.warn(`Carta ${cardCode} no encontrada por código, buscando por nombre...`)
        ourCard = await findCardInOurDB(
          marvelcdbCard.name,
          marvelcdbCard.pack_code,
          allOurCards,
          marvelcdbCard.faction_code // Pasar el faction_code para buscar por aspecto
        )
      }
      
      if (ourCard) {
        // Usar el aspecto mapeado de MarvelCDB (faction_code), no el de nuestra BD
        // Esto asegura que el aspecto sea correcto según MarvelCDB
        const cardAspect = expectedAspect || ourCard.clase
        
        deckCards.push({
          card_id: ourCard.id, // ID correcto de nuestra BD (obtenido por código de MarvelCDB)
          card_name: ourCard.name, // Nombre de nuestra BD
          quantity: quantity,
          set: ourCard.set,
          type: ourCard.type,
          clase: cardAspect // Aspecto mapeado desde MarvelCDB (faction_code)
        })
      } else {
        notFoundCards.push(marvelcdbCard.name)
        notFoundCardCodes.push(cardCode) // Guardar el código de la carta no encontrada
        console.warn(`Carta no encontrada en nuestra BD: ${marvelcdbCard.name} (${cardCode})`)
      }
    }
    
    // Si hay muchas cartas no encontradas, lanzar un error más descriptivo
    const totalCards = Object.keys(marvelcdbDeck.slots).length
    const notFoundPercentage = (notFoundCards.length / totalCards) * 100
    
    if (notFoundCards.length > 0) {
      // Si más del 30% de las cartas no se encuentran, es un problema serio
      if (notFoundPercentage > 30) {
        throw new Error(
          `No se pudieron encontrar muchas cartas (${notFoundCards.length} de ${totalCards}, ${Math.round(notFoundPercentage)}%). ` +
          `Esto puede deberse a que algunas cartas no están disponibles en nuestra base de datos. ` +
          `Cartas no encontradas: ${notFoundCards.slice(0, 10).join(', ')}${notFoundCards.length > 10 ? '...' : ''}`
        )
      }
      
      // Si hay algunas cartas no encontradas pero menos del 30%, solo advertir
      console.warn(`Algunas cartas no se encontraron (${notFoundCards.length} de ${totalCards}):`, notFoundCards)
    }
    
    // Crear el mazo en nuestro formato
    const deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'> = {
      name: marvelcdbDeck.name || 'Mazo importado de MarvelCDB',
      description: marvelcdbDeck.description_md || marvelcdbDeck.description || '',
      hero_name: heroInfo.name,
      hero_id: heroInfo.id,
      aspect: aspect,
      cards: deckCards
    }
    
    // Añadir nota de importación en la descripción
    deck.description = (deck.description || '') + `\n\n[Importado de MarvelCDB]`
    
    return {
      deck,
      cardCodes: allCardCodes,
      notFoundCardCodes
    }
  } catch (error) {
    console.error('Error converting MarvelCDB deck:', error)
    throw error
  }
}

