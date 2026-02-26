import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Deck, Card } from '../types/card'
import { useToast } from '../components/Toast'
import { translateCardType } from '../utils/typeTranslations'
import { getAspectHeaderGradient } from '../utils/classColors'

const EditDeckPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { showToast, ToastContainer } = useToast()
  
  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para edición
  const [deckName, setDeckName] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(new Map())
  const [basicCards, setBasicCards] = useState<Card[]>([])
  const [aspectCards, setAspectCards] = useState<Card[]>([])
  const [heroCards, setHeroCards] = useState<Card[]>([])
  const [basicSearchTerm, setBasicSearchTerm] = useState('')
  const [aspectSearchTerm, setAspectSearchTerm] = useState('')
  const [basicSetFilter, setBasicSetFilter] = useState<string>('')
  const [aspectSetFilter, setAspectSetFilter] = useState<string>('')
  const [filteredBasicCards, setFilteredBasicCards] = useState<Card[]>([])
  const [filteredAspectCards, setFilteredAspectCards] = useState<Card[]>([])

  // Función helper para crear clave única de carta usando ID
  const getCardKey = (card: Card): string => {
    return `${card.id}` // Usar ID único en lugar de nombre
  }

  // Función helper para obtener carta desde la clave
  const getCardFromKey = (cardKey: string): Card | undefined => {
    const cardId = parseInt(cardKey)
    return [...basicCards, ...aspectCards].find(c => c.id === cardId)
  }
  
  // Cargar el mazo existente
  useEffect(() => {
    const loadDeck = async () => {
      if (!id || !isAuthenticated) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Cargar el mazo
        const deckData = await apiService.getDeckById(Number(id))
        setDeck(deckData)
        
        // Cargar cartas básicas y del aspecto
        const basicCardsData = await apiService.getCardsByAspect('basic')
        setBasicCards(basicCardsData)
        setFilteredBasicCards(basicCardsData)
        
        const aspectCardsData = await apiService.getCardsByAspect(deckData.aspect || 'aggression')
        setAspectCards(aspectCardsData)
        setFilteredAspectCards(aspectCardsData)
        
        const heroes = await apiService.getHeroes()
        const hero = heroes.find(h => h.id === (deckData as any).hero_id)
        if (hero) {
          const heroCardsData = await apiService.getHeroCards(hero.id)
          setHeroCards(heroCardsData)
        }
        
        // Inicializar estados de edición
        setDeckName(deckData.name)
        setDeckDescription((deckData as any).description || '')
        
        // Convertir cartas del mazo a Map para edición usando IDs
        const cardsMap = new Map<string, number>()
        deckData.cards.forEach((card: any) => {
          // Buscar la carta por nombre + set para obtener su ID correcto
          const foundCard = [...basicCardsData, ...aspectCardsData].find(c => 
            c.name === (card.card_name || card.name) && 
            c.set === (card.card_set || card.set)
          )
          if (foundCard) {
            const cardKey = getCardKey(foundCard)
            cardsMap.set(cardKey, card.quantity)
          }
        })
        setSelectedCards(cardsMap)
        
      } catch (err) {
        console.error('Error loading deck:', err)
        setError('Error al cargar el mazo')
        showToast('❌ Error al cargar el mazo', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    loadDeck()
  }, [id, isAuthenticated])

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

  // Calcular total de cartas seleccionadas
  const totalSelectedCards = Array.from(selectedCards.values()).reduce((sum, quantity) => sum + quantity, 0)
  const heroCardsCount = heroCards.reduce((sum, card) => sum + (card.quantity || 1), 0)
  const totalCards = heroCardsCount + totalSelectedCards
  const remainingCards = 50 - totalCards

  // Añadir carta al mazo
  const addCard = (card: Card) => {
    if (remainingCards <= 0) {
      showToast('❌ Ya tienes 50 cartas en el mazo', 'error')
      return
    }
    
    const cardKey = getCardKey(card)
    const currentQuantity = selectedCards.get(cardKey) || 0
    const maxQuantity = card.max_quantity || 3
    
    if (currentQuantity >= maxQuantity) {
      showToast(`❌ No puedes añadir más de ${maxQuantity} copias de esta carta`, 'error')
      return
    }
    
    setSelectedCards(prev => new Map(prev.set(cardKey, currentQuantity + 1)))
  }

  // Quitar carta del mazo
  const removeCard = (card: Card) => {
    const cardKey = getCardKey(card)
    const currentQuantity = selectedCards.get(cardKey) || 0
    if (currentQuantity <= 1) {
      setSelectedCards(prev => {
        const newMap = new Map(prev)
        newMap.delete(cardKey)
        return newMap
      })
    } else {
      setSelectedCards(prev => new Map(prev.set(cardKey, currentQuantity - 1)))
    }
  }

  // Guardar cambios
  const handleSave = async () => {
    if (!deck) return
    
    if (!deckName.trim()) {
      showToast('❌ El nombre del mazo es obligatorio', 'error')
      return
    }
    
    if (totalCards < 40 || totalCards > 50) {
      showToast('❌ El mazo debe tener entre 40 y 50 cartas', 'error')
      return
    }
    
    // Verificar que tenemos el Auth0 SUB del usuario
    if (!user?.sub) {
      showToast('❌ No hay Auth0 ID. Inicia sesión nuevamente.', 'error')
      return
    }
    
    // Validar nombre duplicado (globalmente, case-insensitive, excluyendo el mazo actual)
    try {
      const allDecks = await apiService.getDecks()
      const normalizedNewName = deckName.trim().toLowerCase()
      const duplicateDeck = allDecks.find(d => 
        d.id !== deck.id && d.name.trim().toLowerCase() === normalizedNewName
      )
      
      if (duplicateDeck) {
        showToast(`❌ Ya existe un mazo con el nombre "${deckName}". Por favor, elige otro nombre.`, 'error')
        return
      }
    } catch (err) {
      console.error('Error verificando nombres duplicados:', err)
      // Continuar con la actualización si falla la verificación (no bloquear)
    }
    
    try {
      setSaving(true)
      
      // Convertir Map a array de cartas usando IDs únicos
      const editableCardsArray = Array.from(selectedCards.entries()).map(([cardKey, quantity]) => {
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
      }).filter(Boolean)
      
      // Obtener las cartas del héroe desde la API
      // Usar el hero_id que viene del backend (más seguro)
      const heroId = (deck as any).hero_id
      let cardsArray = [...editableCardsArray]
      
      if (heroId) {
        const heroCardsData = await apiService.getHeroCards(heroId)
        const heroCards = heroCardsData.map((card: Card) => ({
          card_id: card.id,
          card_name: card.name,
          card_set: card.set,
          quantity: card.quantity || 1
        }))
        
        // Combinar cartas editables + cartas del héroe
        cardsArray = [...editableCardsArray, ...heroCards]
      }
      
      const updatedDeck = {
        name: deckName.trim(),
        description: deckDescription.trim(),
        hero_name: deck.hero_name,
        hero_id: (deck as any).hero_id,
        aspect: deck.aspect,
        cards: cardsArray
      }
      
      await apiService.updateDeck(deck.id!, updatedDeck, user.sub)
      
      showToast('Mazo actualizado exitosamente', 'success')
      
      // Redirigir a la página de mis mazos
      setTimeout(() => {
        navigate('/mydecks')
      }, 1500)
      
    } catch (err: any) {
      console.error('Error updating deck:', err)
      showToast(`❌ Error al actualizar el mazo: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">Necesitas iniciar sesión para editar mazos</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mazo...</p>
        </div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Mazo no encontrado'}</p>
          <button 
            onClick={() => navigate('/mydecks')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Volver a Mis Mazos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className={`bg-gradient-to-r ${getAspectHeaderGradient(deck.aspect)} px-6 py-8`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Editar Mazo</h1>
                <div className="flex flex-wrap items-center gap-3 text-blue-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{deck.hero_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-medium capitalize">{deck.aspect}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m-6 0l-3 3m3-3l3 3m-3-3v10a2 2 0 002 2h2a2 2 0 002-2V7" />
                    </svg>
                    <span className="font-medium">{totalCards} cartas</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/mydecks')}
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Mis Mazos
              </button>
            </div>
          </div>
          
          {/* Información adicional en el header */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Cartas del héroe:</span>
                <span className="font-medium text-gray-900">{heroCardsCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Cartas seleccionadas:</span>
                <span className="font-medium text-gray-900">{totalSelectedCards}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-gray-900">{totalCards}/50 cartas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Restantes:</span>
                <span className={`font-medium ${remainingCards < 0 ? 'text-red-600' : remainingCards === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {remainingCards}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Columna izquierda - Información del mazo */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Mazo</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Mazo
                    </label>
                    <input
                      type="text"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del mazo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={deckDescription}
                      onChange={(e) => setDeckDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe tu estrategia o tema del mazo..."
                    />
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Información del Mazo</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Héroe:</span>
                        <span className="font-medium">{deck.hero_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aspecto:</span>
                        <span className="font-medium capitalize">{deck.aspect}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cartas del héroe:</span>
                        <span className="font-medium">{heroCardsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cartas seleccionadas:</span>
                        <span className="font-medium">{totalSelectedCards}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total de cartas:</span>
                        <span className="font-medium">{totalCards}/50</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || totalCards < 40 || totalCards > 50}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button
                      onClick={() => navigate('/mydecks')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Cartas */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Cartas del Mazo</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {totalCards}/50 cartas
                    </span>
                    <div className={`w-3 h-3 rounded-full ${totalCards >= 40 && totalCards <= 50 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                </div>
                
                {/* Cartas Básicas */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Cartas Básicas
                    {(basicSearchTerm || basicSetFilter) && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({filteredBasicCards.length})
                      </span>
                    )}
                  </h3>
                  
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={basicSearchTerm}
                      onChange={(e) => setBasicSearchTerm(e.target.value)}
                      placeholder="Buscar cartas básicas..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {/* Filtro de set para cartas básicas */}
                    <select
                      value={basicSetFilter}
                      onChange={(e) => setBasicSetFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                      <option value="">Todos los sets</option>
                      {uniqueBasicSets.map((set) => (
                        <option key={set} value={set}>
                          {set}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredBasicCards.length === 0 && (basicSearchTerm || basicSetFilter) ? (
                      <p className="text-gray-500 text-center py-4">No se encontraron cartas básicas</p>
                    ) : (
                      filteredBasicCards.map((card) => {
                        const quantity = selectedCards.get(getCardKey(card)) || 0
                        const maxQuantity = card.max_quantity || 3
                        const canAddMore = remainingCards > 0 && quantity < maxQuantity
                        
                        return (
                          <div key={card.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{card.name}</h4>
                              <p className="text-xs text-gray-600">
                                {translateCardType(card.type)} • Coste: {card.cost} • Set: {card.set} • Max: {maxQuantity}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeCard(card)}
                                disabled={quantity === 0}
                                className="w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                              <button
                                onClick={() => addCard(card)}
                                disabled={!canAddMore}
                                className="w-6 h-6 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-xs"
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
                
                {/* Cartas del Aspecto */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Cartas de {deck?.aspect || 'Aspecto'}
                    {(aspectSearchTerm || aspectSetFilter) && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({filteredAspectCards.length})
                      </span>
                    )}
                  </h3>
                  
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={aspectSearchTerm}
                      onChange={(e) => setAspectSearchTerm(e.target.value)}
                      placeholder="Buscar cartas del aspecto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {/* Filtro de set para cartas de la clase */}
                    <select
                      value={aspectSetFilter}
                      onChange={(e) => setAspectSetFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                      <option value="">Todos los sets</option>
                      {uniqueAspectSets.map((set) => (
                        <option key={set} value={set}>
                          {set}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredAspectCards.length === 0 && (aspectSearchTerm || aspectSetFilter) ? (
                      <p className="text-gray-500 text-center py-4">No se encontraron cartas del aspecto</p>
                    ) : (
                      filteredAspectCards.map((card) => {
                        const quantity = selectedCards.get(getCardKey(card)) || 0
                        const maxQuantity = card.max_quantity || 3
                        const canAddMore = remainingCards > 0 && quantity < maxQuantity
                        
                        return (
                          <div key={card.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{card.name}</h4>
                              <p className="text-xs text-gray-600">
                                {translateCardType(card.type)} • Coste: {card.cost} • Set: {card.set} • Max: {maxQuantity}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeCard(card)}
                                disabled={quantity === 0}
                                className="w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                              <button
                                onClick={() => addCard(card)}
                                disabled={!canAddMore}
                                className="w-6 h-6 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-xs"
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
          </div>
        </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default EditDeckPage
