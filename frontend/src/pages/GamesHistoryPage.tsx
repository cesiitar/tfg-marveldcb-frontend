import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { useToast } from '../components/Toast'

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
}

const GamesHistoryPage: React.FC = () => {
  const { user } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  const [games, setGames] = useState<GameHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss'>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'normal' | 'expert'>('all')

  // Cargar historial de partidas
  const loadGameHistory = async () => {
    if (!user?.sub) return

    setLoading(true)
    try {
      const historyData = await apiService.getGameHistory(user.sub)
      setGames(historyData.games || [])
      console.log('🎮 Historial de partidas cargado:', historyData.games)
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
  }, [user?.sub])

  // Filtrar partidas
  const filteredGames = games.filter(game => {
    const matchesSearch = game.deck_name.toLowerCase().includes(search.toLowerCase()) ||
                         game.hero_name.toLowerCase().includes(search.toLowerCase()) ||
                         game.villain_name.toLowerCase().includes(search.toLowerCase())
    
    const matchesResult = filterResult === 'all' || game.result === filterResult
    const matchesDifficulty = filterDifficulty === 'all' || game.difficulty === filterDifficulty
    
    return matchesSearch && matchesResult && matchesDifficulty
  })

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

  // Obtener color del aspecto
  const getAspectColor = (aspect: string) => {
    const colors = {
      aggression: 'bg-red-100 text-red-800',
      justice: 'bg-blue-100 text-blue-800',
      leadership: 'bg-green-100 text-green-800',
      protection: 'bg-yellow-100 text-yellow-800'
    }
    return colors[aspect as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Obtener color de dificultad
  const getDifficultyColor = (difficulty: string) => {
    return difficulty === 'expert' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial de partidas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Game History</h1>
                <p className="text-purple-100 text-lg">
                  Registro de todas tus partidas jugadas
                </p>
              </div>
              <div className="flex items-center gap-2 text-purple-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span className="font-medium">Historial</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todas</option>
                <option value="normal">Normal</option>
                <option value="expert">Experto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Partidas</p>
                <p className="text-2xl font-bold text-gray-900">{games.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Victorias</p>
                <p className="text-2xl font-bold text-gray-900">
                  {games.filter(g => g.result === 'win').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Derrotas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {games.filter(g => g.result === 'loss').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">% Victorias</p>
                <p className="text-2xl font-bold text-gray-900">
                  {games.length > 0 
                    ? Math.round((games.filter(g => g.result === 'win').length / games.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de partidas */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Partidas Jugadas ({filteredGames.length})
            </h2>
          </div>

          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
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
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Primer Mazo
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredGames.map((game) => (
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
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {game.result === 'win' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            )}
                          </svg>
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

                    {/* Botón ver mazo */}
                    <div className="ml-6">
                      <Link
                        to={`/deck/${game.deck_id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Mazo
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón volver */}
        <div className="mt-8 text-center">
          <Link
            to="/mydecks"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Mis Mazos
          </Link>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default GamesHistoryPage
