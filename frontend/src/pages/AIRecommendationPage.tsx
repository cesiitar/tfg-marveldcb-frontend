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
  const [generatedDecks, setGeneratedDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [totalGenerated, setTotalGenerated] = useState<number>(0)
  const [totalRequested, setTotalRequested] = useState<number>(3)
  const [error, setError] = useState<string | null>(null)
  const [deckName, setDeckName] = useState<string>('')
  const [deckDescription, setDeckDescription] = useState<string>('')
  const [maxDecks, setMaxDecks] = useState<number>(3)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          patches: selectedPatches, // Por ahora vacío, se implementará después
          max_decks: maxDecks  // Número de mazos a generar (1-4)
        },
        user.sub
      )

      // Validar que la respuesta tenga el formato esperado
      if (!response || !response.decks || !Array.isArray(response.decks)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }

      setGeneratedDecks(response.decks)
      setTotalGenerated(response.total_generated ?? response.decks.length)
      setTotalRequested(response.total_requested ?? maxDecks)
      setSelectedDeck(null)  // Resetear selección
      // Inicializar nombre y descripción como vacíos para que el usuario los complete
      setDeckName('')
      setDeckDescription('')
      
      const decksCount = response.decks.length
      showToast(`${decksCount} mazo(s) generado(s) exitosamente`, 'success')
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

  const handleSelectDeck = (deck: Deck) => {
    // Si ya está seleccionado, deseleccionarlo
    if (selectedDeck && 
        selectedDeck.hero_id === deck.hero_id && 
        selectedDeck.aspect === deck.aspect &&
        selectedDeck.cards.length === deck.cards.length) {
      setSelectedDeck(null)
      setDeckName('')
      setDeckDescription('')
    } else {
      setSelectedDeck(deck)
      setDeckName('')
      setDeckDescription('')
    }
  }

  const handleUseDeck = async () => {
    if (!selectedDeck || !user?.sub) {
      showToast('Por favor, selecciona un mazo', 'error')
      return
    }
    
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
    if (!selectedDeck.id) {
      // Validar nombre duplicado antes de crear el mazo (globalmente, case-insensitive)
      try {
        const allDecks = await apiService.getDecks()
        const normalizedNewName = deckName.trim().toLowerCase()
        const duplicateDeck = allDecks.find(deck => 
          deck.name.trim().toLowerCase() === normalizedNewName
        )
        
        if (duplicateDeck) {
          showToast(`Ya existe un mazo con el nombre "${deckName}". Por favor, elige otro nombre.`, 'error')
          return
        }
      } catch (err) {
        console.error('Error verificando nombres duplicados:', err)
        // Continuar con la creación si falla la verificación (no bloquear)
      }
      
      try {
        setGeneratingDeck(true)
        const savedDeck = await apiService.createDeck(
          {
            name: deckName.trim(),
            description: deckDescription.trim(),
            hero_name: selectedDeck.hero_name,
            hero_id: selectedDeck.hero_id,
            aspect: selectedDeck.aspect,
            cards: selectedDeck.cards
          },
          user.sub
        )
        showToast('Mazo guardado exitosamente', 'success')
        navigate(`/decks/${savedDeck.id}`)
      } catch (err: any) {
        console.error('Error guardando mazo:', err)
        showToast('Error al guardar el mazo', 'error')
      } finally {
        setGeneratingDeck(false)
      }
    } else {
      // Si ya tiene ID, navegar directamente
      navigate(`/decks/${selectedDeck.id}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Recomendación IA</h1>
            <p className="text-gray-600 mb-6">Debes iniciar sesión para usar la recomendación de IA. Por favor, usa el botón de Login en el header para acceder.</p>
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

        <div className={`grid gap-6 ${selectedDeck ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Panel izquierdo: Selección */}
          <div className={`space-y-6 ${selectedDeck ? 'lg:col-span-1' : ''}`}>
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

            {/* Número de mazos a generar */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Número de Mazos
              </h2>
              <p className="text-gray-600 mb-4">
                Selecciona cuántos mazos quieres generar (máximo 4). Los mazos estarán ordenados por probabilidad de victoria.
              </p>
              <select
                value={maxDecks}
                onChange={(e) => setMaxDecks(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              >
                <option value={1}>1 mazo</option>
                <option value={2}>2 mazos</option>
                <option value={3}>3 mazos (recomendado)</option>
                <option value={4}>4 mazos</option>
              </select>
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
                `Generar ${maxDecks} Mazo${maxDecks > 1 ? 's' : ''} con IA`
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
          <div className={`space-y-6 ${selectedDeck ? 'lg:col-span-2' : ''}`}>
            {generatedDecks.length > 0 ? (
              <>
                {/* Mensaje informativo si hay menos mazos generados que solicitados */}
                {totalGenerated < totalRequested && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          Se generaron {totalGenerated} de {totalRequested} mazos solicitados
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          {totalGenerated === 1 
                            ? 'Solo hay una combinación disponible con datos históricos.'
                            : `Solo hay ${totalGenerated} combinaciones disponibles con datos históricos.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de mazos generados */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mazos Generados ({generatedDecks.length})
                  </h2>
                  
                  {generatedDecks.map((deck, index) => {
                    const winProbability = deck.win_probability ?? null
                    // Comparar mazos por hero_id, aspect y estructura de cartas
                    const isSelected = selectedDeck && 
                      selectedDeck.hero_id === deck.hero_id && 
                      selectedDeck.aspect === deck.aspect &&
                      selectedDeck.cards.length === deck.cards.length
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleSelectDeck(deck)}
                        className={`bg-white rounded-lg shadow-lg p-6 border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-xl'
                        }`}
                      >
                        {/* Header con ranking y probabilidad */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-gradient-to-r from-blue-400 to-blue-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                Opción {index + 1}
                              </h3>
                              {winProbability !== null && (
                                <p className="text-sm text-gray-600">
                                  {Math.round(winProbability * 100)}% probabilidad de victoria
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              Seleccionado
                            </div>
                          )}
                        </div>

                        {/* Información del mazo */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Héroe:</span>
                            <span className="text-gray-900">{deck.hero_name}</span>
                          </div>
                          {deck.aspect && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Aspecto:</span>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getClassPillClasses(deck.aspect)}`}>
                                {deck.aspect}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Total de cartas:</span>
                            <span className="text-gray-900">
                              {deck.cards.reduce((sum, card) => sum + card.quantity, 0)} cartas
                            </span>
                          </div>
                        </div>

                        {/* Probabilidad destacada */}
                        {winProbability !== null && (
                          <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-green-800">
                                Probabilidad de Victoria
                              </span>
                              <span className="text-2xl font-bold text-green-700">
                                {Math.round(winProbability * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Panel de edición cuando hay un mazo seleccionado */}
                {selectedDeck && (
                  <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-blue-500 sticky top-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                        <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Personalizar Mazo Seleccionado
                      </h2>
                      <button
                        onClick={() => {
                          setSelectedDeck(null)
                          setDeckName('')
                          setDeckDescription('')
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Cerrar"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Información del mazo seleccionado destacada */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-sm font-semibold text-blue-800 mb-1">Héroe</p>
                          <p className="text-lg font-bold text-blue-900">{selectedDeck.hero_name}</p>
                        </div>
                        {selectedDeck.aspect && (
                          <div>
                            <p className="text-sm font-semibold text-blue-800 mb-1">Aspecto</p>
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getClassPillClasses(selectedDeck.aspect)}`}>
                              {selectedDeck.aspect}
                            </span>
                          </div>
                        )}
                        {selectedDeck.win_probability !== null && selectedDeck.win_probability !== undefined && (
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-800 mb-1">Probabilidad</p>
                            <p className="text-2xl font-bold text-green-700">
                              {Math.round(selectedDeck.win_probability * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
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
                      
                      {/* Vista previa del mazo */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                          <span>Lista de Cartas</span>
                          <span className="text-sm font-normal text-gray-500">
                            {selectedDeck.cards.length} tipos • {selectedDeck.cards.reduce((sum, card) => sum + card.quantity, 0)} total
                          </span>
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                          <div className="space-y-2">
                            {selectedDeck.cards.map((card, index) => (
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
                          {generatingDeck ? 'Guardando...' : 'Guardar y Ver Mazo'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDeck(null)
                            setDeckName('')
                            setDeckDescription('')
                          }}
                          disabled={generatingDeck}
                          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón para generar otros mazos */}
                {!selectedDeck && (
                  <button
                    onClick={() => {
                      setGeneratedDecks([])
                      setSelectedDeck(null)
                      setDeckName('')
                      setDeckDescription('')
                      setError(null)
                    }}
                    disabled={generatingDeck || !selectedVillainId}
                    className="w-full py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                  >
                    Generar Otros Mazos
                  </button>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Mazos Generados</h3>
                  <p className="text-gray-500">
                    Selecciona un villano y genera mazos optimizados con IA
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

