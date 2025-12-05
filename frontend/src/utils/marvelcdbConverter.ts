// Utilidades para convertir mazos de MarvelCDB al formato de nuestra aplicación

import { MarvelCDBDeck, MarvelCDBCard } from '../services/marvelcdbService'
import { Deck, DeckCard, Card, Hero } from '../types/card'
import { apiService } from '../services/api'

/**
 * Mapea el aspecto de MarvelCDB al formato de nuestra aplicación
 */
export function mapAspect(marvelcdbAspect?: string): 'aggression' | 'justice' | 'leadership' | 'protection' | 'pool' | undefined {
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
 * Mapeo de códigos/nombres de héroes de MarvelCDB a nombres en nuestra BD
 * Esto evita confusiones como Captain Marvel -> Adam Warlock
 */
const HERO_NAME_MAP: Record<string, string[]> = {
  'captain_marvel': ['captain marvel', 'carol danvers'],
  'spider_man': ['spider-man', 'peter parker'],
  'iron_man': ['iron man', 'tony stark'],
  'black_panther': ['black panther', 't\'challa'],
  'she_hulk': ['she-hulk', 'jennifer walters'],
  'adam_warlock': ['adam warlock'],
  'ant_man': ['ant-man', 'scott lang'],
  'wasp': ['wasp', 'janet van dyne'],
  'captain_america': ['captain america', 'steve rogers'],
  'ms_marvel': ['ms. marvel', 'kamala khan'],
  'hulk': ['hulk', 'bruce banner'],
  'thor': ['thor', 'odinson'],
  'black_widow': ['black widow', 'natasha romanoff'],
  'hawkeye': ['hawkeye', 'clint barton'],
  'doctor_strange': ['doctor strange', 'stephen strange'],
  'scarlet_witch': ['scarlet witch', 'wanda maximoff'],
  'vision': ['vision'],
  'gamora': ['gamora'],
  'rocket': ['rocket raccoon', 'rocket'],
  'groot': ['groot'],
  'star_lord': ['star-lord', 'peter quill'],
  'drax': ['drax'],
  'venom': ['venom', 'eddie brock'],
  'nova': ['nova', 'sam alexander'],
  'spectrum': ['spectrum', 'monica rambeau'],
  'war_machine': ['war machine', 'james rhodes'],
  'valkyrie': ['valkyrie', 'brunnhilde'],
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
 * Obtiene posibles nombres de un héroe basado en su código/nombre de MarvelCDB
 */
function getHeroNameVariations(heroName: string, heroCode?: string): string[] {
  const normalized = normalizeHeroName(heroName)
  const codeNormalized = heroCode ? normalizeHeroName(heroCode) : null
  
  const variations: string[] = [normalized]
  
  // Si tenemos código, buscar en el mapa
  if (codeNormalized && HERO_NAME_MAP[codeNormalized.replace(/\s/g, '_')]) {
    variations.push(...HERO_NAME_MAP[codeNormalized.replace(/\s/g, '_')])
  }
  
  // Si tenemos nombre, buscar en el mapa
  const nameKey = normalized.replace(/\s/g, '_')
  if (HERO_NAME_MAP[nameKey]) {
    variations.push(...HERO_NAME_MAP[nameKey])
  }
  
  // Añadir el nombre original y código normalizado
  if (codeNormalized && !variations.includes(codeNormalized)) {
    variations.push(codeNormalized)
  }
  
  return [...new Set(variations)] // Eliminar duplicados
}

/**
 * Busca una carta en nuestra base de datos por nombre, set y aspecto
 * PRIORIDAD: nombre + aspecto O nombre + set (ambos criterios combinados)
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
    
    // Normalizar pack code si está disponible
    const normalizedPack = packCode ? packCode.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ') : null
    
    // 1. PRIORIDAD: Buscar por nombre exacto Y aspecto Y set (si tenemos ambos)
    if (mappedAspect && normalizedPack) {
      const foundCard = allCards.find(c => {
        const cardNameMatch = c.name.toLowerCase() === normalizedName
        const aspectMatch = c.clase === mappedAspect
        const setMatch = c.set.toLowerCase().includes(normalizedPack) || normalizedPack.includes(c.set.toLowerCase())
        return cardNameMatch && aspectMatch && setMatch
      })
      if (foundCard) {
        return foundCard
      }
    }
    
    // 2. Buscar por nombre exacto Y aspecto (si tenemos aspecto)
    if (mappedAspect) {
      const foundCard = allCards.find(c => 
        c.name.toLowerCase() === normalizedName &&
        c.clase === mappedAspect
      )
      if (foundCard) {
        return foundCard
      }
    }
    
    // 3. Buscar por nombre exacto Y set (si tenemos pack_code)
    if (normalizedPack) {
      const foundCard = allCards.find(c => {
        const cardNameMatch = c.name.toLowerCase() === normalizedName
        const setMatch = c.set.toLowerCase().includes(normalizedPack) || normalizedPack.includes(c.set.toLowerCase())
        return cardNameMatch && setMatch
      })
      if (foundCard) {
        // Si encontramos y tenemos aspecto, verificar que coincida
        if (mappedAspect) {
          if (foundCard.clase === mappedAspect) {
            return foundCard
          }
          // Si no coincide el aspecto, seguir buscando
        } else {
          return foundCard
        }
      }
    }
    
    // 4. Buscar por nombre exacto solamente (último recurso)
    const foundCard = allCards.find(c => 
      c.name.toLowerCase() === normalizedName
    )
    
    // Si encontramos y tenemos aspecto, verificar que coincida
    if (foundCard && mappedAspect) {
      if (foundCard.clase === mappedAspect) {
        return foundCard
      }
      // Si no coincide, buscar otra con el mismo nombre pero aspecto correcto
      const foundWithAspect = allCards.find(c => 
        c.name.toLowerCase() === normalizedName &&
        c.clase === mappedAspect
      )
      if (foundWithAspect) {
        return foundWithAspect
      }
    }
    
    if (foundCard) {
      return foundCard
    }
    
    // 5. Último recurso: buscar por nombre parcial (solo si no hay otra opción)
    const partialMatch = allCards.find(c => 
      c.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(c.name.toLowerCase())
    )
    
    return partialMatch || null
  } catch (error) {
    console.error('Error finding card in our DB:', error)
    return null
  }
}

/**
 * Busca un héroe en nuestra base de datos por nombre o código
 * Usa mapeo de nombres conocidos para evitar confusiones
 */
async function findHeroInOurDB(
  heroName: string,
  heroCode?: string
): Promise<{ id: number; name: string } | null> {
  try {
    const heroes = await apiService.getHeroes()
    
    // Función helper para normalizar nombres de héroes
    const normalizeForComparison = (name: string): string => {
      return name.toLowerCase().replace(/[_-]/g, ' ').trim()
    }
    
    // Obtener todas las variaciones posibles del nombre del héroe
    const nameVariations = getHeroNameVariations(heroName, heroCode)
    
    // 1. Buscar por todas las variaciones del nombre (exacto)
    let foundHero: Hero | null = null
    
    for (const variation of nameVariations) {
      foundHero = heroes.find(h => {
        const hName = normalizeForComparison(h.name)
        const hHeroName = normalizeForComparison(h.hero_name)
        const hAlterEgo = normalizeForComparison(h.alter_ego || '')
        const normalizedVariation = normalizeForComparison(variation)
        
        return hName === normalizedVariation || 
               hHeroName === normalizedVariation ||
               hAlterEgo === normalizedVariation
      }) || null
      
      if (foundHero) {
        break
      }
    }
    
    // 2. Si no se encuentra, buscar por nombre parcial (pero más estricto)
    if (!foundHero) {
      for (const variation of nameVariations) {
        const normalizedVariation = normalizeForComparison(variation)
        foundHero = heroes.find(h => {
          const hName = normalizeForComparison(h.name)
          const hHeroName = normalizeForComparison(h.hero_name)
          const hAlterEgo = normalizeForComparison(h.alter_ego || '')
          
          // Buscar coincidencias parciales pero más estrictas
          return (hName.includes(normalizedVariation) && normalizedVariation.length > 3) || 
                 (normalizedVariation.includes(hName) && hName.length > 3) ||
                 (hHeroName.includes(normalizedVariation) && normalizedVariation.length > 3) ||
                 (normalizedVariation.includes(hHeroName) && hHeroName.length > 3) ||
                 (hAlterEgo.includes(normalizedVariation) && normalizedVariation.length > 3) ||
                 (normalizedVariation.includes(hAlterEgo) && hAlterEgo.length > 3)
        }) || null
        
        if (foundHero) {
          break
        }
      }
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
  marvelcdbCards: Map<string, MarvelCDBCard> // Datos completos de las cartas de MarvelCDB (para importación)
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
    // La API de MarvelCDB puede devolver el héroe en diferentes campos
    // Revisar la documentación: https://marvelcdb.com/api/doc
    // Posibles campos: investigator_name, investigator_code, investigator, hero, etc.
    console.log('MarvelCDB Deck data:', JSON.stringify(marvelcdbDeck, null, 2))
    
    // Intentar obtener el héroe de diferentes campos posibles
    const heroName = marvelcdbDeck.investigator_name || 
                     marvelcdbDeck.investigator_code || 
                     (marvelcdbDeck as any).investigator ||
                     (marvelcdbDeck as any).hero ||
                     (marvelcdbDeck as any).hero_name ||
                     ''
    const heroCode = marvelcdbDeck.investigator_code || 
                     (marvelcdbDeck as any).investigator ||
                     (marvelcdbDeck as any).hero_code ||
                     ''
    
    if (!heroName) {
      // Mostrar todos los campos disponibles para debug
      const availableFields = Object.keys(marvelcdbDeck).join(', ')
      throw new Error(
        `No se pudo determinar el héroe del mazo. ` +
        `El mazo debe tener investigator_name o investigator_code. ` +
        `Campos disponibles en la respuesta: ${availableFields}. ` +
        `Revisa la documentación de la API: https://marvelcdb.com/api/doc`
      )
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
      // cardCode es el 'code' de MarvelCDB (ej: "01001"), NO un 'id' numérico
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
      // cardCode es el 'code' de MarvelCDB (ej: "01001"), NO un 'id' numérico
      let ourCard: Card | null = null
      
      // Intentar buscar por código de MarvelCDB primero (usando el 'code', no 'id')
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
        // CRÍTICO: Usar SIEMPRE el aspecto mapeado de MarvelCDB (faction_code)
        // NO usar el aspecto de nuestra BD porque puede ser incorrecto
        // Si no tenemos aspecto de MarvelCDB, entonces usar el de nuestra BD como fallback
        const cardAspect = expectedAspect || ourCard.clase
        
        deckCards.push({
          card_id: ourCard.id, // ID correcto de nuestra BD (obtenido por código de MarvelCDB)
          card_name: ourCard.name, // Nombre de nuestra BD
          quantity: quantity,
          set: ourCard.set,
          type: ourCard.type,
          clase: cardAspect // Aspecto mapeado desde MarvelCDB (faction_code) - CRÍTICO
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
    
    // Función para limpiar enlaces markdown de la descripción
    const cleanMarkdownLinks = (text: string): string => {
      if (!text) return ''
      
      // Reemplazar enlaces markdown [texto](/card/12345) con solo el texto
      // Patrón: [texto](/card/12345) o [texto](/card/12345 "tooltip")
      return text.replace(/\[([^\]]+)\]\(\/[^\)]+\)/g, '$1')
    }
    
    // Limpiar la descripción de enlaces markdown
    const rawDescription = marvelcdbDeck.description_md || marvelcdbDeck.description || ''
    const cleanedDescription = cleanMarkdownLinks(rawDescription)
    
    // Crear el mazo en nuestro formato
    const deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'> = {
      name: marvelcdbDeck.name || 'Mazo importado de MarvelCDB',
      description: cleanedDescription,
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
      notFoundCardCodes,
      marvelcdbCards // Devolver el mapa completo de cartas para importación
    }
  } catch (error) {
    console.error('Error converting MarvelCDB deck:', error)
    throw error
  }
}

