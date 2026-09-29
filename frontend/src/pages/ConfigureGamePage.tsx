import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { apiService } from '../services/api'
import { useAuth0 } from '@auth0/auth0-react'
import { Deck } from '../types/card'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { CheckCircleIcon, CheckIcon, InfoIcon, LightningIcon, WarningIcon, XIcon } from '@phosphor-icons/react'

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
  
  // Obtener los datos del mazo desde la navegación
  // Puede ser un mazo nuevo (sin ID) o un mazo existente (con ID)
  const deckData = location.state?.deckData as Deck | Omit<Deck, 'id' | 'created_at' | 'updated_at'> | undefined
  const existingDeckId = location.state?.existingDeckId as number | undefined

  // Cargar villanos al montar el componente
  useEffect(() => {
    const loadVillains = async () => {
      try {
        setLoadingVillains(true)
        const villainsData = await apiService.getVillainsWithIds()
        setVillains(villainsData)
      } catch (error) {
        console.error('Error cargando villanos:', error)
        showToast('Error al cargar la lista de villanos', 'error')
      } finally {
        setLoadingVillains(false)
      }
    }

    loadVillains()
  }, [])

  const handleSave = async () => {
    if (!deckData) {
      showToast('Error: No se encontraron los datos del mazo', 'error')
      return
    }
    
    if (!user?.sub) {
      showToast('Error: Debes estar autenticado', 'error')
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

    try {
      setSaving(true)
      
      let deckId: number
      
      // Si hay un ID de mazo existente, usarlo directamente
      if (existingDeckId) {
        deckId = existingDeckId
      } else {
        // Si no, crear el mazo primero
        if (!deckData) {
          throw new Error('No se encontraron los datos del mazo')
        }
        const createdDeck = await apiService.createDeck(deckData, user.sub)
        
        // Verificar que el mazo tiene un ID
        if (!createdDeck.id) {
          throw new Error('El mazo se creó pero no se recibió un ID válido')
        }
        
        deckId = createdDeck.id
        
        // Mostrar mensaje de éxito al crear el mazo
        showToast(`Mazo "${deckData.name}" creado exitosamente`, 'success')
      }
      
      // Crear la configuración de partida
      const gameConfig = {
        deck_id: deckId,
        difficulty: difficulty,
        villain_id: villainId,
        result: gameResult,
        played_at: new Date().toISOString()
      }
      
      await apiService.saveGameConfiguration(gameConfig, user.sub)
      
      showToast('Partida guardada correctamente', 'success')
      
      // Esperar un momento para que el usuario vea el mensaje antes de navegar
      setTimeout(() => {
        navigate('/mydecks')
      }, 1500)
      
    } catch (err: any) {
      console.error('Error guardando mazo y configuración:', err)
      
      // Mostrar el mensaje exacto del backend si viene
      if (err && err.message) {
        showToast(`${err.message}`, 'error')
      } else {
        showToast('Error al guardar el mazo y la configuración', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    // Si el usuario omite la configuración, crear solo el mazo (si no existe ya)
    if (existingDeckId) {
      // Si ya existe el mazo, solo navegar de vuelta
      navigate('/mydecks')
      return
    }

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
      
      await apiService.createDeck(deckData, user.sub)
      
      showToast(`Mazo "${deckData.name}" creado exitosamente`, 'success')
      navigate('/mydecks')
      
    } catch (err: any) {
      console.error('Error creando mazo:', err)
      
      if (err && err.message) {
        showToast(`${err.message}`, 'error')
      } else {
        showToast('Error al crear el mazo', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Partidas</PageHeaderEyebrow>
          <PageHeaderTitle>Registrar Partida</PageHeaderTitle>
          <PageHeaderDescription>
            {existingDeckId
              ? 'Registra los detalles de una nueva partida con este mazo'
              : 'Registra los detalles de tu partida para crear el mazo'}
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda y central - Configuración */}
          <div className="lg:col-span-2 space-y-6">
            {/* Nivel de dificultad */}
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <LightningIcon className="w-5 h-5 mr-2 text-blue-600" weight="duotone" aria-hidden="true" />
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
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <WarningIcon className="w-5 h-5 mr-2 text-brand-600" weight="duotone" aria-hidden="true" />
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
            </div>

            {/* Resultado de la partida */}
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-brand-600" weight="duotone" aria-hidden="true" />
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
                      <CheckIcon className="w-5 h-5 text-green-600 mr-2" weight="bold" aria-hidden="true" />
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
                      <XIcon className="w-5 h-5 text-red-600 mr-2" weight="bold" aria-hidden="true" />
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
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !villainId || !gameResult}
                  className="btn btn-primary w-full justify-center"
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
                      <CheckIcon className="w-5 h-5 mr-2" weight="bold" aria-hidden="true" />
                      {existingDeckId ? 'Guardar Partida' : 'Guardar y Crear Mazo'}
                    </>
                  )}
                </button>
                
                {!existingDeckId && (
                  <button
                    onClick={handleSkip}
                    disabled={saving}
                    className="btn btn-secondary w-full justify-center"
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
                        <XIcon className="w-5 h-5 mr-2" weight="bold" aria-hidden="true" />
                        Crear sin partida
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {!existingDeckId && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start space-x-2">
                    <InfoIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" weight="duotone" aria-hidden="true" />
                    <p className="text-xs text-gray-500">
                      Puedes registrar la partida más tarde desde "Mis Mazos"
                    </p>
                  </div>
                </div>
              )}
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
