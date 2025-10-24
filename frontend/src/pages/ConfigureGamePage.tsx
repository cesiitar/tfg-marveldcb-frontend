import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { apiService } from '../services/api'
import { useAuth0 } from '@auth0/auth0-react'

const ConfigureGamePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast, ToastContainer } = useToast()
  const { user } = useAuth0()
  
  const [difficulty, setDifficulty] = useState<'normal' | 'expert'>('normal')
  const [villain, setVillain] = useState<string>('')
  const [gameResult, setGameResult] = useState<'win' | 'loss' | ''>('')
  const [saving, setSaving] = useState(false)
  const [villains, setVillains] = useState<string[]>([])
  const [loadingVillains, setLoadingVillains] = useState(true)
  
  // Obtener el ID del mazo desde la navegación
  const deckId = location.state?.deckId

  // Cargar villanos al montar el componente
  useEffect(() => {
    const loadVillains = async () => {
      try {
        setLoadingVillains(true)
        const villainsData = await apiService.getVillains()
        // El backend ya devuelve un array de strings válidos
        setVillains(villainsData)
        console.log('🎭 Villanos cargados:', villainsData)
      } catch (error) {
        console.error('Error cargando villanos:', error)
        showToast('Error al cargar la lista de villanos', 'error')
      } finally {
        setLoadingVillains(false)
      }
    }

    loadVillains()
  }, []) // ← Quitar showToast de las dependencias para evitar bucle infinito

  const handleSave = async () => {
    if (!deckId) {
      showToast('Error: No se encontró el ID del mazo', 'error')
      return
    }

    if (!villain) {
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
      
      const gameConfig = {
        deck_id: deckId,
        difficulty: difficulty,
        villain: villain,
        result: gameResult,
        played_at: new Date().toISOString()
      }
      
      console.log('📤 Enviando configuración de partida:', gameConfig)
      await apiService.saveGameConfiguration(gameConfig, user.sub)
      
      showToast('Configuración de partida guardada correctamente', 'success')
      navigate('/mydecks')
      
    } catch (err) {
      console.error('Error guardando configuración:', err)
      showToast('Error al guardar la configuración', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    navigate('/mydecks')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Configurar Partida</h1>
                <p className="text-green-100 text-lg">
                  Ayuda a la IA a aprender configurando los detalles de tu partida
                </p>
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-medium">IA Learning</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Columna izquierda - Configuración */}
          <div className="space-y-6">
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
                  onChange={(e) => setVillain(e.target.value)}
                  disabled={loadingVillains}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingVillains ? 'Cargando villanos...' : 'Selecciona un villano...'}
                  </option>
                  {villains.map((villainName, index) => (
                    <option key={index} value={villainName.toLowerCase().replace(/\s+/g, '-')}>
                      {villainName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Villanos dinámicos</p>
                    <p>Los villanos se cargan automáticamente desde la base de datos. Si hay algún problema, se mostrarán los villanos básicos.</p>
                  </div>
                </div>
              </div>
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

          {/* Columna derecha - Información */}
          <div className="space-y-6">
            {/* Información sobre la IA */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                ¿Por qué configurar la partida?
              </h3>
              
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>La IA aprende de tus decisiones y estrategias para mejorar las recomendaciones futuras</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>El nivel de dificultad ayuda a entender el contexto de tu estrategia</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>El villano seleccionado permite analizar matchups específicos</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>El resultado (victoria/derrota) ayuda a entender la efectividad del mazo</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Esta información se usa para sugerir mejores mazos en el futuro</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !villain || !gameResult}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center"
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
                      Guardar Configuración
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleSkip}
                  className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Omitir por ahora
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Puedes configurar esta información más tarde desde "Mis Mazos"
                </p>
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
