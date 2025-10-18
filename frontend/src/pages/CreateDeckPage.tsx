import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Hero, Card, Deck, DeckCard } from '../types/card'
import DeckCardSelectionPage from './DeckCardSelectionPage'
import { useToast } from '../components/Toast'

const CreateDeckPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const { showToast, ToastContainer } = useToast()
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [selectedHero, setSelectedHero] = useState<number | null>(null)
  const [selectedHeroName, setSelectedHeroName] = useState<string>('')
  const [selectedAspect, setSelectedAspect] = useState<string>('')
  const [heroCards, setHeroCards] = useState<Card[]>([])
  const [deckName, setDeckName] = useState<string>('')
  const [deckDescription, setDeckDescription] = useState<string>('')
  const [loading, setLoading] = useState(false)
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

  const handleContinueToCards = () => {
    if (!selectedHero || !selectedAspect || !deckName.trim()) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }
    setCurrentStep('cards')
  }

  const handleBackToSetup = () => {
    setCurrentStep('setup')
  }

  const handleCompleteDeck = async (selectedCards: DeckCard[]) => {
    if (!isAuthenticated || !user?.sub) {
      setError('Debes estar autenticado para crear un mazo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Crear el mazo con todas las cartas
      const selectedHeroObj = heroes.find(h => h.id === selectedHero)
      const newDeck: Omit<Deck, 'id' | 'created_at' | 'updated_at'> = {
        name: deckName,
        description: deckDescription,
        hero_name: selectedHeroName, // Usar el nombre completo del héroe
        aspect: selectedAspect as any,
        cards: selectedCards
      }

      await apiService.createDeck(newDeck, user.sub)
      
      // Mostrar mensaje de éxito
      showToast(`🎉 ¡Mazo "${deckName}" creado exitosamente!`, 'success')
      
      // Limpiar formulario
      setSelectedHero('')
      setSelectedAspect('')
      setDeckName('')
      setDeckDescription('')
      setHeroCards([])
      setCurrentStep('setup')
      
    } catch (err: any) {
      console.error('Error creating deck:', err)
      
      // Mostrar el mensaje exacto del backend si viene
      if (err && err.message) {
        showToast(`❌ ${err.message}`, 'error')
      } else if (err.message && err.message.includes('401')) {
        showToast('❌ No tienes permisos para crear mazos. Inicia sesión nuevamente.', 'error')
      } else if (err.message && err.message.includes('422')) {
        showToast('❌ Los datos del mazo no son válidos. Verifica que todas las cartas existan.', 'error')
      } else {
        showToast('❌ Error al crear el mazo. Inténtalo de nuevo.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
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

  // Paso de configuración inicial
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Crear Nuevo Mazo</h1>

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
              <option value="aggression">Agresión</option>
              <option value="justice">Justicia</option>
              <option value="leadership">Liderazgo</option>
              <option value="protection">Protección</option>
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
            disabled={loading || !selectedHero || !selectedAspect || !deckName.trim()}
            className="w-full px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {loading ? 'Cargando...' : 'Continuar a Selección de Cartas'}
          </button>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default CreateDeckPage
