import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { useToast } from '../components/Toast'
import { getClassColor } from '../utils/classColors'
import ImportDeckModal from '../components/ImportDeckModal'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  pageHeaderButton,
} from '../components/ui/page-header'
import { CardsIcon, ClipboardTextIcon, HeartIcon, StarIcon } from '@phosphor-icons/react'
import { usePageMeta } from '../lib/seo'

const AddGamePage: React.FC = () => {
  usePageMeta({ title: 'Añadir partida', noindex: true })
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
    <div className="min-h-[60vh]">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Partidas</PageHeaderEyebrow>
          <PageHeaderTitle>Añadir Partida</PageHeaderTitle>
          <PageHeaderDescription>
            Registra una nueva partida eligiendo un mazo existente o importando uno
            desde MarvelCDB.
          </PageHeaderDescription>
          <PageHeaderActions className="mt-7">
            <button onClick={handleShowDbDecks} className={pageHeaderButton.primary}>
              Elegir mazo de la base de datos
            </button>
            <button onClick={() => setShowImportModal(true)} className={pageHeaderButton.secondary}>
              Importar mazo desde MarvelCDB
            </button>
          </PageHeaderActions>
          {!isAuthenticated && (
            <p className="mt-4 text-sm text-ink-400 max-w-xl">
              Puedes explorar e importar mazos sin registrarte, pero{' '}
              <span className="font-semibold text-ink-200">necesitarás iniciar sesión</span> para
              registrar partidas asociadas a un mazo de la base de datos.
            </p>
          )}
        </PageHeaderContent>
      </PageHeader>

      {/* Main content */}
      <div className="relative -mt-8 z-20 px-4 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Sección: Mazos de la base de datos (solo visible al pulsar "Elegir mazo de la base de datos") */}
          {showDbDecks && (
          <section
            id="db-decks-section"
            className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6 md:p-8 border border-gray-200"
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
                <div className="w-20 h-20 bg-ink-100 ring-1 ring-ink-900/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <CardsIcon className="w-10 h-10 text-gray-400" weight="duotone" aria-hidden="true" />
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
                    className="group deck-card cursor-pointer flex flex-col"
                    onClick={() => handleSelectDeck(deck)}
                  >
                    {/* Header */}
                    <div className="bg-ink-50 px-4 py-3 border-b border-ink-900/[0.06]">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition-colors duration-200 line-clamp-2">
                        {deck.name}
                      </h3>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                        <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
                          <StarIcon className="w-4 h-4 text-white" weight="duotone" aria-hidden="true" />
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
                          <CardsIcon className="w-3 h-3 text-gray-400" weight="duotone" aria-hidden="true" />
                          <span className="font-semibold text-blue-600">
                            {deck.cards.length} cartas
                          </span>
                        </span>
                        {deck.favorite_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <HeartIcon className="w-3 h-3 text-red-500" weight="fill" aria-hidden="true" />
                            <span>{deck.favorite_count}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer button */}
                    <button
                      type="button"
                      className="btn btn-dark btn-sm w-full justify-center"
                    >
                      <ClipboardTextIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
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
          setShowImportModal(false)
          navigate(isAuthenticated ? '/mydecks' : '/decks')
        }}
      />

      <ToastContainer />
    </div>
  )
}

export default AddGamePage

