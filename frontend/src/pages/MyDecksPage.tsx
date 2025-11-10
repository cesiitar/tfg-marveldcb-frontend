import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { useToast } from '../components/Toast'
import { getClassColor } from '../utils/classColors'

const MyDecksPage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { user: auth0User } = useAuth0()
  const navigate = useNavigate()
  const { showToast, ToastContainer } = useToast()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

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



  const handleDeleteDeck = async (deckId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mazo?')) return
    
    try {
      // Verificar que tenemos el Auth0 SUB del usuario
      if (!user?.sub) {
        showToast('❌ No hay Auth0 ID. Inicia sesión nuevamente.', 'error')
      return
    }
      
      await apiService.deleteDeck(deckId, user.sub)
      showToast('🎉 ¡Mazo eliminado exitosamente!', 'success')
      // Recargar la lista después de eliminar
      loadUserDecks()
    } catch (err) {
      console.error('Error al eliminar mazo:', err)
      showToast('❌ Error al eliminar el mazo. Inténtalo de nuevo.', 'error')
    }
  }

  const handleEditDeck = (deckId: number) => {
    navigate(`/decks/${deckId}/edit`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">Necesitas iniciar sesión para ver tus mazos</p>
          <Link 
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus mazos...</p>
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
                Mis Mazos
              </h1>
              <p className="text-lg text-gray-300 mb-6">
              Gestiona tus mazos personales y obtén recomendaciones de IA
            </p>
            {isAuthenticated && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/favorites')}
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  Mis Favoritos
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Search and Actions */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                    <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre de mazo"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="flex gap-3">
                <Link
                  to="/create-deck"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Nuevo Mazo
                </Link>
                    <button
                  onClick={() => logout()}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center gap-2"
                    >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                    </button>
                  </div>
                </div>
                  </div>
                  
          {/* Decks Grid */}
          {filteredDecks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
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
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-lg"
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
                  className="group bg-white border border-gray-200 hover:border-blue-300 transition-all duration-200 overflow-hidden hover:shadow-lg"
                >
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 leading-tight">
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
                            <svg className="w-5 h-5" fill={favorites.has(deck.id!) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-sm font-semibold">
                              {deck.favorite_count !== undefined ? deck.favorite_count : 0}
                            </span>
                          </button>
                        ) : (
                          /* Contador de favoritos - solo si no está autenticado */
                          deck.favorite_count !== undefined && (
                            <div className="flex items-center gap-1 text-red-500">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
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
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                          <span className="text-lg font-bold text-gray-900">
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
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="font-semibold text-blue-600">
                          {deck.cards.length} cartas
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {deck.created_at ? new Date(deck.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
        </div>
      </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => window.location.href = `/decks/${deck.id || 0}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver
                      </button>
                      <button 
                        onClick={() => handleEditDeck(deck.id || 0)}
                        className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
            <button 
                        onClick={() => handleDeleteDeck(deck.id || 0)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center"
            >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
    </div>
  )
}

export default MyDecksPage
