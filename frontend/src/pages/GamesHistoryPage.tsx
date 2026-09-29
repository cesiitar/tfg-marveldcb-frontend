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
  PageHeaderActions,
  pageHeaderButton,
} from '../components/ui/page-header'
import { AnimatedNumber } from '../components/ui/animated-number'
import { CaretLeftIcon, CaretRightIcon, ChartBarIcon, CheckIcon, ClipboardTextIcon, EyeIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, XIcon } from '@phosphor-icons/react'
import { usePageMeta } from '../lib/seo'

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
  usePageMeta({ title: 'Historial de partidas', description: 'Historial de partidas de Marvel Champions registradas en AIForge: villanos, dificultad, héroes y resultados de victoria o derrota.' })
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

  const wins = games.filter(g => g.result === 'win').length
  const losses = games.filter(g => g.result === 'loss').length
  const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0

  const segmentClass = (active: boolean) =>
    `px-3.5 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
      active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
    }`

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-brand-600 mx-auto mb-4"></div>
          <p className="text-ink-500">Cargando historial de partidas...</p>
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
        <PageHeaderActions>
          {isAuthenticated && (
            <div className="inline-flex rounded-lg bg-white/10 p-1 ring-1 ring-inset ring-white/15" role="group" aria-label="Qué partidas mostrar">
              <button
                type="button"
                onClick={() => setFilterMyGames(false)}
                aria-pressed={!filterMyGames}
                className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${!filterMyGames ? 'bg-white text-ink-900' : 'text-ink-200 hover:text-white'}`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterMyGames(true)}
                aria-pressed={filterMyGames}
                className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${filterMyGames ? 'bg-white text-ink-900' : 'text-ink-200 hover:text-white'}`}
              >
                Mis partidas
              </button>
            </div>
          )}
          <Link to="/add-game" className={pageHeaderButton.primary}>
            <PlusIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
            Añadir partida
          </Link>
        </PageHeaderActions>
      </PageHeader>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.06] p-2.5 flex flex-col lg:flex-row lg:items-center gap-2.5">
            <label className="relative flex-1 min-w-0">
              <span className="sr-only">Buscar partidas</span>
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" weight="bold" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por mazo, héroe o villano"
                className="w-full pl-12 pr-4 py-3 rounded-xl !bg-ink-50 border border-transparent text-ink-900 placeholder:text-ink-400"
              />
            </label>

            <div className="inline-flex rounded-lg bg-ink-100 p-1" role="group" aria-label="Filtrar por resultado">
              <button type="button" onClick={() => setFilterResult('all')} aria-pressed={filterResult === 'all'} className={segmentClass(filterResult === 'all')}>
                Todas
              </button>
              <button type="button" onClick={() => setFilterResult('win')} aria-pressed={filterResult === 'win'} className={segmentClass(filterResult === 'win')}>
                Victorias
              </button>
              <button type="button" onClick={() => setFilterResult('loss')} aria-pressed={filterResult === 'loss'} className={segmentClass(filterResult === 'loss')}>
                Derrotas
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:w-[22rem]">
              <label className="block">
                <span className="sr-only">Dificultad</span>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value as 'all' | 'normal' | 'expert')}
                  className="w-full px-3 py-3 rounded-xl border border-ink-200 text-sm text-ink-800"
                >
                  <option value="all">Toda dificultad</option>
                  <option value="normal">Normal</option>
                  <option value="expert">Experto</option>
                </select>
              </label>
              <label className="block">
                <span className="sr-only">Villano</span>
                <select
                  value={filterVillain}
                  onChange={(e) => setFilterVillain(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-ink-200 text-sm text-ink-800"
                >
                  <option value="all">Todos los villanos</option>
                  {availableVillains.map(villain => (
                    <option key={villain} value={villain}>{villain}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-100 rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm overflow-hidden">
            <div className="bg-white p-5 md:p-6">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <ClipboardTextIcon className="w-4 h-4 text-ink-400" weight="duotone" aria-hidden="true" />
                Partidas
              </p>
              <AnimatedNumber value={games.length} className="mt-2 block font-display text-4xl font-extrabold text-ink-900" />
            </div>
            <div className="bg-white p-5 md:p-6">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <CheckIcon className="w-4 h-4 text-green-600" weight="bold" aria-hidden="true" />
                Victorias
              </p>
              <AnimatedNumber value={wins} className="mt-2 block font-display text-4xl font-extrabold text-ink-900" />
            </div>
            <div className="bg-white p-5 md:p-6">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <XIcon className="w-4 h-4 text-red-600" weight="bold" aria-hidden="true" />
                Derrotas
              </p>
              <AnimatedNumber value={losses} className="mt-2 block font-display text-4xl font-extrabold text-ink-900" />
            </div>
            <div className="bg-white p-5 md:p-6">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <ChartBarIcon className="w-4 h-4 text-brand-600" weight="duotone" aria-hidden="true" />
                Tasa de victoria
              </p>
              <AnimatedNumber value={winRate} format={(n) => `${n}%`} className="mt-2 block font-display text-4xl font-extrabold text-ink-900" />
              <div className="mt-3 h-1.5 rounded-full bg-red-100 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-green-600 transition-[width] duration-700 ease-out" style={{ width: `${winRate}%` }} />
              </div>
            </div>
          </div>

          {/* Lista de partidas */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-900/[0.06] overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-ink-100 flex items-center justify-between">
              <h2 className="text-xl text-ink-900">Partidas jugadas</h2>
              <span className="text-sm font-medium text-ink-500 tabular-nums">{filteredGames.length} resultados</span>
            </div>

            {filteredGames.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto">
                  <ClipboardTextIcon className="h-7 w-7 text-ink-500" weight="duotone" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg text-ink-900">
                  {games.length === 0 ? 'Todavía no hay partidas' : 'Ninguna partida coincide con los filtros'}
                </h3>
                <p className="mt-1 text-sm text-ink-500 max-w-sm mx-auto">
                  {games.length === 0
                    ? 'Crea un mazo, juega y registra el resultado para empezar tu historial.'
                    : 'Prueba a quitar algún filtro o a buscar otro nombre.'}
                </p>
                {games.length === 0 && (
                  <Link to="/create-deck" className="btn btn-primary mt-6">
                    <PlusIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                    Crear primer mazo
                  </Link>
                )}
              </div>
            ) : (
              <div>
                <ul className="divide-y divide-ink-100">
                  {getCurrentPageGames().map((game) => {
                    const isWin = game.result === 'win'
                    return (
                      <li
                        key={game.id}
                        className={`relative grid grid-cols-1 md:grid-cols-[8.5rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 md:gap-5 md:items-center px-5 md:px-6 py-4 hover:bg-ink-50/70 transition-colors before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-r ${
                          isWin ? 'before:bg-green-500' : 'before:bg-red-500'
                        }`}
                      >
                        {/* Resultado */}
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${isWin ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {isWin ? (
                              <CheckIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                            ) : (
                              <XIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
                            )}
                          </span>
                          <span className={`font-semibold ${isWin ? 'text-green-700' : 'text-red-700'}`}>
                            {isWin ? 'Victoria' : 'Derrota'}
                          </span>
                        </div>

                        {/* Mazo */}
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900 truncate">{game.deck_name}</p>
                          <p className="mt-0.5 text-sm text-ink-500 truncate">
                            {game.hero_name}
                            {game.creator_name && <span className="text-ink-400"> · de {game.creator_name}</span>}
                          </p>
                        </div>

                        {/* Villano */}
                        <div className="min-w-0">
                          <p className="text-sm text-ink-500">contra</p>
                          <p className="font-semibold text-ink-900 truncate">{game.villain_name}</p>
                        </div>

                        {/* Etiquetas y fecha */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${game.difficulty === 'expert' ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'}`}>
                            {game.difficulty === 'expert' ? 'Experto' : 'Normal'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getAspectColor(game.aspect)}`}>
                            {game.aspect.charAt(0).toUpperCase() + game.aspect.slice(1)}
                          </span>
                          <span className="basis-full text-xs text-ink-400 tabular-nums">{formatDate(game.played_at)}</span>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2 md:justify-end">
                          <Link to={`/decks/${game.deck_id}`} className="btn btn-secondary btn-sm">
                            <EyeIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                            Ver mazo
                          </Link>
                          {isAuthenticated && user?.sub && user?.name && game.creator_name === user.name && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                setGameToDelete(game.id)
                              }}
                              disabled={deleting}
                              className="btn btn-danger btn-sm"
                              aria-label={`Eliminar partida contra ${game.villain_name}`}
                            >
                              <TrashIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                              <span className="md:sr-only lg:not-sr-only">Eliminar</span>
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {getTotalPages() > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-ink-100 px-5 md:px-6 py-4">
                    <div className="text-sm text-ink-500 tabular-nums">
                      {((currentPage - 1) * gamesPerPage) + 1}–{Math.min(currentPage * gamesPerPage, filteredGames.length)} de {filteredGames.length} partidas
                    </div>
                    <div className="flex items-center gap-1.5">
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
                            return <span key={page} className="px-1 text-ink-400">…</span>
                          }
                          return null
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`page-btn ${currentPage === page ? 'page-btn-active' : ''}`}
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
