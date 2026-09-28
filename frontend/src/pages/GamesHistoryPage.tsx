import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { useToast } from '../components/Toast'
import { getClassBadgeStyle } from '../utils/classColors'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { AnimatedNumber } from '../components/ui/animated-number'
import { CaretLeftIcon, CaretRightIcon, ChartBarIcon, CheckIcon, ClipboardTextIcon, EyeIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, XIcon } from '@phosphor-icons/react'

interface GameHistory {
  id: number
  deck_id: number
  deck_name: string
  hero_name: string
  aspect: string
  villain_id: number
  villain_name: string
  difficulty: 'normal' | 'expert'
  result: 'win' | 'loss'
  played_at: string
  creator_name?: string  // Autor del mazo/usuario que jugó la partida
}

const GamesHistoryPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  const [games, setGames] = useState<GameHistory[]>([])
  const [loading, setLoading] = useState(true)
  
  // Cargar filtros desde localStorage al inicializar
  const loadFiltersFromStorage = () => {
    try {
      const savedSearch = localStorage.getItem('gameHistory_search') || ''
      const savedFilterResult = (localStorage.getItem('gameHistory_filterResult') || 'all') as 'all' | 'win' | 'loss'
      const savedFilterDifficulty = (localStorage.getItem('gameHistory_filterDifficulty') || 'all') as 'all' | 'normal' | 'expert'
      const savedFilterVillain = localStorage.getItem('gameHistory_filterVillain') || 'all'
      const savedFilterMyGames = localStorage.getItem('gameHistory_filterMyGames') === 'true'
      
      return {
        search: savedSearch,
        filterResult: savedFilterResult,
        filterDifficulty: savedFilterDifficulty,
        filterVillain: savedFilterVillain,
        filterMyGames: savedFilterMyGames
      }
    } catch (err) {
      console.error('Error cargando filtros desde localStorage:', err)
      return {
        search: '',
        filterResult: 'all' as const,
        filterDifficulty: 'all' as const,
        filterVillain: 'all',
        filterMyGames: false
      }
    }
  }
  
  const initialFilters = loadFiltersFromStorage()
  const [search, setSearch] = useState(initialFilters.search)
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss'>(initialFilters.filterResult)
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'normal' | 'expert'>(initialFilters.filterDifficulty)
  const [filterVillain, setFilterVillain] = useState<string>(initialFilters.filterVillain)
  const [filterMyGames, setFilterMyGames] = useState(initialFilters.filterMyGames)
  
  // Guardar filtros en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('gameHistory_search', search)
      localStorage.setItem('gameHistory_filterResult', filterResult)
      localStorage.setItem('gameHistory_filterDifficulty', filterDifficulty)
      localStorage.setItem('gameHistory_filterVillain', filterVillain)
      localStorage.setItem('gameHistory_filterMyGames', filterMyGames.toString())
    } catch (err) {
      console.error('Error guardando filtros en localStorage:', err)
    }
  }, [search, filterResult, filterDifficulty, filterVillain, filterMyGames])
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [gamesPerPage] = useState(15)

  // Eliminar partida
  const [gameToDelete, setGameToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleConfirmDeleteGame = async () => {
    if (!gameToDelete || !user?.sub) return
    setDeleting(true)
    try {
      await apiService.deleteGameConfiguration(gameToDelete, user.sub)
      setGames(prev => prev.filter(g => g.id !== gameToDelete))
      showToast('Partida eliminada correctamente', 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la partida'
      showToast(message, 'error')
    } finally {
      setDeleting(false)
      setGameToDelete(null)
    }
  }
  
  // Obtener lista única de villanos
  const availableVillains = Array.from(new Set(games.map(game => game.villain_name))).sort()

  // Cargar historial de partidas
  const loadGameHistory = async () => {
    setLoading(true)
    try {
      let historyData
      
      if (!isAuthenticated || !user?.sub) {
        // Si no está logueado, cargar TODAS las partidas públicas
        historyData = await apiService.getGameHistory(null, false)
      } else {
        // Si está logueado
        if (filterMyGames) {
          // Filtrar solo por mis partidas
          historyData = await apiService.getGameHistory(user.sub, true)
        } else {
          // Cargar todas las partidas (públicas)
          historyData = await apiService.getGameHistory(user.sub, false)
        }
      }
      
      setGames(historyData.games || [])
    } catch (err) {
      console.error('Error cargando historial:', err)
      showToast('Error al cargar el historial de partidas', 'error')
      setGames([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGameHistory()
  }, [user?.sub, filterMyGames, isAuthenticated])

  // Filtrar partidas
  const filteredGames = games.filter(game => {
    const matchesSearch = game.deck_name.toLowerCase().includes(search.toLowerCase()) ||
                         game.hero_name.toLowerCase().includes(search.toLowerCase()) ||
                         game.villain_name.toLowerCase().includes(search.toLowerCase())
    
    const matchesResult = filterResult === 'all' || game.result === filterResult
    const matchesDifficulty = filterDifficulty === 'all' || game.difficulty === filterDifficulty
    const matchesVillain = filterVillain === 'all' || game.villain_name === filterVillain
    
    return matchesSearch && matchesResult && matchesDifficulty && matchesVillain
  })

  // Funciones de paginación
  const getCurrentPageGames = () => {
    const startIndex = (currentPage - 1) * gamesPerPage
    const endIndex = startIndex + gamesPerPage
    return filteredGames.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(filteredGames.length / gamesPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterResult, filterDifficulty, filterVillain, filterMyGames])

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Obtener color del aspecto usando la función centralizada
  const getAspectColor = (aspect: string) => {
    return getClassBadgeStyle(aspect)
  }

  // Obtener color de dificultad
  const getDifficultyColor = (difficulty: string) => {
    return difficulty === 'expert' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial de partidas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Partidas</PageHeaderEyebrow>
          <PageHeaderTitle>Historial de Partidas</PageHeaderTitle>
          <PageHeaderDescription>
            {isAuthenticated && filterMyGames ? 'Tus partidas jugadas' : 'Registro de todas las partidas jugadas'}
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar partidas
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mazo, héroe o villano..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" weight="bold" aria-hidden="true" />
              </div>
            </div>

            {/* Filtro por resultado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resultado
              </label>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value as 'all' | 'win' | 'loss')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                <option value="win">Victorias</option>
                <option value="loss">Derrotas</option>
              </select>
            </div>

            {/* Filtro por dificultad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dificultad
              </label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as 'all' | 'normal' | 'expert')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas</option>
                <option value="normal">Normal</option>
                <option value="expert">Experto</option>
              </select>
            </div>

            {/* Filtro por Villano */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Villano
              </label>
              <select
                value={filterVillain}
                onChange={(e) => setFilterVillain(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                {availableVillains.map(villain => (
                  <option key={villain} value={villain}>{villain}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Mis Partidas (solo si está autenticado) */}
            {isAuthenticated && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtro
                </label>
                <select
                  value={filterMyGames ? 'my' : 'all'}
                  onChange={(e) => setFilterMyGames(e.target.value === 'my')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas las Partidas</option>
                  <option value="my">Mis Partidas</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardTextIcon className="w-6 h-6 text-blue-600" weight="duotone" aria-hidden="true" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Partidas</p>
                <AnimatedNumber value={games.length} className="block font-display text-3xl font-extrabold text-gray-900" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckIcon className="w-6 h-6 text-green-600" weight="bold" aria-hidden="true" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Victorias</p>
                <AnimatedNumber
                  value={games.filter(g => g.result === 'win').length}
                  className="block font-display text-3xl font-extrabold text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XIcon className="w-6 h-6 text-red-600" weight="bold" aria-hidden="true" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Derrotas</p>
                <AnimatedNumber
                  value={games.filter(g => g.result === 'loss').length}
                  className="block font-display text-3xl font-extrabold text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" weight="duotone" aria-hidden="true" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">% Victorias</p>
                <AnimatedNumber
                  value={games.length > 0
                    ? Math.round((games.filter(g => g.result === 'win').length / games.length) * 100)
                    : 0}
                  format={(n) => `${n}%`}
                  className="block font-display text-3xl font-extrabold text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de partidas */}
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Partidas Jugadas ({filteredGames.length})
            </h2>
          </div>

          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardTextIcon className="mx-auto h-12 w-12 text-gray-400" weight="duotone" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay partidas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {games.length === 0 
                  ? 'Aún no has jugado ninguna partida. ¡Crea un mazo y juega!'
                  : 'No se encontraron partidas con los filtros seleccionados.'
                }
              </p>
              {games.length === 0 && (
                <div className="mt-6">
                  <Link
                    to="/create-deck"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" weight="bold" aria-hidden="true" />
                    Crear Primer Mazo
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="divide-y divide-gray-200">
                {getCurrentPageGames().map((game) => (
                <div key={game.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        {/* Resultado */}
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          game.result === 'win' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {game.result === 'win' ? (
                            <CheckIcon className="w-3 h-3 mr-1" weight="bold" aria-hidden="true" />
                          ) : (
                            <XIcon className="w-3 h-3 mr-1" weight="bold" aria-hidden="true" />
                          )}
                          {game.result === 'win' ? 'Victoria' : 'Derrota'}
                        </div>

                        {/* Dificultad */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                          {game.difficulty === 'expert' ? 'Experto' : 'Normal'}
                        </div>

                        {/* Aspecto */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getAspectColor(game.aspect)}`}>
                          {game.aspect.charAt(0).toUpperCase() + game.aspect.slice(1)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Mazo */}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{game.deck_name}</p>
                          <p className="text-sm text-gray-600">{game.hero_name}</p>
                          {game.creator_name && (
                            <p className="text-xs text-gray-500 mt-1">by {game.creator_name}</p>
                          )}
                        </div>

                        {/* Villano */}
                        <div>
                          <p className="text-sm font-medium text-gray-900">vs {game.villain_name}</p>
                          <p className="text-sm text-gray-600">Villano</p>
                        </div>

                        {/* Fecha */}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatDate(game.played_at)}</p>
                          <p className="text-sm text-gray-600">Fecha</p>
                        </div>
                      </div>
                    </div>

                    {/* Botones: Ver mazo y Eliminar (solo en "Mis Partidas") */}
                    <div className="ml-6 flex items-center gap-2">
                      <Link
                        to={`/decks/${game.deck_id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" weight="duotone" aria-hidden="true" />
                        Ver Mazo
                      </Link>
                      {isAuthenticated && user?.sub && user?.name && game.creator_name === user.name && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            setGameToDelete(game.id)
                          }}
                          disabled={deleting}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <TrashIcon className="w-4 h-4 mr-2" weight="duotone" aria-hidden="true" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {getTotalPages() > 1 && (
                <div className="mt-8 flex items-center justify-center border-t border-gray-200 pt-6">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                      <CaretRightIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="ml-6 text-sm text-gray-500">
                    Mostrando {((currentPage - 1) * gamesPerPage) + 1} - {Math.min(currentPage * gamesPerPage, filteredGames.length)} de {filteredGames.length} partidas
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
      
      {/* Confirmación eliminar partida */}
      <ConfirmDialog
        isOpen={gameToDelete !== null}
        title="Eliminar partida"
        message="¿Estás seguro de que quieres eliminar esta partida del historial? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={handleConfirmDeleteGame}
        onCancel={() => setGameToDelete(null)}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default GamesHistoryPage
