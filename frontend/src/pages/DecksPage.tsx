import React, { useMemo, useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { useToast } from '../components/Toast'
import { getClassColor } from '../utils/classColors'

const DecksPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cargar filtros desde localStorage al inicializar
  const loadFiltersFromStorage = () => {
    try {
      const savedSearch = localStorage.getItem('decksPage_search') || ''
      const savedHeroFilter = localStorage.getItem('decksPage_heroFilter') || ''
      const savedAspectFilter = localStorage.getItem('decksPage_aspectFilter') || ''
      const savedSortBy = (localStorage.getItem('decksPage_sortBy') || 'newest') as 'newest' | 'oldest' | 'most_favorites' | 'alphabetical'
      const savedCurrentPage = parseInt(localStorage.getItem('decksPage_currentPage') || '1', 10)
      
      return {
        search: savedSearch,
        heroFilter: savedHeroFilter,
        aspectFilter: savedAspectFilter,
        sortBy: savedSortBy,
        currentPage: savedCurrentPage
      }
    } catch (err) {
      console.error('Error cargando filtros desde localStorage:', err)
      return {
        search: '',
        heroFilter: '',
        aspectFilter: '',
        sortBy: 'newest' as const,
        currentPage: 1
      }
    }
  }
  
  const initialFilters = loadFiltersFromStorage()
  const [search, setSearch] = useState(initialFilters.search)
  const [heroFilter, setHeroFilter] = useState(initialFilters.heroFilter)
  const [aspectFilter, setAspectFilter] = useState(initialFilters.aspectFilter)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_favorites' | 'alphabetical'>(initialFilters.sortBy)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage)
  const [decksPerPage] = useState(16)
  
  // Guardar filtros en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('decksPage_search', search)
      localStorage.setItem('decksPage_heroFilter', heroFilter)
      localStorage.setItem('decksPage_aspectFilter', aspectFilter)
      localStorage.setItem('decksPage_sortBy', sortBy)
      localStorage.setItem('decksPage_currentPage', currentPage.toString())
    } catch (err) {
      console.error('Error guardando filtros en localStorage:', err)
    }
  }, [search, heroFilter, aspectFilter, sortBy, currentPage])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const decksData = await apiService.getDecks()
        setDecks(decksData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Cargar favoritos del usuario
  const loadFavorites = async () => {
    if (!isAuthenticated || !user?.sub) return

    try {
      const favoritesData = await apiService.getUserFavorites(user.sub)
      const favoriteIds = new Set(favoritesData.map(deck => deck.id!))
      setFavorites(favoriteIds)
    } catch (err) {
      console.error('Error loading favorites:', err)
      // No mostrar error al usuario, solo log
    }
  }

  // Manejar toggle de favorito
  const handleToggleFavorite = async (deckId: number) => {
    if (!user?.sub) {
      showToast('Debes iniciar sesión para usar favoritos', 'error')
      return
    }

    try {
      const result = await apiService.toggleFavorite(deckId, user.sub)
      
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
      loadFavorites()
    }
  }, [isAuthenticated])

  const getDeckHeroName = (d: Deck): string | undefined => d.hero_name
  const getDeckAspect = (d: Deck): string | undefined => (d as any).aspect

  const availableHeroes = useMemo(() => {
    const set = new Set<string>()
    decks.forEach(d => { const h = getDeckHeroName(d); if (h) set.add(h) })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [decks])

  const availableAspects = useMemo(() => {
    const set = new Set<string>()
    decks.forEach(d => { const a = getDeckAspect(d); if (a) set.add(a) })
    // Si el backend aún no manda aspect, ofrecemos las 4 por defecto
    const base = ['aggression', 'justice', 'leadership', 'protection', 'pool']
    const derived = Array.from(set)
    const merged = new Set([...base, ...derived])
    return Array.from(merged).sort((a, b) => a.localeCompare(b))
  }, [decks])

  const filteredDecks = useMemo(() => {
    let filtered = decks.filter(d => {
      const matchesText = !search || d.name.toLowerCase().startsWith(search.toLowerCase())
      const matchesHero = !heroFilter || getDeckHeroName(d) === heroFilter
      const matchesAspect = !aspectFilter || getDeckAspect(d) === aspectFilter
      return matchesText && matchesHero && matchesAspect
    })

    // Aplicar ordenamiento
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Más nuevos primero (created_at descendente)
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateB - dateA
        
        case 'oldest':
          // Más antiguos primero (created_at ascendente)
          const dateAOld = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateBOld = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateAOld - dateBOld
        
        case 'most_favorites':
          // Más favoritos primero
          const favA = a.favorite_count ?? 0
          const favB = b.favorite_count ?? 0
          if (favB !== favA) return favB - favA
          // Si tienen los mismos favoritos, ordenar por fecha (más nuevos primero)
          const dateAFav = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateBFav = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateBFav - dateAFav
        
        case 'alphabetical':
          // Orden alfabético por nombre (ignorando comillas y caracteres especiales al inicio)
          const normalizeName = (name: string) => {
            // Eliminar comillas y espacios al inicio/final, y convertir a minúsculas para comparación
            return name.replace(/^["'\s]+|["'\s]+$/g, '').toLowerCase()
          }
          return normalizeName(a.name).localeCompare(normalizeName(b.name))
        
        default:
          return 0
      }
    })

    return filtered
  }, [decks, search, heroFilter, aspectFilter, sortBy])

  // Restaurar la vista del último mazo visto
  useEffect(() => {
    if (decks.length === 0 || filteredDecks.length === 0) return
    
    try {
      const lastViewedDeckId = localStorage.getItem('lastViewedDeckId')
      if (!lastViewedDeckId) return
      
      const deckId = parseInt(lastViewedDeckId, 10)
      const deckIndex = filteredDecks.findIndex(d => d.id === deckId)
      
      if (deckIndex !== -1) {
        // Calcular en qué página está ese mazo
        const pageForDeck = Math.ceil((deckIndex + 1) / decksPerPage)
        
        // Solo ajustar la página si no está ya en la página correcta
        // y si no hay filtros activos que puedan haber cambiado la posición
        const hasActiveFilters = search || heroFilter || aspectFilter
        if (!hasActiveFilters && pageForDeck !== currentPage) {
          setCurrentPage(pageForDeck)
        }
        
        // Hacer scroll al mazo destacado después de que se renderice
        setTimeout(() => {
          const deckElement = document.getElementById(`deck-${deckId}`)
          if (deckElement) {
            deckElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Limpiar el último mazo visto después de restaurarlo
            setTimeout(() => {
              localStorage.removeItem('lastViewedDeckId')
            }, 2000)
          }
        }, 300)
      }
    } catch (err) {
      console.error('Error restaurando último mazo visto:', err)
    }
  }, [decks, filteredDecks, decksPerPage, currentPage, search, heroFilter, aspectFilter])

  // Funciones de paginación
  const getCurrentPageDecks = () => {
    const startIndex = (currentPage - 1) * decksPerPage
    const endIndex = startIndex + decksPerPage
    return filteredDecks.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(filteredDecks.length / decksPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [search, heroFilter, aspectFilter, sortBy])

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
              Explora los mazos públicos creados por la comunidad
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre de mazo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
                  <select
                value={heroFilter}
                onChange={(e) => setHeroFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todos los héroes</option>
                {availableHeroes.map(h => (
                  <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
              <select
                value={aspectFilter}
                onChange={(e) => setAspectFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todas las clases</option>
                {availableAspects.map(a => (
                  <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'most_favorites' | 'alphabetical')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="newest">Más nuevos</option>
                <option value="oldest">Más antiguos</option>
                <option value="most_favorites">Más gustados</option>
                <option value="alphabetical">Alfabético</option>
              </select>
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
                No hay mazos que coincidan
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                Ajusta los filtros o limpia la búsqueda
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                {getCurrentPageDecks().map((deck) => {
                  // Verificar si este es el último mazo visto
                  const isLastViewed = (() => {
                    try {
                      const lastViewedId = localStorage.getItem('lastViewedDeckId')
                      return lastViewedId && parseInt(lastViewedId, 10) === deck.id
                    } catch {
                      return false
                    }
                  })()
                  
                  return (
                <div 
                  key={deck.id}
                  id={isLastViewed ? `deck-${deck.id}` : undefined}
                  className={`group bg-white border transition-all duration-200 overflow-hidden hover:shadow-lg cursor-pointer ${
                    isLastViewed 
                      ? 'border-blue-500 border-2 shadow-lg ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    // Guardar el ID antes de navegar
                    if (deck.id) {
                      try {
                        localStorage.setItem('lastViewedDeckId', deck.id.toString())
                      } catch (err) {
                        console.error('Error guardando último mazo visto:', err)
                      }
                    }
                    window.location.href = `/decks/${deck.id}`
                  }}
                >
                  {/* Header Section - Clean and Professional */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 leading-tight">
                        {deck.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Botón de favorito con contador - solo si está autenticado */}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-600">
                          by {deck.creator_name || 'Anónimo'}
                        </span>
                        <span className="text-gray-400">·</span>
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
                  </div>
                </div>
                )
                })}
              </div>
              
              {getTotalPages() > 1 && (
                <div className="mt-8 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => {
                      const showPage = page === 1 || page === getTotalPages() || 
                                     (page >= currentPage - 2 && page <= currentPage + 2)
                      
                      if (!showPage) {
                        if (page === currentPage - 3 || page === currentPage + 3) {
                          return <span key={page} className="px-2 text-gray-400">...</span>
                        }
                        return null
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    </div>
                  
                  <div className="ml-6 text-sm text-gray-500">
                    Mostrando {((currentPage - 1) * decksPerPage) + 1} - {Math.min(currentPage * decksPerPage, filteredDecks.length)} de {filteredDecks.length} mazos
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <ToastContainer />
    </div>
  )
}

export default DecksPage
