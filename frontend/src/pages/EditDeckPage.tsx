import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Deck, Card } from '../types/card'
import { useToast } from '../components/Toast'

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
  const [basicSearchTerm, setBasicSearchTerm] = useState('')
  const [aspectSearchTerm, setAspectSearchTerm] = useState('')
  const [filteredBasicCards, setFilteredBasicCards] = useState<Card[]>([])
  const [filteredAspectCards, setFilteredAspectCards] = useState<Card[]>([])
  
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
        
        // Inicializar estados de edición
        setDeckName(deckData.name)
        setDeckDescription((deckData as any).description || '')
        
        // Convertir cartas del mazo a Map para edición
        const cardsMap = new Map<string, number>()
        deckData.cards.forEach((card: any) => {
          const cardName = card.card_name || card.name
          cardsMap.set(cardName, card.quantity)
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

  // Filtrar cartas básicas cuando cambie el término de búsqueda
  useEffect(() => {
    if (basicSearchTerm.trim() === '') {
      setFilteredBasicCards(basicCards)
    } else {
      const filtered = basicCards.filter(card => 
        card.name.toLowerCase().startsWith(basicSearchTerm.toLowerCase()) ||
        card.set.toLowerCase().startsWith(basicSearchTerm.toLowerCase()) ||
        card.type.toLowerCase().startsWith(basicSearchTerm.toLowerCase())
      )
      setFilteredBasicCards(filtered)
    }
  }, [basicSearchTerm, basicCards])

  // Filtrar cartas del aspecto cuando cambie el término de búsqueda
  useEffect(() => {
    if (aspectSearchTerm.trim() === '') {
      setFilteredAspectCards(aspectCards)
    } else {
      const filtered = aspectCards.filter(card => 
        card.name.toLowerCase().startsWith(aspectSearchTerm.toLowerCase()) ||
        card.set.toLowerCase().startsWith(aspectSearchTerm.toLowerCase()) ||
        card.type.toLowerCase().startsWith(aspectSearchTerm.toLowerCase())
      )
      setFilteredAspectCards(filtered)
    }
  }, [aspectSearchTerm, aspectCards])

  // Calcular total de cartas seleccionadas
  const totalSelectedCards = Array.from(selectedCards.values()).reduce((sum, quantity) => sum + quantity, 0)
  const remainingCards = 40 - totalSelectedCards

  // Añadir carta al mazo
  const addCard = (cardName: string) => {
    if (remainingCards <= 0) {
      showToast('❌ Ya tienes 40 cartas en el mazo', 'error')
      return
    }
    
    const currentQuantity = selectedCards.get(cardName) || 0
    const card = [...basicCards, ...aspectCards].find(c => c.name === cardName)
    const maxQuantity = card?.max_quantity || 3
    
    if (currentQuantity >= maxQuantity) {
      showToast(`❌ No puedes añadir más de ${maxQuantity} copias de esta carta`, 'error')
      return
    }
    
    setSelectedCards(prev => new Map(prev.set(cardName, currentQuantity + 1)))
  }

  // Quitar carta del mazo
  const removeCard = (cardName: string) => {
    const currentQuantity = selectedCards.get(cardName) || 0
    if (currentQuantity <= 1) {
      setSelectedCards(prev => {
        const newMap = new Map(prev)
        newMap.delete(cardName)
        return newMap
      })
    } else {
      setSelectedCards(prev => new Map(prev.set(cardName, currentQuantity - 1)))
    }
  }

  // Guardar cambios
  const handleSave = async () => {
    if (!deck) return
    
    if (!deckName.trim()) {
      showToast('❌ El nombre del mazo es obligatorio', 'error')
      return
    }
    
    if (totalSelectedCards !== 40) {
      showToast('❌ El mazo debe tener exactamente 40 cartas', 'error')
      return
    }
    
    try {
      setSaving(true)
      
      // Verificar que tenemos el Auth0 SUB del usuario
      if (!user?.sub) {
        showToast('❌ No hay Auth0 ID. Inicia sesión nuevamente.', 'error')
        return
      }
      
      // Convertir Map a array de cartas
      const cardsArray = Array.from(selectedCards.entries()).map(([name, quantity]) => ({
        card_name: name,
        quantity: quantity
      }))
      
      const updatedDeck = {
        name: deckName.trim(),
        description: deckDescription.trim(),
        hero_name: deck.hero_name,
        aspect: deck.aspect,
        cards: cardsArray
      }
      
      await apiService.updateDeck(deck.id!, updatedDeck, user.sub)
      
      showToast('🎉 ¡Mazo actualizado exitosamente!', 'success')
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        <div className="relative z-10 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-4">
              <div></div>
              <button
                onClick={() => navigate('/mydecks')}
                className="text-white hover:text-gray-300 flex items-center transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a Mis Mazos
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Editar Mazo
              </h1>
              <p className="text-lg text-gray-300 mb-6">
                Modifica tu mazo de {deck.hero_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            
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
                        <span className="text-gray-600">Cartas:</span>
                        <span className="font-medium">{totalSelectedCards}/40</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || totalSelectedCards !== 40}
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
                      {totalSelectedCards}/40 cartas
                    </span>
                    <div className={`w-3 h-3 rounded-full ${totalSelectedCards === 40 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                </div>
                
                {/* Cartas Básicas */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Cartas Básicas
                    {basicSearchTerm && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({filteredBasicCards.length})
                      </span>
                    )}
                  </h3>
                  
                  <div className="mb-3">
                    <input
                      type="text"
                      value={basicSearchTerm}
                      onChange={(e) => setBasicSearchTerm(e.target.value)}
                      placeholder="Buscar cartas básicas..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredBasicCards.length === 0 && basicSearchTerm ? (
                      <p className="text-gray-500 text-center py-4">No se encontraron cartas básicas</p>
                    ) : (
                      filteredBasicCards.map((card) => {
                        const quantity = selectedCards.get(card.name) || 0
                        const maxQuantity = card.max_quantity || 3
                        const canAddMore = remainingCards > 0 && quantity < maxQuantity
                        
                        return (
                          <div key={card.name} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{card.name}</h4>
                              <p className="text-xs text-gray-600">
                                {card.type} • Coste: {card.cost} • Set: {card.set}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeCard(card.name)}
                                disabled={quantity === 0}
                                className="w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                              <button
                                onClick={() => addCard(card.name)}
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
                    {aspectSearchTerm && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({filteredAspectCards.length})
                      </span>
                    )}
                  </h3>
                  
                  <div className="mb-3">
                    <input
                      type="text"
                      value={aspectSearchTerm}
                      onChange={(e) => setAspectSearchTerm(e.target.value)}
                      placeholder="Buscar cartas del aspecto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredAspectCards.length === 0 && aspectSearchTerm ? (
                      <p className="text-gray-500 text-center py-4">No se encontraron cartas del aspecto</p>
                    ) : (
                      filteredAspectCards.map((card) => {
                        const quantity = selectedCards.get(card.name) || 0
                        const maxQuantity = card.max_quantity || 3
                        const canAddMore = remainingCards > 0 && quantity < maxQuantity
                        
                        return (
                          <div key={card.name} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{card.name}</h4>
                              <p className="text-xs text-gray-600">
                                {card.type} • Coste: {card.cost} • Set: {card.set}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeCard(card.name)}
                                disabled={quantity === 0}
                                className="w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                              <button
                                onClick={() => addCard(card.name)}
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
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default EditDeckPage
