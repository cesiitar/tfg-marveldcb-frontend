import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useToast } from '../components/Toast'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { getClassColor } from '../utils/classColors'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  pageHeaderButton,
} from '../components/ui/page-header'
import { AnimatedNumber } from '../components/ui/animated-number'
import { ArrowLeftIcon, CalendarBlankIcon, HeartIcon, LockIcon, StarIcon, UserIcon, WarningCircleIcon } from '@phosphor-icons/react'

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  
  const [favorites, setFavorites] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated || !user?.sub) {
        setError('Debes estar autenticado para ver tus favoritos')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const favoritesData = await apiService.getUserFavorites(user.sub)
        // Obtener el favorite_count real de cada mazo desde la API de decks
        const favoritesWithCount = await Promise.all(
          favoritesData.map(async (deck) => {
            try {
              // Obtener el mazo completo desde la API para tener el favorite_count y creator_name actualizados
              const fullDeck = await apiService.getDeckById(deck.id!)
              return {
                ...deck,
                favorite_count: fullDeck.favorite_count ?? 0,
                creator_name: fullDeck.creator_name || deck.creator_name
              }
            } catch (err) {
              console.error(`Error obteniendo detalles del mazo ${deck.id}:`, err)
              // Si falla, mantener el valor que viene del backend
              return deck
            }
          })
        )
        setFavorites(favoritesWithCount)
      } catch (err) {
        console.error('Error loading favorites:', err)
        setError('Error al cargar los favoritos')
        showToast('Error al cargar los favoritos', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [isAuthenticated, user?.sub]) // ← Quitar showToast de las dependencias

  const handleRemoveFavorite = async (deckId: number) => {
    if (!user?.sub) return

    try {
      const result = await apiService.toggleFavorite(deckId, user.sub)
      if (!result.is_favorite) {
        // Actualizar el contador de favoritos del mazo antes de eliminarlo
        setFavorites(prev => 
          prev.map(deck => {
            if (deck.id === deckId) {
              const currentCount = deck.favorite_count ?? 1
              return {
                ...deck,
                favorite_count: Math.max(0, currentCount - 1)
              }
            }
            return deck
          }).filter(deck => deck.id !== deckId)
        )
        showToast('Favorito eliminado', 'success')
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
      showToast('Error al eliminar favorito', 'error')
    }
  }

  const handleViewDeck = (deckId: number) => {
    navigate(`/decks/${deckId}`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8">
            <div className="mb-6">
              <LockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" weight="duotone" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
              <p className="text-gray-600 mb-6">Necesitas iniciar sesión para ver tus favoritos</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Cargando favoritos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8">
            <div className="mb-6">
              <WarningCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" weight="duotone" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <PageHeader className="mb-8">
          <PageHeaderContent>
            <PageHeaderEyebrow>Tu colección</PageHeaderEyebrow>
            <PageHeaderTitle>Mis Favoritos</PageHeaderTitle>
            <PageHeaderDescription>
              <AnimatedNumber value={favorites.length} className="font-semibold text-white" /> mazos guardados
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <button
              onClick={() => navigate('/mydecks')}
              className={pageHeaderButton.secondary}
            >
              <ArrowLeftIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
              Volver a Mis Mazos
            </button>
          </PageHeaderActions>
        </PageHeader>

        {/* Lista de favoritos */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-12 text-center">
            <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" weight="duotone" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes favoritos aún</h3>
            <p className="text-gray-600 mb-6">Explora los mazos y marca como favoritos los que más te gusten</p>
            <button
              onClick={() => navigate('/mydecks')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar Mazos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((deck) => (
              <div 
                key={deck.id}
                className="group deck-card cursor-pointer"
                onClick={() => handleViewDeck(deck.id!)}
              >
                {/* Header Section */}
                <div className="bg-ink-50 px-4 py-3 border-b border-ink-900/[0.06]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition-colors duration-200 leading-tight">
                      {deck.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* Botón de eliminar favorito con contador */}
                      {isAuthenticated && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemoveFavorite(deck.id!)
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar de favoritos"
                        >
                          <HeartIcon className="w-5 h-5" weight="fill" aria-hidden="true" />
                          <span className="text-sm font-semibold">
                            {deck.favorite_count !== undefined ? deck.favorite_count : 0}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4">
                  {/* Hero and Aspect Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
                          <StarIcon className="w-4 h-4 text-white" weight="duotone" aria-hidden="true" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {deck.hero_name || '—'}
                        </span>
                      </div>
                      {deck.aspect && (
                        <div className="flex items-center gap-1 ml-auto">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${getClassColor(deck.aspect)}`}></div>
                          <span className="text-sm font-semibold text-gray-700 capitalize px-2 py-1 rounded-full bg-gray-100">
                            {deck.aspect}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-md flex items-center justify-center">
                        <UserIcon className="w-3 h-3 text-white" weight="duotone" aria-hidden="true" />
                      </div>
                      <span className="font-medium text-gray-600">
                        by {deck.creator_name || 'Anónimo'}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="font-semibold text-blue-600">
                        {deck.cards?.length || 0} cartas
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <CalendarBlankIcon className="w-3 h-3 text-gray-400" weight="duotone" aria-hidden="true" />
                      <span>
                        {deck.created_at ? new Date(deck.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ToastContainer />
    </div>
  )
}

export default FavoritesPage
