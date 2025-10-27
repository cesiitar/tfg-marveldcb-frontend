import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useToast } from '../components/Toast'
import { apiService } from '../services/api'
import { Deck } from '../types/card'

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
        setFavorites(favoritesData)
        console.log('❤️ Favoritos cargados:', favoritesData)
      } catch (err) {
        console.error('Error loading favorites:', err)
        setError('Error al cargar los favoritos')
        showToast('❌ Error al cargar los favoritos', 'error')
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
        // Actualizar la lista local removiendo el mazo
        setFavorites(prev => prev.filter(deck => deck.id !== deckId))
        showToast('❤️ Favorito eliminado', 'success')
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
      showToast('❌ Error al eliminar favorito', 'error')
    }
  }

  const handleViewDeck = (deckId: number) => {
    navigate(`/decks/${deckId}`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
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
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-white mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <div>
                  <h1 className="text-3xl font-bold text-white">Mis Favoritos</h1>
                  <p className="text-red-100">{favorites.length} mazos guardados</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/mydecks')}
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Mis Mazos
              </button>
            </div>
          </div>
        </div>

        {/* Lista de favoritos */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
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
                className="group bg-white border border-gray-200 hover:border-blue-300 transition-all duration-200 overflow-hidden hover:shadow-lg cursor-pointer"
                onClick={() => handleViewDeck(deck.id!)}
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 leading-tight">
                      {deck.name}
                    </h3>
                    {isAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveFavorite(deck.id!)
                        }}
                        className="p-1 rounded-full transition-colors text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar de favoritos"
                      >
                        <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    )}
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
                          {deck.hero_name || '—'}
                        </span>
                      </div>
                      {deck.aspect && (
                        <div className="flex items-center gap-1 ml-auto">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${deck.aspect === 'aggression' ? 'bg-red-500' : deck.aspect === 'justice' ? 'bg-amber-500' : deck.aspect === 'leadership' ? 'bg-blue-500' : deck.aspect === 'protection' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
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
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
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
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
                      </svg>
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
