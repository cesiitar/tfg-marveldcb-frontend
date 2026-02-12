import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { useToast } from '../components/Toast'
import { getClassColor } from '../utils/classColors'
import ImportDeckModal from '../components/ImportDeckModal'

const AddGamePage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth0()
  const { showToast, ToastContainer } = useToast()

  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDbDecks, setShowDbDecks] = useState(false)

  const loadDecks = async () => {
    setLoading(true)
    try {
      const allDecks = await apiService.getDecks()
      setDecks(allDecks || [])
    } catch (err) {
      console.error('Error cargando mazos:', err)
      setDecks([])
      showToast('Error al cargar los mazos de la base de datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleShowDbDecks = () => {
    setShowDbDecks(true)
    loadDecks()
    setTimeout(() => {
      const element = document.getElementById('db-decks-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const filteredDecks = decks.filter(deck =>
    !search || deck.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectDeck = (deck: Deck) => {
    if (!isAuthenticated) {
      showToast(
        'Debes iniciar sesión para registrar una partida con un mazo de la base de datos',
        'error'
      )
      return
    }

    navigate('/configure-game', {
      state: {
        existingDeckId: deck.id,
        deckData: deck
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-black opacity-30" />

        <div className="relative z-10 text-center py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Añadir Partida
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Registra una nueva partida eligiendo un mazo existente o importando uno
              desde MarvelCDB.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleShowDbDecks}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Elegir mazo de la base de datos
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors duration-200 font-semibold text-base border-2 border-white/30"
              >
                Importar mazo desde MarvelCDB
              </button>
            </div>
            {!isAuthenticated && (
              <p className="mt-4 text-sm text-gray-200 max-w-xl mx-auto">
                Puedes explorar e importar mazos sin registrarte, pero{' '}
                <span className="font-semibold">necesitarás iniciar sesión</span> para
                registrar partidas asociadas a un mazo de la base de datos.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative -mt-8 z-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Sección: Mazos de la base de datos (solo visible al pulsar "Elegir mazo de la base de datos") */}
          {showDbDecks && (
          <section
            id="db-decks-section"
            className="bg-white rounded-lg shadow-lg p-6 md:p-8 border border-gray-200"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Selecciona un mazo de la base de datos
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Elige uno de los mazos disponibles para registrar una nueva partida.
                </p>
              </div>
              <div className="w-full md:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre de mazo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando mazos...</p>
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No se han encontrado mazos
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Prueba a importar un mazo desde MarvelCDB o vuelve más tarde cuando haya
                  más mazos disponibles en la base de datos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDecks.map(deck => (
                  <div
                    key={deck.id}
                    className="group bg-white border border-gray-200 hover:border-blue-400 transition-all duration-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg cursor-pointer flex flex-col"
                    onClick={() => handleSelectDeck(deck)}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-100">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 line-clamp-2">
                        {deck.name}
                      </h3>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {deck.hero_name}
                          </p>
                          {deck.creator_name && (
                            <p className="text-xs text-gray-500">
                              por <span className="font-medium">{deck.creator_name}</span>
                            </p>
                          )}
                        </div>
                        {deck.aspect && (
                          <div className="ml-auto flex items-center gap-1">
                            <span
                              className={`w-3 h-3 rounded-full shadow-sm ${getClassColor(
                                deck.aspect
                              )}`}
                            />
                            <span className="text-xs font-semibold text-gray-700 capitalize px-2 py-0.5 rounded-full bg-gray-100">
                              {deck.aspect}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <span className="font-semibold text-blue-600">
                            {deck.cards.length} cartas
                          </span>
                        </span>
                        {deck.favorite_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{deck.favorite_count}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer button */}
                    <button
                      type="button"
                      className="w-full px-3 py-2 bg-purple-600 text-white text-sm font-medium flex items-center justify-center gap-1 hover:bg-purple-700 transition-colors duration-200 border-t border-purple-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Registrar partida con este mazo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}
        </div>
      </div>

      {/* Import Deck Modal */}
      <ImportDeckModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          loadDecks()
          setShowImportModal(false)
        }}
      />

      <ToastContainer />
    </div>
  )
}

export default AddGamePage

