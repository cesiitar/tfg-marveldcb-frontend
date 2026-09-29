import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { useToast } from '../components/Toast'
import { getClassColor } from '../utils/classColors'
import ConfirmDialog from '../components/ConfirmDialog'
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
import { CalendarBlankIcon, CardsIcon, ClipboardTextIcon, EyeIcon, HeartIcon, MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, SignOutIcon, StarIcon, TrashIcon, UploadSimpleIcon, WarningIcon } from '@phosphor-icons/react'
import { usePageMeta } from '../lib/seo'

const MyDecksPage: React.FC = () => {
  usePageMeta({ title: 'Mis mazos', noindex: true })
  const { isAuthenticated, user, logout } = useAuth()
  const { user: auth0User } = useAuth0()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<number | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Cargar mazos del usuario cuando se autentica
  const loadUserDecks = async () => {
    if (!isAuthenticated) return

    setLoading(true)

    try {
      const auth0Id = user?.sub
      if (!auth0Id) {
        throw new Error('No se pudo obtener el Auth0 ID del usuario')
      }
      const userDecks = await apiService.getUserDecks(auth0Id)
      setDecks(userDecks || [])
    } catch (err) {
      console.error('Error:', err)
      setDecks([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar favoritos del usuario
  const loadFavorites = async () => {
    if (!isAuthenticated || !auth0User?.sub) return

    try {
      const favoritesData = await apiService.getUserFavorites(auth0User.sub)
      const favoriteIds = new Set(favoritesData.map(deck => deck.id!))
      setFavorites(favoriteIds)
    } catch (err) {
      console.error('Error loading favorites:', err)
      // No mostrar error al usuario, solo log
    }
  }

  // Manejar toggle de favorito
  const handleToggleFavorite = async (deckId: number) => {
    if (!auth0User?.sub) {
      showToast('Debes iniciar sesión para usar favoritos', 'error')
      return
    }

    try {
      const result = await apiService.toggleFavorite(deckId, auth0User.sub)
      
      // Actualizar el estado local de favoritos
      setFavorites(prev => {
        const newFavorites = new Set(prev)
        if (result.is_favorite) {
          newFavorites.add(deckId)
        } else {
          newFavorites.delete(deckId)
        }
        return newFavorites
      })

      // Actualizar el contador de favoritos del mazo
      setDecks(prevDecks => 
        prevDecks.map(deck => {
          if (deck.id === deckId) {
            const currentCount = deck.favorite_count ?? 0
            return {
              ...deck,
              favorite_count: result.is_favorite 
                ? currentCount + 1 
                : Math.max(0, currentCount - 1)
            }
          }
          return deck
        })
      )

      showToast(result.message, 'success')
    } catch (err) {
      console.error('Error toggling favorite:', err)
      showToast('Error al actualizar favorito', 'error')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadUserDecks()
      loadFavorites()
    }
  }, [isAuthenticated])

  const getDeckHeroName = (d: Deck): string | undefined => d.hero_name
  const getDeckAspect = (d: Deck): string | undefined => (d as any).aspect

  const filteredDecks = decks.filter(d => {
    const matchesText = !search || d.name.toLowerCase().startsWith(search.toLowerCase())
    return matchesText
  })



  const handleDeleteDeck = (deckId: number) => {
    setDeckToDelete(deckId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteDeck = async () => {
    if (!deckToDelete) return
    
    try {
      // Verificar que tenemos el Auth0 SUB del usuario
      if (!user?.sub) {
        showToast('No hay Auth0 ID. Inicia sesión nuevamente.', 'error')
      return
    }
      
      await apiService.deleteDeck(deckToDelete, user.sub)
      showToast('Mazo eliminado exitosamente', 'success')
      // Recargar la lista después de eliminar
      loadUserDecks()
    } catch (err: any) {
      console.error('Error al eliminar mazo:', err)
      // Mejorar el mensaje de error, quitando referencias a localhost
      let errorMessage = 'Error al eliminar el mazo. Inténtalo de nuevo.'
      if (err?.message) {
        // Filtrar mensajes que contengan localhost o URLs
        const message = err.message
        if (message.includes('localhost') || message.includes('http://') || message.includes('https://')) {
          errorMessage = 'Error al eliminar el mazo. Por favor, verifica tu conexión e inténtalo de nuevo.'
        } else {
          errorMessage = message
        }
      }
      showToast(errorMessage, 'error')
    } finally {
      setShowDeleteConfirm(false)
      setDeckToDelete(null)
    }
  }

  const handleEditDeck = (deckId: number) => {
    navigate(`/decks/${deckId}/edit`)
  }

  const handleConfigureGame = (deck: Deck) => {
    // Navegar a la página de configuración de partida con el mazo existente
    navigate('/configure-game', {
      state: {
        existingDeckId: deck.id,
        deckData: deck // Pasar el deck completo para referencia
      }
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WarningIcon className="w-8 h-8 text-red-600" weight="duotone" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">Necesitas iniciar sesión para ver tus mazos. Por favor, usa el botón de Login en el header para acceder.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus mazos...</p>
        </div>
      </div>
    )
  }

    return (
      <div className="min-h-[60vh]">
        {/* Header */}
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderEyebrow>Tu colección</PageHeaderEyebrow>
            <PageHeaderTitle>Mis Mazos</PageHeaderTitle>
            <PageHeaderDescription>
              Gestiona tus mazos personales y obtén recomendaciones de IA
            </PageHeaderDescription>
          </PageHeaderContent>
          {isAuthenticated && (
            <PageHeaderActions>
              <button
                onClick={() => navigate('/favorites')}
                className={pageHeaderButton.secondary}
              >
                <HeartIcon className="w-5 h-5 text-brand-400" weight="fill" aria-hidden="true" />
                Mis Favoritos
              </button>
            </PageHeaderActions>
          )}
        </PageHeader>

        {/* Main Content */}
        <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Search and Actions */}
          <div className="bg-white rounded-2xl p-2.5 shadow-lg ring-1 ring-ink-900/[0.06] mb-8 flex flex-col lg:flex-row lg:items-center gap-2.5">
            <label className="relative flex-1 min-w-0">
              <span className="sr-only">Buscar por nombre de mazo</span>
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" weight="bold" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre de mazo"
                className="w-full pl-12 pr-4 py-3 rounded-xl !bg-ink-50 border border-transparent text-ink-900 placeholder:text-ink-400"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
                <UploadSimpleIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                Importar desde MarvelCDB
              </button>
              <Link to="/create-deck" className="btn btn-primary">
                <PlusIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                Crear nuevo mazo
              </Link>
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="btn btn-ghost"
              >
                <SignOutIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </div>
                  
          {/* Decks Grid */}
          {filteredDecks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-ink-100 ring-1 ring-ink-900/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CardsIcon className="w-12 h-12 text-gray-400" weight="duotone" aria-hidden="true" />
                  </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                {search ? 'No hay mazos que coincidan' : 'Aún no tienes mazos'}
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                {search ? 'Ajusta la búsqueda o crea tu primer mazo' : 'Crea tu primer mazo para comenzar'}
              </p>
              {!search && (
                <Link
                  to="/create-deck"
                  className="btn btn-primary btn-lg"
                >
                  Crear Mi Primer Mazo
                </Link>
              )}
                  </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDecks.map((deck) => (
                <div 
                  key={deck.id}
                  className="group deck-card"
                >
                  {/* Header Section */}
                  <div className="bg-ink-50 px-4 py-3 border-b border-ink-900/[0.06]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition-colors duration-200 leading-tight">
                        {deck.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Botón de favorito con contador */}
                        {isAuthenticated ? (
                    <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleToggleFavorite(deck.id!)
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
                              favorites.has(deck.id!) 
                                ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={favorites.has(deck.id!) ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
                          >
                            <HeartIcon className="w-5 h-5" weight={favorites.has(deck.id!) ? 'fill' : 'regular'} aria-hidden="true" />
                            <span className="text-sm font-semibold">
                              {deck.favorite_count !== undefined ? deck.favorite_count : 0}
                            </span>
                    </button>
                        ) : (
                          /* Contador de favoritos - solo si no está autenticado */
                          deck.favorite_count !== undefined && (
                            <div className="flex items-center gap-1 text-red-500">
                              <HeartIcon className="w-4 h-4" weight="fill" aria-hidden="true" />
                              <span className="text-sm font-semibold">{deck.favorite_count}</span>
                            </div>
                          )
                        )}
                </div>
              </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-4">
                    {/* Hero and Aspect Info */}
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
                            <StarIcon className="w-4 h-4 text-white" weight="duotone" aria-hidden="true" />
                </div>
                          <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                            {getDeckHeroName(deck) || '—'}
                          </span>
                </div>
                        {getDeckAspect(deck) && (
                          <div className="flex items-center gap-1 ml-auto">
                            <div className={`w-3 h-3 rounded-full shadow-sm ${getClassColor(getDeckAspect(deck))}`}></div>
                            <span className="text-sm font-semibold text-gray-700 capitalize px-2 py-1 rounded-full bg-gray-100">
                              {getDeckAspect(deck)}
                            </span>
              </div>
            )}
          </div>
                  </div>
                  
                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-md flex items-center justify-center">
                          <CardsIcon className="w-3 h-3 text-white" weight="duotone" aria-hidden="true" />
                        </div>
                        <span className="font-semibold text-blue-600">
                          {deck.cards.length} cartas
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <CalendarBlankIcon className="w-3 h-3 text-gray-400" weight="duotone" aria-hidden="true" />
                        <span>
                          {deck.created_at ? new Date(deck.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                  </div>
                  </div>
                  
                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex gap-2">
                    <button
                      onClick={() => {
                            // Guardar el ID antes de navegar
                            if (deck.id) {
                              try {
                                localStorage.setItem('lastViewedDeckId', deck.id.toString())
                              } catch (err) {
                                console.error('Error guardando último mazo visto:', err)
                              }
                            }
                            navigate(`/decks/${deck.id || 0}`)
                          }}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          <EyeIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                          Ver
                    </button>
                  <button
                          onClick={() => handleEditDeck(deck.id || 0)}
                          className="btn btn-secondary btn-sm flex-1"
                  >
                          <PencilSimpleIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                          Editar
                  </button>
                  <button
                          onClick={() => handleDeleteDeck(deck.id || 0)}
                          className="btn btn-danger btn-sm" aria-label="Eliminar mazo" title="Eliminar mazo"
                  >
                          <TrashIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                  </button>
                </div>
            <button 
                        onClick={() => handleConfigureGame(deck)}
                        className="btn btn-dark btn-sm w-full"
            >
                        <ClipboardTextIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                        Registrar Partida
            </button>
          </div>
        </div>
      </div>
              ))}
            </div>
          )}
            </div>
          </div>
      
      {/* Toast Container */}
      <ToastContainer />
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Mazo"
        message="¿Estás seguro de que quieres eliminar este mazo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDeleteDeck}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeckToDelete(null)
        }}
      />

      {/* Import Deck Modal */}
      <ImportDeckModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          loadUserDecks()
          setShowImportModal(false)
        }}
      />
    </div>
  )
}

export default MyDecksPage
