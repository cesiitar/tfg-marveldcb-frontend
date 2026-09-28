import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Hero, Card, Deck, DeckCard } from '../types/card'
import DeckCardSelectionPage from './DeckCardSelectionPage'
import { useToast } from '../components/Toast'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  pageHeaderButton,
} from '../components/ui/page-header'
import { LightbulbIcon, PencilSimpleIcon } from '@phosphor-icons/react'

const CreateDeckPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { ToastContainer } = useToast()
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [selectedHero, setSelectedHero] = useState<number | null>(null)
  const [selectedHeroName, setSelectedHeroName] = useState<string>('')
  const [selectedAspect, setSelectedAspect] = useState<string>('')
  const [heroCards, setHeroCards] = useState<Card[]>([])
  const [deckName, setDeckName] = useState<string>('')
  const [deckDescription, setDeckDescription] = useState<string>('')
  const [creationMode, setCreationMode] = useState<'manual' | 'ai' | null>(null) // null = no elegido, 'manual' = crear manualmente, 'ai' = usar IA
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'setup' | 'cards'>('setup')

  // Cargar héroes al montar el componente
  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const heroesData = await apiService.getHeroes()
        setHeroes(heroesData)
      } catch (err) {
        console.error('Error loading heroes:', err)
        setError('Error al cargar los héroes')
      }
    }
    loadHeroes()
  }, [])

  // Cargar cartas del héroe cuando se selecciona
  useEffect(() => {
    if (selectedHero) {
      const loadHeroCards = async () => {
        try {
          const cards = await apiService.getHeroCards(selectedHero)
          setHeroCards(cards)
        } catch (err) {
          console.error('Error loading hero cards:', err)
          setError('Error al cargar las cartas del héroe')
        }
      }
      loadHeroCards()
    }
  }, [selectedHero])

  const handleHeroChange = (heroId: string) => {
    const heroIdNum = parseInt(heroId)
    const selectedHeroObj = heroes.find(h => h.id === heroIdNum)
    if (selectedHeroObj) {
      setSelectedHero(heroIdNum) // Para las consultas API
      setSelectedHeroName(selectedHeroObj.name) // Para mostrar en el select
      setSelectedAspect('')
      setHeroCards([])
    }
  }


  const handleAspectChange = (aspect: string) => {
    setSelectedAspect(aspect)
  }

  const handleContinueToCards = async () => {
    if (!selectedHero || !selectedAspect || !deckName.trim()) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }
    
    // Validar nombre duplicado antes de continuar (globalmente, case-insensitive)
    try {
      const allDecks = await apiService.getDecks()
      const normalizedNewName = deckName.trim().toLowerCase()
      const duplicateDeck = allDecks.find(deck => 
        deck.name.trim().toLowerCase() === normalizedNewName
      )
      
      if (duplicateDeck) {
        setError(`Ya existe un mazo con el nombre "${deckName}". Por favor, elige otro nombre.`)
        return
      }
    } catch (err) {
      console.error('Error verificando nombres duplicados:', err)
      // Continuar si falla la verificación (no bloquear)
    }
    
    setError(null)
    setCurrentStep('cards')
  }

  const handleBackToSetup = () => {
    setCurrentStep('setup')
  }

  const handleCompleteDeck = (selectedCards: DeckCard[]) => {
    if (!isAuthenticated || !user?.sub) {
      setError('Debes estar autenticado para crear un mazo')
      return
    }

    // Preparar los datos del mazo (sin crearlo todavía)
    const deckData: Omit<Deck, 'id' | 'created_at' | 'updated_at'> = {
      name: deckName,
      description: deckDescription,
      hero_name: selectedHeroName,
      hero_id: selectedHero!,
      aspect: selectedAspect as any,
      cards: selectedCards
    }

    // Navegar a la página de configuración de partida con los datos del mazo
    // El mazo se creará cuando se guarde la configuración de la partida
    navigate('/configure-game', { 
      state: { 
        deckData: deckData // Pasar los datos del mazo en lugar del deckId
      } 
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Crear Mazo</h1>
          <p className="text-gray-600">Debes iniciar sesión para crear un mazo.</p>
        </div>
      </div>
    )
  }

  // Si estamos en el paso de selección de cartas
  if (currentStep === 'cards') {
    return (
      <DeckCardSelectionPage
        heroName={selectedHeroName}
        aspectName={selectedAspect}
        heroCards={heroCards}
        onComplete={handleCompleteDeck}
        onBack={handleBackToSetup}
      />
    )
  }

  // Si no se ha elegido el modo de creación, mostrar opciones
  if (creationMode === null) {
    return (
      <div className="space-y-8">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderEyebrow>Constructor</PageHeaderEyebrow>
            <PageHeaderTitle>Crear Nuevo Mazo</PageHeaderTitle>
            <PageHeaderDescription>Elige cómo quieres crear tu mazo</PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción: Crear manualmente */}
            <button
              onClick={() => setCreationMode('manual')}
              className="group p-7 bg-white rounded-2xl ring-1 ring-ink-900/[0.08] shadow-sm hover:shadow-lg hover:ring-ink-300 hover:-translate-y-0.5 text-left"
            >
              <div className="flex items-center mb-4">
                <PencilSimpleIcon className="w-8 h-8 text-ink-800 mr-3" weight="duotone" aria-hidden="true" />
                <h2 className="text-xl font-bold text-gray-900">Crear Manualmente</h2>
              </div>
              <p className="text-gray-600">
                Elige tu héroe, aspecto y selecciona las cartas una por una. Tú tienes el control total de tu mazo.
              </p>
            </button>

            {/* Opción: Usar IA */}
            <button
              onClick={() => setCreationMode('ai')}
              className="group relative overflow-hidden p-7 bg-brand-700 halftone rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-left"
            >
              <div className="flex items-center mb-4">
                <LightbulbIcon className="w-8 h-8 text-white mr-3" weight="duotone" aria-hidden="true" />
                <h2 className="text-xl font-bold text-white">Recomendación IA</h2>
              </div>
              <p className="text-brand-100">
                Selecciona un villano y la IA generará automáticamente un mazo optimizado para enfrentarlo.
              </p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Si eligió IA, redirigir a la página de recomendación IA
  if (creationMode === 'ai') {
    navigate('/ai-recommendation')
    return null
  }

  // Paso de configuración inicial (modo manual)
  return (
    <div className="space-y-8">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Constructor · Paso 1</PageHeaderEyebrow>
          <PageHeaderTitle>Crear Nuevo Mazo</PageHeaderTitle>
          <PageHeaderDescription>Elige tu héroe, su aspecto y dale nombre al mazo</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <button onClick={() => setCreationMode(null)} className={pageHeaderButton.secondary}>
            ← Cambiar método
          </button>
        </PageHeaderActions>
      </PageHeader>

      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Selección de héroe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona un Héroe *
            </label>
            <select
              value={selectedHero || ''}
              onChange={(e) => handleHeroChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="">Selecciona un héroe...</option>
              {heroes.map((hero) => (
                <option key={hero.id} value={hero.id}>
                  {hero.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selección de aspecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona un Aspecto *
            </label>
            <select
              value={selectedAspect}
              onChange={(e) => handleAspectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              disabled={!selectedHero}
            >
              <option value="">Selecciona un aspecto...</option>
              <option value="aggression">Aggression</option>
              <option value="justice">Justice</option>
              <option value="leadership">Leadership</option>
              <option value="protection">Protection</option>
              <option value="pool">Pool</option>
            </select>
          </div>

          {/* Nombre del mazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Mazo *
            </label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Ej: Mazo de Spider-Man Agresión"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>

          {/* Descripción del mazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              placeholder="Describe la estrategia de tu mazo..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>

          {/* Vista previa de cartas del héroe */}
          {selectedHero && heroCards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Cartas del Héroe ({heroCards.length})
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-3">
                  <p><strong>Héroe:</strong> {selectedHeroName}</p>
                  <p><strong>Aspecto:</strong> {selectedAspect || 'No seleccionado'}</p>
                  <p><strong>Cartas del héroe:</strong> {heroCards.reduce((sum, card) => sum + (card.quantity || 1), 0)}</p>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {heroCards.map((card) => (
                    <div key={card.name} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{card.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({card.set})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Cost: {card.cost}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          x{card.quantity || 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botón continuar */}
          <button
            onClick={handleContinueToCards}
            disabled={!selectedHero || !selectedAspect || !deckName.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            Continuar a Selección de Cartas
          </button>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default CreateDeckPage
