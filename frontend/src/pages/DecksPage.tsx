import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { useToast } from '../components/Toast'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { CardsIcon, CaretLeftIcon, CaretRightIcon, WarningIcon } from '@phosphor-icons/react'
import { usePageMeta } from '../lib/seo'
import DeckCard from '../components/DeckCard'
import { usePageParam } from '../lib/use-page-param'
import pageMeta from '../lib/page-meta.json'

const DecksPage: React.FC = () => {
  usePageMeta(pageMeta.decks)
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
      
      return {
        search: savedSearch,
        heroFilter: savedHeroFilter,
        aspectFilter: savedAspectFilter,
        sortBy: savedSortBy
      }
    } catch (err) {
      console.error('Error cargando filtros desde localStorage:', err)
      return {
        search: '',
        heroFilter: '',
        aspectFilter: '',
        sortBy: 'newest' as const
      }
    }
  }
  
  const initialFilters = loadFiltersFromStorage()
  const [search, setSearch] = useState(initialFilters.search)
  const [heroFilter, setHeroFilter] = useState(initialFilters.heroFilter)
  const [aspectFilter, setAspectFilter] = useState(initialFilters.aspectFilter)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_favorites' | 'alphabetical'>(initialFilters.sortBy)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  
  // Paginación (en la URL: ?page=N)
  const [currentPage, setCurrentPage] = usePageParam()
  const [decksPerPage] = useState(16)
  
  // Guardar filtros en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('decksPage_search', search)
      localStorage.setItem('decksPage_heroFilter', heroFilter)
      localStorage.setItem('decksPage_aspectFilter', aspectFilter)
      localStorage.setItem('decksPage_sortBy', sortBy)
    } catch (err) {
      console.error('Error guardando filtros en localStorage:', err)
    }
  }, [search, heroFilter, aspectFilter, sortBy])

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
    setCurrentPage(page, { push: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear página cuando cambien los filtros (no al entrar: se respeta ?page=N)
  const filtersKey = JSON.stringify([search, heroFilter, aspectFilter, sortBy])
  const prevFiltersKey = useRef(filtersKey)
  useEffect(() => {
    if (prevFiltersKey.current === filtersKey) return
    prevFiltersKey.current = filtersKey
    setCurrentPage(1)
  }, [filtersKey, setCurrentPage])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mazos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WarningIcon className="w-8 h-8 text-red-600" weight="duotone" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Comunidad</PageHeaderEyebrow>
          <PageHeaderTitle>{pageMeta.decks.heading}</PageHeaderTitle>
          <PageHeaderDescription>
            Explora los mazos públicos creados por la comunidad
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-ink-900/[0.06] mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre de mazo"
                aria-label="Buscar por nombre de mazo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <select
                value={heroFilter}
                onChange={(e) => setHeroFilter(e.target.value)}
                aria-label="Filtrar por héroe"
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
                aria-label="Filtrar por aspecto"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todos los aspectos</option>
                {availableAspects.map(a => (
                  <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'most_favorites' | 'alphabetical')}
                aria-label="Ordenar mazos"
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
              <div className="w-24 h-24 bg-ink-100 ring-1 ring-ink-900/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CardsIcon className="w-12 h-12 text-gray-400" weight="duotone" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                No hay mazos que coincidan
              </h2>
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
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  id={isLastViewed ? `deck-${deck.id}` : undefined}
                  highlighted={Boolean(isLastViewed)}
                  onNavigate={() => {
                    // Guardar el ID antes de navegar
                    if (deck.id) {
                      try {
                        localStorage.setItem('lastViewedDeckId', deck.id.toString())
                      } catch (err) {
                        console.error('Error guardando último mazo visto:', err)
                      }
                    }
                  }}
                  favorite={{
                    active: isAuthenticated && favorites.has(deck.id!),
                    count: deck.favorite_count ?? 0,
                    onToggle: isAuthenticated ? () => handleToggleFavorite(deck.id!) : undefined,
                  }}
                />
                )
                })}
              </div>
              
              {getTotalPages() > 1 && (
                <div className="mt-8 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="page-btn"
                      aria-label="Página anterior"
                    >
                      <CaretLeftIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
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
                          className={`page-btn ${currentPage === page ? 'page-btn-active' : ''}`}
                          aria-current={currentPage === page ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                      className="page-btn"
                      aria-label="Página siguiente"
                    >
                      <CaretRightIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
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
