import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth0()
  const [stats, setStats] = useState({
    // Estadísticas globales
    totalDecks: 0,
    totalGames: 0,
    totalWins: 0,
    // Estadísticas del usuario (solo si está logueado)
    myDecks: 0,
    myGames: 0,
    myWins: 0,
    myFavorites: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        
        // Siempre cargar estadísticas globales
        try {
          const decks = await apiService.getDecks()
          const gameHistory = await apiService.getGameHistory(null, false)
          const games = gameHistory.games || []
          const wins = games.filter(g => g.result === 'win').length
          
          if (isAuthenticated && user?.sub) {
            // Si está logueado, cargar también estadísticas del usuario
            try {
              const userDecks = await apiService.getUserDecks(user.sub)
              const userGameHistory = await apiService.getGameHistory(user.sub, true)
              const userGames = userGameHistory.games || []
              const userWins = userGames.filter(g => g.result === 'win').length
              const favorites = await apiService.getUserFavorites(user.sub)
              
              setStats({
                totalDecks: decks.length,
                totalGames: games.length,
                totalWins: wins,
                myDecks: userDecks.length,
                myGames: userGames.length,
                myWins: userWins,
                myFavorites: favorites.length
              })
            } catch (err) {
              console.error('Error loading user stats:', err)
              // Si falla cargar estadísticas del usuario, solo mostrar globales
              setStats({
                totalDecks: decks.length,
                totalGames: games.length,
                totalWins: wins,
                myDecks: 0,
                myGames: 0,
                myWins: 0,
                myFavorites: 0
              })
            }
          } else {
            // No logueado: solo estadísticas globales
            setStats({
              totalDecks: decks.length,
              totalGames: games.length,
              totalWins: wins,
              myDecks: 0,
              myGames: 0,
              myWins: 0,
              myFavorites: 0
            })
          }
        } catch (err) {
          console.error('Error loading global stats:', err)
          // Si falla cargar partidas, solo usar datos de mazos
          try {
            const decks = await apiService.getDecks()
            setStats({
              totalDecks: decks.length,
              totalGames: 0,
              totalWins: 0,
              myDecks: 0,
              myGames: 0,
              myWins: 0,
              myFavorites: 0
            })
          } catch (err2) {
            console.error('Error loading decks:', err2)
          }
        }
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [isAuthenticated, user?.sub])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        <div className="relative z-10 text-center py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Bienvenido a <span className="text-white">AI</span><span className="text-blue-400">Forge</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              La plataforma definitiva para crear mazos con inteligencia artificial
            </p>
            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              Forja mazos, aprende de tus partidas y obtén recomendaciones basadas en IA para dominar cada partida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/create-deck" 
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Crear Mazo
              </Link>
              <Link 
                to="/decks" 
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors duration-200 font-semibold text-lg border-2 border-white/30"
              >
                Explorar Mazos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Estadísticas Generales */}
          <div className="space-y-6 mb-12">
            {/* Estadísticas Globales */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Estadísticas Globales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-gray-900">{stats.totalDecks}</div>
                      <div className="text-sm text-gray-600 mt-1">Mazos Totales</div>
                    </>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-gray-900">{stats.totalGames}</div>
                      <div className="text-sm text-gray-600 mt-1">Partidas Totales</div>
                    </>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-gray-900">{stats.totalWins}</div>
                      <div className="text-sm text-gray-600 mt-1">Victorias Totales</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Estadísticas del Usuario (solo si está logueado) */}
            {isAuthenticated && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Mis Estadísticas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-900">{stats.myDecks}</div>
                        <div className="text-sm text-gray-600 mt-1">Mis Mazos</div>
                      </>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-900">{stats.myGames}</div>
                        <div className="text-sm text-gray-600 mt-1">Mis Partidas</div>
                      </>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-900">{stats.myWins}</div>
                        <div className="text-sm text-gray-600 mt-1">Mis Victorias</div>
                      </>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-gray-900">{stats.myFavorites}</div>
                        <div className="text-sm text-gray-600 mt-1">Mis Favoritos</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Características Destacadas */}
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
              ¿Por qué elegir <span className="text-gray-900">AI</span><span className="text-blue-400">Forge</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Inteligencia Artificial</h3>
                <p className="text-gray-600">
                  Genera mazos optimizados con IA para enfrentar villanos específicos. La IA aprende de tus partidas para crear las mejores combinaciones de cartas.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Análisis de Partidas</h3>
                <p className="text-gray-600">
                  Registra tus partidas y analiza tu rendimiento. Visualiza estadísticas, victorias y derrotas para mejorar tus estrategias.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Comunidad Activa</h3>
                <p className="text-gray-600">
                  Comparte tus mazos, comenta y marca como favoritos los mejores. Únete a una comunidad de jugadores apasionados.
                </p>
              </div>
            </div>
          </div>

          {/* Cómo Funciona */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
              ¿Cómo funciona?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Elige tu Héroe</h3>
                <p className="text-gray-600 text-sm">
                  Selecciona el héroe con el que quieres construir tu mazo
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Construye tu Mazo</h3>
                <p className="text-gray-600 text-sm">
                  Añade las cartas que mejor se adapten a tu estrategia
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Juega y Aprende</h3>
                <p className="text-gray-600 text-sm">
                  Registra tus partidas y mejora con cada juego
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action Final */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-xl p-8 md:p-12 text-center text-white mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para crear tu primer mazo?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Únete a la comunidad y comienza a construir mazos increíbles
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/create-deck" 
                className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold text-lg shadow-lg"
              >
                Crear Mazo Ahora
              </Link>
              <Link 
                to="/decks" 
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors duration-200 font-semibold text-lg border-2 border-white/50"
              >
                Ver Mazos de la Comunidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
