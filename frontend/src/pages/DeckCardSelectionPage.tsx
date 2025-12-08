import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Card, DeckCard } from '../types/card'

interface DeckCardSelectionPageProps {
  heroName: string
  aspectName: string
  heroCards: Card[]
  onComplete: (selectedCards: DeckCard[]) => void
  onBack: () => void
}

const DeckCardSelectionPage: React.FC<DeckCardSelectionPageProps> = ({
  heroName,
  aspectName,
  heroCards,
  onComplete,
  onBack
}) => {
  const { isAuthenticated } = useAuth()
  const [basicCards, setBasicCards] = useState<Card[]>([])
  const [aspectCards, setAspectCards] = useState<Card[]>([])
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [basicSearchTerm, setBasicSearchTerm] = useState('')
  const [aspectSearchTerm, setAspectSearchTerm] = useState('')
  const [basicSetFilter, setBasicSetFilter] = useState<string>('')
  const [aspectSetFilter, setAspectSetFilter] = useState<string>('')
  const [filteredBasicCards, setFilteredBasicCards] = useState<Card[]>([])
  const [filteredAspectCards, setFilteredAspectCards] = useState<Card[]>([])

  // Calcular total de cartas seleccionadas
  const totalSelectedCards = Array.from(selectedCards.values()).reduce((sum, quantity) => sum + quantity, 0)
  const heroCardsCount = heroCards.reduce((sum, card) => sum + (card.quantity || 1), 0)
  const totalCards = heroCardsCount + totalSelectedCards
  const remainingCards = 50 - totalCards

  // Obtener sets únicos de cartas básicas
  const uniqueBasicSets = Array.from(new Set(basicCards.map(card => card.set).filter(Boolean))).sort()
  
  // Obtener sets únicos de cartas del aspecto
  const uniqueAspectSets = Array.from(new Set(aspectCards.map(card => card.set).filter(Boolean))).sort()

  // Filtrar cartas básicas cuando cambie el término de búsqueda o el filtro de set
  useEffect(() => {
    let filtered = basicCards

    // Aplicar filtro de nombre
    if (basicSearchTerm.trim() !== '') {
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(basicSearchTerm.toLowerCase()) ||
        card.set.toLowerCase().includes(basicSearchTerm.toLowerCase()) ||
        card.type.toLowerCase().includes(basicSearchTerm.toLowerCase())
      )
    }

    // Aplicar filtro de set
    if (basicSetFilter !== '') {
      filtered = filtered.filter(card => card.set === basicSetFilter)
    }

    setFilteredBasicCards(filtered)
  }, [basicSearchTerm, basicSetFilter, basicCards])

  // Filtrar cartas del aspecto cuando cambie el término de búsqueda o el filtro de set
  useEffect(() => {
    let filtered = aspectCards

    // Aplicar filtro de nombre
    if (aspectSearchTerm.trim() !== '') {
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(aspectSearchTerm.toLowerCase()) ||
        card.set.toLowerCase().includes(aspectSearchTerm.toLowerCase()) ||
        card.type.toLowerCase().includes(aspectSearchTerm.toLowerCase())
      )
    }

    // Aplicar filtro de set
    if (aspectSetFilter !== '') {
      filtered = filtered.filter(card => card.set === aspectSetFilter)
    }

    setFilteredAspectCards(filtered)
  }, [aspectSearchTerm, aspectSetFilter, aspectCards])

  // Cargar cartas básicas y del aspecto
  useEffect(() => {
    const loadCards = async () => {
      setLoading(true)
      try {
        // Cargar cartas básicas
        const basicCardsData = await apiService.getCardsByAspect('basic')
        setBasicCards(basicCardsData)
        setFilteredBasicCards(basicCardsData)
        
        // Cargar cartas del aspecto seleccionado
        const aspectCardsData = await apiService.getCardsByAspect(aspectName)
        setAspectCards(aspectCardsData)
        setFilteredAspectCards(aspectCardsData)
      } catch (err) {
        console.error('Error loading cards:', err)
        setError('Error al cargar las cartas')
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [aspectName])

  // Función helper para crear clave única de carta usando ID único
  const getCardKey = (card: Card): string => {
    return `${card.id}` // Usar ID único
  }

  // Función helper para obtener carta desde la clave
  const getCardFromKey = (cardKey: string): Card | undefined => {
    const cardId = parseInt(cardKey)
    return [...basicCards, ...aspectCards, ...heroCards].find(c => c.id === cardId)
  }

  const handleCardQuantityChange = (cardKey: string, quantity: number, maxQuantity?: number) => {
    const newSelectedCards = new Map(selectedCards)
    
    // Validar límite máximo de la carta
    if (maxQuantity && quantity > maxQuantity) {
      setError(`No puedes añadir más de ${maxQuantity} copias de esta carta`)
      return
    }
    
    if (quantity <= 0) {
      newSelectedCards.delete(cardKey)
    } else {
      newSelectedCards.set(cardKey, quantity)
    }
    
    setSelectedCards(newSelectedCards)
    setError(null) // Limpiar error si la operación es válida
  }

  const handleComplete = () => {
    
    const cardMap = new Map<string, number>()
    
    // Añadir cartas del héroe con sus cantidades automáticas
    heroCards.forEach(card => {
      const cardKey = getCardKey(card)
      const currentQuantity = cardMap.get(cardKey) || 0
      cardMap.set(cardKey, currentQuantity + (card.quantity || 1))
    })
    
    // Añadir cartas seleccionadas
    selectedCards.forEach((quantity, cardKey) => {
      const currentQuantity = cardMap.get(cardKey) || 0
      cardMap.set(cardKey, currentQuantity + quantity)
    })

    // Convertir Map a array de cartas - usar IDs únicos para evitar duplicados
    const deckCards: DeckCard[] = Array.from(cardMap.entries()).map(([cardKey, quantity]) => {
      const card = getCardFromKey(cardKey)
      if (!card) {
        return null
      }
      
      return {
        card_id: card.id,
        card_name: card.name,
        card_set: card.set,
        quantity: quantity
      }
    }).filter(Boolean) as DeckCard[]

    onComplete(deckCards)
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Selección de Cartas</h1>
          <p className="text-gray-600">Debes iniciar sesión para crear un mazo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Seleccionar Cartas</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Volver
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Información del mazo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Información del Mazo</h2>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Héroe:</strong> {heroName}</p>
            <p><strong>Aspecto:</strong> {aspectName}</p>
            <p><strong>Cartas del héroe:</strong> {heroCardsCount}</p>
            <p><strong>Cartas seleccionadas:</strong> {totalSelectedCards}</p>
            <p><strong>Total de cartas:</strong> {totalCards}/50</p>
            <p className={`font-medium ${remainingCards < 0 ? 'text-red-600' : remainingCards === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              <strong>Cartas restantes:</strong> {remainingCards}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando cartas...</p>
          </div>
        ) : (
          <div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Cartas básicas */}
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Cartas Básicas
                  {(basicSearchTerm || basicSetFilter) && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({filteredBasicCards.length})
                    </span>
                  )}
                </h2>
                
                {/* Buscador para cartas básicas */}
                <div className="mb-4 space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={basicSearchTerm}
                      onChange={(e) => setBasicSearchTerm(e.target.value)}
                      placeholder="Buscar cartas básicas..."
                      className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {basicSearchTerm && (
                      <button
                        onClick={() => setBasicSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center"
                      >
                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {/* Filtro de set para cartas básicas */}
                  <select
                    value={basicSetFilter}
                    onChange={(e) => setBasicSetFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm bg-white"
                  >
                    <option value="">Todos los sets</option>
                    {uniqueBasicSets.map((set) => (
                      <option key={set} value={set}>
                        {set}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredBasicCards.length === 0 && (basicSearchTerm || basicSetFilter) ? (
                    <p className="text-gray-500 text-center py-4">No se encontraron cartas básicas</p>
                  ) : (
                    filteredBasicCards.map((card) => {
                      const cardKey = getCardKey(card)
                      const quantity = selectedCards.get(cardKey) || 0
                      const maxQuantity = card.max_quantity
                      const canAddMore = remainingCards > 0 && (maxQuantity ? quantity < maxQuantity : true)
                      return (
                        <div key={cardKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-800">{card.name}</h3>
                            <p className="text-xs text-gray-500">
                              Cost: {card.cost} | {card.set} | Max: {maxQuantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCardQuantityChange(cardKey, Math.max(0, quantity - 1), maxQuantity)}
                              className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full hover:bg-gray-400 flex items-center justify-center text-sm"
                              disabled={quantity <= 0}
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                            <button
                              onClick={() => handleCardQuantityChange(cardKey, quantity + 1, maxQuantity)}
                              className="w-6 h-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center text-sm"
                              disabled={!canAddMore}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Cartas del aspecto */}
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Cartas de {aspectName}
                  {(aspectSearchTerm || aspectSetFilter) && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({filteredAspectCards.length})
                    </span>
                  )}
                </h2>
                
                {/* Buscador para cartas del aspecto */}
                <div className="mb-4 space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={aspectSearchTerm}
                      onChange={(e) => setAspectSearchTerm(e.target.value)}
                      placeholder={`Buscar cartas de ${aspectName}...`}
                      className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {aspectSearchTerm && (
                      <button
                        onClick={() => setAspectSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center"
                      >
                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {/* Filtro de set para cartas del aspecto */}
                  <select
                    value={aspectSetFilter}
                    onChange={(e) => setAspectSetFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm bg-white"
                  >
                    <option value="">Todos los sets</option>
                    {uniqueAspectSets.map((set) => (
                      <option key={set} value={set}>
                        {set}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredAspectCards.length === 0 && (aspectSearchTerm || aspectSetFilter) ? (
                    <p className="text-gray-500 text-center py-4">No se encontraron cartas del aspecto</p>
                  ) : (
                    filteredAspectCards.map((card) => {
                      const cardKey = getCardKey(card)
                      const quantity = selectedCards.get(cardKey) || 0
                      const maxQuantity = card.max_quantity
                      const canAddMore = remainingCards > 0 && (maxQuantity ? quantity < maxQuantity : true)
                      return (
                        <div key={cardKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-800">{card.name}</h3>
                            <p className="text-xs text-gray-500">
                              Cost: {card.cost} | {card.set} | Max: {maxQuantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCardQuantityChange(cardKey, Math.max(0, quantity - 1), maxQuantity)}
                              className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full hover:bg-gray-400 flex items-center justify-center text-sm"
                              disabled={quantity <= 0}
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                            <button
                              onClick={() => handleCardQuantityChange(cardKey, quantity + 1, maxQuantity)}
                              className="w-6 h-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center text-sm"
                              disabled={!canAddMore}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón finalizar */}
        <div className="mt-8 text-center">
          <button
            onClick={handleComplete}
            disabled={totalCards < 40 || totalCards > 50}
            className={`px-8 py-3 rounded-lg font-medium transition-colors duration-200 ${
              totalCards >= 40 && totalCards <= 50
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {totalCards >= 40 && totalCards <= 50 ? 'Finalizar Mazo' : totalCards < 40 ? `Necesitas ${40 - totalCards} cartas más` : `Tienes ${totalCards - 50} cartas de más`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeckCardSelectionPage