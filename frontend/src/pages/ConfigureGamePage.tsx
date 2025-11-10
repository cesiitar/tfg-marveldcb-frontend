import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { apiService } from '../services/api'
import { useAuth0 } from '@auth0/auth0-react'
import { Deck } from '../types/card'

const ConfigureGamePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast, ToastContainer } = useToast()
  const { user } = useAuth0()
  
  const [difficulty, setDifficulty] = useState<'normal' | 'expert'>('normal')
  const [villain, setVillain] = useState<string>('')
  const [villainId, setVillainId] = useState<number | null>(null)
  const [gameResult, setGameResult] = useState<'win' | 'loss' | ''>('')
  const [saving, setSaving] = useState(false)
  const [villains, setVillains] = useState<{ id: number; name: string }[]>([])
  const [loadingVillains, setLoadingVillains] = useState(true)
  const [aiRecommendations, setAiRecommendations] = useState<Array<{
    villain_id: number
    villain_name: string
    win_probability: number
    recommendation: 'recommended' | 'neutral' | 'not_recommended'
    confidence: string
    reason: string
  }>>([])
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  
  // Obtener los datos del mazo desde la navegación (en lugar del deckId)
  const deckData = location.state?.deckData as Omit<Deck, 'id' | 'created_at' | 'updated_at'> | undefined
  const useAI = location.state?.useAI as boolean | undefined || false

  // Cargar villanos al montar el componente
  useEffect(() => {
    const loadVillains = async () => {
      try {
        setLoadingVillains(true)
        const villainsData = await apiService.getVillainsWithIds()
        // El backend devuelve un array de objetos { id, name }
        setVillains(villainsData)
        console.log('🎭 Villanos con IDs cargados:', villainsData)
      } catch (error) {
        console.error('Error cargando villanos:', error)
        showToast('Error al cargar la lista de villanos', 'error')
      } finally {
        setLoadingVillains(false)
      }
    }

    loadVillains()
  }, []) // ← Quitar showToast de las dependencias para evitar bucle infinito

  // Cargar recomendaciones de IA si está activada
  useEffect(() => {
    if (useAI && deckData && user?.sub && deckData.hero_id && deckData.aspect) {
      loadAIRecommendations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useAI, difficulty]) // Recargar cuando cambie la dificultad

  const loadAIRecommendations = async () => {
    if (!user?.sub || !deckData || !deckData.hero_id || !deckData.aspect) return

    setLoadingAI(true)
    setAiError(null)
    
    try {
      const response = await apiService.getVillainRecommendations(
        {
          hero_id: deckData.hero_id,
          aspect: deckData.aspect,
          cards: deckData.cards || [],
          difficulty: difficulty
        },
        user.sub
      )

      setAiRecommendations(response.recommendations || [])
      console.log('🤖 Recomendaciones de IA cargadas:', response.recommendations)
    } catch (error: any) {
      console.error('Error cargando recomendaciones IA:', error)
      setAiError(error.message || 'Error al cargar recomendaciones de IA')
      // No mostrar toast si el modelo no está disponible (error 503)
      if (!error.message?.includes('no disponible')) {
        showToast('Error al cargar recomendaciones de IA', 'error')
      }
    } finally {
      setLoadingAI(false)
    }
  }

  const handleSave = async () => {
    if (!deckData) {
      showToast('Error: No se encontraron los datos del mazo', 'error')
      return
    }

    if (!villainId) {
      showToast('Por favor selecciona un villano', 'error')
      return
    }

    if (!gameResult) {
      showToast('Por favor selecciona el resultado de la partida', 'error')
      return
    }

    if (!user?.sub) {
      showToast('Error: No se encontró el ID de usuario', 'error')
      return
    }

    try {
      setSaving(true)
      
      // Primero crear el mazo
      console.log('📤 Creando mazo con datos:', deckData)
      const createdDeck = await apiService.createDeck(deckData, user.sub)
      console.log('✅ Mazo creado exitosamente:', createdDeck)
      
      // Verificar que el mazo tiene un ID
      if (!createdDeck.id) {
        throw new Error('El mazo se creó pero no se recibió un ID válido')
      }
      
      // Mostrar mensaje de éxito al crear el mazo
      showToast(`🎉 ¡Mazo "${deckData.name}" creado exitosamente!`, 'success')
      
      // Luego crear la configuración de partida con el deckId del mazo recién creado
      const gameConfig = {
        deck_id: createdDeck.id,
        difficulty: difficulty,
        villain_id: villainId,
        result: gameResult,
        played_at: new Date().toISOString()
      }
      
      console.log('📤 Enviando configuración de partida:', gameConfig)
      await apiService.saveGameConfiguration(gameConfig, user.sub)
      
      showToast(`✅ Partida guardada correctamente`, 'success')
      navigate('/mydecks')
      
    } catch (err: any) {
      console.error('Error guardando mazo y configuración:', err)
      
      // Mostrar el mensaje exacto del backend si viene
      if (err && err.message) {
        showToast(`❌ ${err.message}`, 'error')
      } else {
        showToast('Error al guardar el mazo y la configuración', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    // Si el usuario omite la configuración, crear solo el mazo
    if (!deckData) {
      showToast('Error: No se encontraron los datos del mazo', 'error')
      return
    }

    if (!user?.sub) {
      showToast('Error: No se encontró el ID de usuario', 'error')
      return
    }

    try {
      setSaving(true)
      
      console.log('📤 Creando mazo sin configuración de partida:', deckData)
      const createdDeck = await apiService.createDeck(deckData, user.sub)
      console.log('✅ Mazo creado exitosamente:', createdDeck)
      
      showToast(`🎉 ¡Mazo "${deckData.name}" creado exitosamente!`, 'success')
      navigate('/mydecks')
      
    } catch (err: any) {
      console.error('Error creando mazo:', err)
      
      if (err && err.message) {
        showToast(`❌ ${err.message}`, 'error')
      } else {
        showToast('Error al crear el mazo', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        <div className="relative z-10 text-center py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">
              Configurar Partida
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Configura los detalles de tu partida para crear el mazo
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda y central - Configuración */}
          <div className="lg:col-span-2 space-y-6">
            {/* Nivel de dificultad */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Nivel de Dificultad
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
                    <div className="font-medium text-gray-900">Normal</div>
                    <div className="text-sm text-gray-600">Dificultad estándar para aprender los fundamentos</div>
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
                    <div className="font-medium text-gray-900">Experto</div>
                    <div className="text-sm text-gray-600">Dificultad alta para estrategias avanzadas</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Villano */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Villano
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Villano
                </label>
                <select
                  value={villain}
                  onChange={(e) => {
                    const selectedVillainName = e.target.value
                    setVillain(selectedVillainName)
                    // Encontrar el ID del villano seleccionado
                    const selectedVillain = villains.find(v => v.name === selectedVillainName)
                    setVillainId(selectedVillain?.id || null)
                  }}
                  disabled={loadingVillains}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingVillains ? 'Cargando villanos...' : 'Selecciona un villano...'}
                  </option>
                  {villains.map((villain) => (
                    <option key={villain.id} value={villain.name}>
                      {villain.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recomendaciones de IA */}
              {useAI && (
                <div className="mt-4">
                  {loadingAI ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium text-blue-800">Analizando tu mazo con IA...</span>
                      </div>
                    </div>
                  ) : aiError ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Recomendaciones de IA no disponibles</p>
                          <p className="mt-1">{aiError}</p>
                        </div>
                      </div>
                    </div>
                  ) : aiRecommendations.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="text-lg mr-2">🤖</span>
                        Recomendaciones de IA
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {aiRecommendations.slice(0, 5).map((rec) => {
                          const isSelected = rec.villain_id === villainId
                          const bgColor = rec.recommendation === 'recommended'
                            ? 'bg-green-50 border-green-200'
                            : rec.recommendation === 'not_recommended'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                          
                          const textColor = rec.recommendation === 'recommended'
                            ? 'text-green-800'
                            : rec.recommendation === 'not_recommended'
                            ? 'text-red-800'
                            : 'text-yellow-800'
                          
                          const icon = rec.recommendation === 'recommended'
                            ? '✅'
                            : rec.recommendation === 'not_recommended'
                            ? '❌'
                            : '⚠️'
                          
                          return (
                            <div
                              key={rec.villain_id}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${bgColor} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                              onClick={() => {
                                setVillain(rec.villain_name)
                                setVillainId(rec.villain_id)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{icon}</span>
                                  <span className={`font-medium ${textColor}`}>{rec.villain_name}</span>
                                </div>
                                <span className={`text-sm font-semibold ${textColor}`}>
                                  {Math.round(rec.win_probability * 100)}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 ml-7">{rec.reason}</p>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Haz clic en una recomendación para seleccionarla automáticamente
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Resultado de la partida */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resultado de la Partida
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="gameResult"
                    value="win"
                    checked={gameResult === 'win'}
                    onChange={(e) => setGameResult(e.target.value as 'win' | 'loss')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900 flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Victoria
                    </div>
                    <div className="text-sm text-gray-600">El mazo funcionó bien contra este villano</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="gameResult"
                    value="loss"
                    checked={gameResult === 'loss'}
                    onChange={(e) => setGameResult(e.target.value as 'win' | 'loss')}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900 flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Derrota
                    </div>
                    <div className="text-sm text-gray-600">El mazo necesita mejoras para este matchup</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Columna derecha - Botones */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !villainId || !gameResult}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardar y Crear Mazo
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center border border-gray-300 hover:border-gray-400"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando mazo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Crear sin partida
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-500">
                    Puedes configurar la partida más tarde desde "Mis Mazos"
                  </p>
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

export default ConfigureGamePage
