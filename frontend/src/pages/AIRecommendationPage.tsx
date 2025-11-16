import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { useToast } from '../components/Toast'
import { Deck } from '../types/card'
import { getClassPillClasses } from '../utils/classColors'

const AIRecommendationPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  
  const [villains, setVillains] = useState<{ id: number; name: string }[]>([])
  const [selectedVillainId, setSelectedVillainId] = useState<number | null>(null)
  const [selectedVillainName, setSelectedVillainName] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'normal' | 'expert'>('normal')
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]) // Placeholder para parches
  const [loadingVillains, setLoadingVillains] = useState(true)
  const [generatingDeck, setGeneratingDeck] = useState(false)
  const [generatedDeck, setGeneratedDeck] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deckName, setDeckName] = useState<string>('')
  const [deckDescription, setDeckDescription] = useState<string>('')

  // Cargar villanos al montar
  useEffect(() => {
    const loadVillains = async () => {
      try {
        setLoadingVillains(true)
        const villainsData = await apiService.getVillainsWithIds()
        setVillains(villainsData)
      } catch (err) {
        console.error('Error cargando villanos:', err)
        setError('Error al cargar la lista de villanos')
        showToast('Error al cargar la lista de villanos', 'error')
      } finally {
        setLoadingVillains(false)
      }
    }

    loadVillains()
  }, [])

  const handleGenerateDeck = async () => {
    if (!selectedVillainId) {
      showToast('Por favor, selecciona un villano', 'error')
      return
    }

    if (!isAuthenticated || !user?.sub) {
      showToast('Debes estar autenticado para generar un mazo', 'error')
      return
    }

    setGeneratingDeck(true)
    setError(null)

    try {
      // Llamar al endpoint de generación de mazo basado en villano
      const response = await apiService.generateDeckForVillain(
        {
          villain_id: selectedVillainId,
          difficulty: difficulty,
          patches: selectedPatches // Por ahora vacío, se implementará después
        },
        user.sub
      )

      setGeneratedDeck(response.deck)
      // Inicializar nombre y descripción con los valores del mazo generado
      setDeckName(response.deck.name || '')
      setDeckDescription(response.deck.description || '')
      showToast('✅ Mazo generado exitosamente', 'success')
    } catch (err: any) {
      console.error('Error generando mazo:', err)
      let errorMessage = err.message || 'Error al generar el mazo con IA'
      
      // Mensajes más específicos según el tipo de error
      if (errorMessage.includes('no disponible') || errorMessage.includes('503')) {
        errorMessage = 'Modelo de IA no disponible. Necesita ser entrenado primero o no hay suficientes datos.'
      } else if (errorMessage.includes('404') || errorMessage.includes('no encontrado')) {
        errorMessage = 'Villano no encontrado. Por favor, selecciona otro villano.'
      } else if (errorMessage.includes('401') || errorMessage.includes('autenticado')) {
        errorMessage = 'Debes estar autenticado para generar un mazo.'
      } else if (errorMessage.includes('400') || errorMessage.includes('inválid')) {
        errorMessage = 'Datos inválidos. Por favor, verifica la dificultad seleccionada.'
      }
      
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setGeneratingDeck(false)
    }
  }

  const handleUseDeck = async () => {
    if (!generatedDeck || !user?.sub) return
    
    // Validar que nombre y descripción estén rellenados
    if (!deckName.trim()) {
      showToast('Por favor, ingresa un nombre para el mazo', 'error')
      return
    }
    
    if (!deckDescription.trim()) {
      showToast('Por favor, ingresa una descripción para el mazo', 'error')
      return
    }
    
    // Si el mazo no tiene ID, guardarlo primero
    if (!generatedDeck.id) {
      try {
        setGeneratingDeck(true)
        const savedDeck = await apiService.createDeck(
          {
            name: deckName.trim(),
            description: deckDescription.trim(),
            hero_name: generatedDeck.hero_name,
            hero_id: generatedDeck.hero_id,
            aspect: generatedDeck.aspect,
            cards: generatedDeck.cards
          },
          user.sub
        )
        showToast('✅ Mazo guardado exitosamente', 'success')
        navigate(`/decks/${savedDeck.id}`)
      } catch (err: any) {
        console.error('Error guardando mazo:', err)
        showToast('Error al guardar el mazo', 'error')
      } finally {
        setGeneratingDeck(false)
      }
    } else {
      // Si ya tiene ID, navegar directamente
      navigate(`/decks/${generatedDeck.id}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Recomendación IA</h1>
            <p className="text-gray-600 mb-6">Debes iniciar sesión para usar la recomendación de IA.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-lg shadow-lg mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="relative z-10 px-6 py-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Recomendación de IA
            </h1>
            <p className="text-xl text-gray-200">
              Selecciona un villano y genera un mazo optimizado con inteligencia artificial
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Selección */}
          <div className="space-y-6">
            {/* Selección de Villano */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Selecciona un Villano
              </h2>
              
              {loadingVillains ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Cargando villanos...</p>
                </div>
              ) : (
                <select
                  value={selectedVillainId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value)
                    setSelectedVillainId(id || null)
                    const villain = villains.find(v => v.id === id)
                    setSelectedVillainName(villain?.name || '')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                >
                  <option value="">Selecciona un villano...</option>
                  {villains.map((villain) => (
                    <option key={villain.id} value={villain.id}>
                      {villain.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Dificultad */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dificultad
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="normal"
                    checked={difficulty === 'normal'}
                    onChange={(e) => setDifficulty(e.target.value as 'normal' | 'expert')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Normal</span>
                    <p className="text-sm text-gray-600">Dificultad estándar</p>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="expert"
                    checked={difficulty === 'expert'}
                    onChange={(e) => setDifficulty(e.target.value as 'normal' | 'expert')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Experto</span>
                    <p className="text-sm text-gray-600">Mayor desafío</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Parches (Placeholder) */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Parches Disponibles
              </h2>
              <p className="text-gray-600 mb-4">
                Esta funcionalidad se implementará próximamente. Por ahora, la IA generará el mazo sin restricciones de parches.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 italic">
                  Próximamente: Selección de parches y cartas de tu colección
                </p>
              </div>
            </div>

            {/* Botón Generar */}
            <button
              onClick={handleGenerateDeck}
              disabled={!selectedVillainId || generatingDeck}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                !selectedVillainId || generatingDeck
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {generatingDeck ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando mazo...
                </span>
              ) : (
                'Generar Mazo con IA'
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Panel derecho: Resultado */}
          <div className="space-y-6">
            {generatedDeck ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mazo Generado
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Nombre del Mazo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      placeholder="Ingresa un nombre para tu mazo"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Personaliza el nombre de tu mazo</p>
                  </div>
                  
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={deckDescription}
                      onChange={(e) => setDeckDescription(e.target.value)}
                      placeholder="Describe tu mazo o estrategia..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Añade una descripción para tu mazo</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Seleccionado automáticamente por IA:</span> La inteligencia artificial ha elegido el mejor héroe y aspecto para enfrentar a este villano.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Héroe</h3>
                    <p className="text-lg text-gray-900">{generatedDeck.hero_name}</p>
                    <p className="text-xs text-gray-500 mt-1">Seleccionado automáticamente por la IA</p>
                  </div>
                  
                  {generatedDeck.aspect && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Aspecto</h3>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {generatedDeck.aspect}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Seleccionado automáticamente por la IA</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Total de Cartas</h3>
                    <p className="text-lg text-gray-900">
                      {generatedDeck.cards.reduce((sum, card) => sum + card.quantity, 0)} cartas
                    </p>
                  </div>
                  
                  {/* Vista previa del mazo */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
                      <span>Lista de Cartas</span>
                      <span className="text-sm font-normal text-gray-500">
                        {generatedDeck.cards.length} tipos de cartas
                      </span>
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {generatedDeck.cards.map((card, index) => (
                          <div
                            key={`${card.card_id}-${index}`}
                            className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">{card.card_name}</span>
                                {card.clase && (
                                  card.clase === 'basic' ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                      basic
                                    </span>
                                  ) : (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getClassPillClasses(card.clase)}`}>
                                      {card.clase}
                                    </span>
                                  )
                                )}
                                {(card.card_set || card.set) && (
                                  <span className="text-xs text-gray-500">({card.card_set || card.set})</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 font-semibold">x{card.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={handleUseDeck}
                      disabled={generatingDeck || !deckName.trim() || !deckDescription.trim()}
                      className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium ${
                        generatingDeck || !deckName.trim() || !deckDescription.trim()
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {generatingDeck ? 'Guardando...' : generatedDeck.id ? 'Ver Mazo' : 'Guardar y Ver Mazo'}
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedDeck(null)
                        setDeckName('')
                        setDeckDescription('')
                        setSelectedVillainId(null)
                        setSelectedVillainName('')
                        setError(null)
                      }}
                      disabled={generatingDeck}
                      className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                    >
                      Generar Otro
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Mazo Generado</h3>
                  <p className="text-gray-500">
                    Selecciona un villano y genera un mazo optimizado con IA
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default AIRecommendationPage

