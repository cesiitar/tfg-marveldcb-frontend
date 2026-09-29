import React, { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { marvelcdbService } from '../services/marvelcdbService'
import { convertMarvelCDBDeck } from '../utils/marvelcdbConverter'
import { apiService } from '../services/api'
import { useToast } from './Toast'
import { Deck } from '../types/card'
import { UploadSimpleIcon, WarningIcon, XIcon } from '@phosphor-icons/react'

interface ImportDeckModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
}

const ImportDeckModal: React.FC<ImportDeckModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const { user } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  const [deckUrlOrId, setDeckUrlOrId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null)
  const [cardCodes, setCardCodes] = useState<string[]>([]) // Códigos de MarvelCDB de las cartas
  const [marvelcdbCardsMap, setMarvelcdbCardsMap] = useState<Map<string, any>>(new Map()) // Datos completos de cartas
  const [originalMarvelcdbDeck, setOriginalMarvelcdbDeck] = useState<any>(null) // Mazo original de MarvelCDB para obtener cantidades
  const [importing, setImporting] = useState(false)
  const [importingCards, setImportingCards] = useState(false)

  const handleClose = () => {
    setDeckUrlOrId('')
    setError(null)
    setPreviewDeck(null)
    setCardCodes([])
    setMarvelcdbCardsMap(new Map())
    setOriginalMarvelcdbDeck(null)
    onClose()
  }

  const handlePreview = async () => {
    if (!deckUrlOrId.trim()) {
      setError('Por favor, ingresa una URL o ID de mazo de MarvelCDB')
      return
    }

    setLoading(true)
    setError(null)
    setPreviewDeck(null)

    try {
      // Extraer el ID del mazo
      const deckId = marvelcdbService.extractDeckIdFromUrl(deckUrlOrId.trim())
      
      if (!deckId) {
        throw new Error('No se pudo extraer el ID del mazo. Por favor, verifica la URL o ID.')
      }

      // Obtener el mazo de MarvelCDB
      const marvelcdbDeck = await marvelcdbService.getDeckById(deckId)
      setOriginalMarvelcdbDeck(marvelcdbDeck) // Guardar el mazo original para obtener cantidades después
      
      // Obtener todas las cartas de MarvelCDB para el mapeo
      const allMarvelcdbCards = await marvelcdbService.getAllCards()
      const cardsMap = new Map(allMarvelcdbCards.map(card => [card.code, card]))
      
      // Convertir el mazo a nuestro formato
      const convertedResult = await convertMarvelCDBDeck(marvelcdbDeck, cardsMap)
      
      // Crear un objeto Deck para preview (sin ID)
      const preview: Deck = {
        ...convertedResult.deck,
        id: undefined
      }
      
      setPreviewDeck(preview)
      setCardCodes(convertedResult.cardCodes) // Guardar los códigos de las cartas
      setMarvelcdbCardsMap(convertedResult.marvelcdbCards) // Guardar los datos completos de las cartas
      showToast('Mazo cargado correctamente. Revisa la vista previa y haz clic en "Importar" para guardarlo.', 'success')
    } catch (err: any) {
      console.error('Error previewing deck:', err)
      const errorMessage = err.message || 'Error al cargar el mazo de MarvelCDB'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!previewDeck) {
      setError('No hay mazo para importar')
      return
    }

    setImporting(true)
    setError(null)

    try {
      // Verificar que el nombre no esté duplicado
      const allDecks = await apiService.getDecks()
      const normalizedNewName = previewDeck.name.trim().toLowerCase()
      const duplicateDeck = allDecks.find(deck => 
        deck.name.trim().toLowerCase() === normalizedNewName
      )
      
      if (duplicateDeck) {
        throw new Error(`Ya existe un mazo con el nombre "${previewDeck.name}". Por favor, edita el nombre antes de importar.`)
      }

      // 1. Verificar qué cartas faltan (esto nos dice cuáles NO existen)
      if (cardCodes.length > 0) {
        setImportingCards(true)
        
        try {
          // checkResult.missing = cartas que NO existen en nuestra BD
          // checkResult.existing = cartas que YA existen en nuestra BD
          const checkResult = await apiService.checkMissingCards(cardCodes)
          
          // 2. Si hay cartas faltantes, importarlas pasando TODOS los datos completos
          // Solo pasamos datos de las cartas que NO existen (checkResult.missing)
          if (checkResult.missing && checkResult.missing.length > 0) {
            showToast(`Importando ${checkResult.missing.length} carta(s) faltante(s)...`, 'info')
            
            // Preparar datos completos SOLO de las cartas que NO existen
            const cardsToImport = checkResult.missing
              .map(code => {
                const marvelcdbCard = marvelcdbCardsMap.get(code)
                if (!marvelcdbCard) return null
                
                // Pasar TODOS los datos que tenemos de MarvelCDB
                return {
                  code: marvelcdbCard.code,
                  name: marvelcdbCard.name,
                  type_code: marvelcdbCard.type_code,
                  faction_code: marvelcdbCard.faction_code,
                  pack_code: marvelcdbCard.pack_code,
                  // Nombre del set / pack. El backend lo usará para el campo `set`.
                  card_set_name: marvelcdbCard.card_set_name || marvelcdbCard.pack_name || marvelcdbCard.pack_code,
                  // Opcionalmente también enviamos el nombre del pack por separado
                  pack_name: marvelcdbCard.pack_name,
                }
              })
              .filter(card => card !== null) as Array<{
                code: string
                name: string
                type_code: string
                faction_code: string
                pack_code: string
                card_set_name: string
                pack_name?: string
              }>
            
            // Pasar los datos completos de las cartas que NO existen
            const importResult = await apiService.importMissingCards(undefined, cardsToImport, user?.sub)
            
            if (importResult.imported > 0) {
              showToast(`${importResult.imported} carta(s) importada(s) exitosamente`, 'success')
            }
            
            if (importResult.failed > 0) {
              const failedCards = importResult.errors?.map(e => e.code).join(', ') || ''
              console.warn(`${importResult.failed} carta(s) no se pudieron importar:`, failedCards)
              showToast(`Algunas cartas no se pudieron importar: ${failedCards}`, 'info')
            }
          }
        } catch (importError: any) {
          console.error('Error importing missing cards:', importError)
          showToast('Error al importar cartas faltantes', 'error')
          throw importError // Lanzar error para no continuar si falla la importación
        } finally {
          setImportingCards(false)
        }
      }

      // 3. Buscar TODAS las cartas del mazo (las que existían + las recién creadas) para obtener sus IDs
      showToast('Buscando todas las cartas del mazo...', 'info')
      const finalDeckCards: any[] = []
      
      for (const [cardCode, quantity] of Object.entries(originalMarvelcdbDeck?.slots || {})) {
        try {
          // Buscar la carta por código de MarvelCDB
          const card = await apiService.getCardByMarvelCDBCode(cardCode)
          
          if (card) {
            finalDeckCards.push({
              card_id: card.id,
              card_name: card.name,
              quantity: quantity,
              set: card.set,
              type: card.type,
              clase: card.clase
            })
          } else {
            console.warn(`No se pudo encontrar la carta ${cardCode} después de importarla`)
          }
        } catch (error) {
          console.warn(`Error buscando la carta ${cardCode}:`, error)
        }
      }
      
      // 4. Crear el mazo con todas las cartas (existentes + recién creadas)
      const deckToCreate = {
        ...previewDeck,
        cards: finalDeckCards
      }
      
      const createdDeck = await apiService.createDeck(deckToCreate, user?.sub)
      
      showToast(`Mazo "${createdDeck.name}" importado exitosamente`, 'success')
      if (createdDeck.hero_unresolved === true) {
        showToast('No obstante, el héroe no está vinculado a la base de datos, por lo que este mazo no participará en las recomendaciones de IA.', 'info')
      }
      handleClose()
      onImportSuccess()
    } catch (err: any) {
      console.error('Error importing deck:', err)
      const errorMessage = err.message || 'Error al importar el mazo'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-ink-900 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UploadSimpleIcon className="w-6 h-6" weight="bold" aria-hidden="true" />
                Importar Mazo desde MarvelCDB
              </h2>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XIcon className="w-6 h-6" weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">¿Cómo importar un mazo?</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Ve a <a href="https://marvelcdb.com/decklists" target="_blank" rel="noopener noreferrer" className="underline">MarvelCDB</a> y encuentra el mazo que quieres importar</li>
                <li>Copia la URL del mazo (ej: https://marvelcdb.com/decklist/view/12345) o solo el ID (ej: 12345)</li>
                <li>Pega la URL o ID en el campo de abajo y haz clic en "Vista Previa"</li>
                <li>Revisa la información del mazo y haz clic en "Importar" para guardarlo en tus mazos</li>
              </ol>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL o ID del mazo de MarvelCDB
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deckUrlOrId}
                  onChange={(e) => setDeckUrlOrId(e.target.value)}
                  placeholder="https://marvelcdb.com/decklist/view/12345 o solo 12345"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || importing}
                />
                <button
                  onClick={handlePreview}
                  disabled={loading || importing || !deckUrlOrId.trim()}
                  className="btn btn-primary"
                >
                  {loading ? 'Cargando...' : 'Vista Previa'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Preview */}
            {previewDeck && (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Vista Previa del Mazo</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold text-gray-700">Nombre:</span>
                    <span className="ml-2 text-gray-900">{previewDeck.name}</span>
                  </div>
                  
                  {previewDeck.description && (
                    <div>
                      <span className="font-semibold text-gray-700">Descripción:</span>
                      <p className="mt-1 text-gray-600 text-sm whitespace-pre-wrap">{previewDeck.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-semibold text-gray-700">Héroe:</span>
                    <span className="ml-2 text-gray-900">{previewDeck.hero_name}</span>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Aspecto:</span>
                    <span className="ml-2 text-gray-900 capitalize">{previewDeck.aspect}</span>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Total de cartas:</span>
                    <span className="ml-2 text-gray-900">
                      {previewDeck.cards.reduce((sum, card) => sum + card.quantity, 0)} cartas
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      El número puede variar ligeramente respecto al mazo original, pero se importarán todas las cartas.
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-700">Tipos de cartas:</span>
                    <span className="ml-2 text-gray-900">{previewDeck.cards.length} tipos diferentes</span>
                  </div>
                  
                  {/* Lista de cartas */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Cartas del mazo:</h4>
                    <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-1">
                        {previewDeck.cards.map((card, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">{card.card_name}</span>
                            <span className="text-gray-500">x{card.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advertencia sobre cartas faltantes */}
                  {previewDeck.description && previewDeck.description.includes('no se encontraron') && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <WarningIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" weight="duotone" aria-hidden="true" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-semibold mb-1">Advertencia: Algunas cartas no se encontraron</p>
                          <p className="text-xs">El mazo se importará pero puede estar incompleto. Revisa la descripción para más detalles.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleImport}
                    disabled={importing || importingCards}
                    className="btn btn-primary flex-1"
                  >
                    {importingCards ? 'Importando cartas...' : importing ? 'Importando mazo...' : 'Importar Mazo'}
                  </button>
                  <button
                    onClick={() => setPreviewDeck(null)}
                    disabled={importing}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default ImportDeckModal

