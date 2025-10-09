import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../services/api'
import { Deck, Hero } from '../types/card'

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([])
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newDeck, setNewDeck] = useState({
    name: '',
    hero_name: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const decksData = await apiService.getDecks()
        setDecks(decksData)
        // Temporalmente deshabilitado hasta que el backend implemente /api/heroes
        setHeroes([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeck.name || !newDeck.hero_name) return

    try {
      // Crear mazo con las cartas del héroe automáticamente
      const heroCards = await apiService.getHeroCards(newDeck.hero_name)
      const deckCards = heroCards.map(card => ({
        card_name: card.name,
        quantity: 1
      }))

      const deck: Omit<Deck, 'id' | 'created_at' | 'updated_at'> = {
        name: newDeck.name,
        hero_name: newDeck.hero_name,
        cards: deckCards
      }

      const createdDeck = await apiService.createDeck(deck)
      setDecks([createdDeck, ...decks])
      setNewDeck({ name: '', hero_name: '' })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el mazo')
    }
  }

  const getHeroColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-slate-500 to-slate-600', 
      'from-indigo-500 to-indigo-600',
      'from-emerald-500 to-emerald-600',
      'from-purple-500 to-purple-600',
      'from-rose-500 to-rose-600',
      'from-teal-500 to-teal-600',
      'from-violet-500 to-violet-600',
      'from-cyan-500 to-cyan-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600',
      'from-pink-500 to-pink-600',
      'from-amber-500 to-amber-600',
      'from-red-500 to-red-600',
      'from-lime-500 to-lime-600',
      'from-sky-500 to-sky-600'
    ]
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mazos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Reintentar
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
        
        <div className="relative z-10 text-center py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">
              Decklists Públicos
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Explora y crea mazos públicos de Marvel Champions
            </p>
            
            <button 
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Crear Nuevo Mazo
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Create Deck Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Crear Nuevo Mazo</h2>
              <form onSubmit={handleCreateDeck} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Mazo
                  </label>
                  <input
                    type="text"
                    value={newDeck.name}
                    onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                    placeholder="Ej: Mazo de Hulk Agresivo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Héroe
                  </label>
                  <select
                    value={newDeck.hero_name}
                    onChange={(e) => setNewDeck({ ...newDeck, hero_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  >
                    <option value="">Selecciona un héroe</option>
                    {heroes.map((hero, index) => (
                      <option key={hero.name} value={hero.pack_name}>
                        {hero.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Crear Mazo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Decks Grid */}
          {decks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No hay mazos públicos
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                Sé el primero en crear un mazo público
              </p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Crear Primer Mazo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {decks.map((deck, index) => (
                <div 
                  key={deck.id}
                  className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden"
                >
                  {/* Header with subtle gradient */}
                  <div className={`h-2 bg-gradient-to-r ${getHeroColor(index)}`}></div>
                  
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                        {deck.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Héroe: {deck.hero_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {deck.cards.length} cartas
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Ver detalles
                      </span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DecksPage
