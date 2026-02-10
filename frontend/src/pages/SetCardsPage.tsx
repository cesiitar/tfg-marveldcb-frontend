import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import { Card, CardSet } from '../types/card'
import { translateCardType } from '../utils/typeTranslations'
import { getClassBadgeStyle, getClassGradientClasses } from '../utils/classColors'

const SetCardsPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  
  const [set, setSet] = useState<CardSet | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Filtros y ordenamiento
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('tipo')
  const [statsView, setStatsView] = useState<string>('general')
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [cardsPerPage] = useState(20)

  // Cargar datos del set
  useEffect(() => {
    const loadSetData = async () => {
      if (!setId) return
      
      setIsLoading(true)
      try {
        // Cargar información del set
        const setsData = await apiService.getSets()
        const currentSet = setsData.find(s => s.id === parseInt(setId))
        setSet(currentSet || null)
        
        // Cargar cartas del set
        await loadCards()
      } catch (error) {
        console.error('Error loading set data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSetData()
  }, [setId])

  // Cargar cartas con filtros
  const loadCards = async () => {
    if (!setId) return
    
    setIsLoading(true)
    try {
      const cardsData = await apiService.getCardsBySet(
        parseInt(setId), 
        search || undefined, 
        sortBy
      )
      setCards(cardsData.cards)
    } catch (error) {
      console.error('Error loading cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Recargar cartas cuando cambien los filtros
  useEffect(() => {
    loadCards()
    setCurrentPage(1) // Resetear página cuando cambien los filtros
  }, [search, sortBy])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value)
  }

  // Funciones de paginación
  const getCurrentPageCards = () => {
    const startIndex = (currentPage - 1) * cardsPerPage
    const endIndex = startIndex + cardsPerPage
    return cards.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(cards.length / cardsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getCardGradient = (clase: string) => getClassGradientClasses(clase)

  const generateSetStats = (cards: Card[], viewType: string = 'general') => {
    let filteredCards = cards
    
      // Filtrar cartas por aspecto si se selecciona un aspecto específico
    if (viewType !== 'general') {
      filteredCards = cards.filter(c => c.clase === viewType)
    }
    
    const stats = {
      total: filteredCards.length,
      heroes: filteredCards.filter(c => c.type === 'hero').length,
      allies: filteredCards.filter(c => c.type === 'ally').length,
      events: filteredCards.filter(c => c.type === 'event').length,
      upgrades: filteredCards.filter(c => c.type === 'upgrade').length,
      supports: filteredCards.filter(c => c.type === 'support').length,
      resources: filteredCards.filter(c => c.type === 'resource').length,
      avgCost: filteredCards.length > 0 ? (filteredCards.reduce((sum, card) => sum + card.cost, 0) / filteredCards.length).toFixed(1) : '0',
      maxCost: filteredCards.length > 0 ? Math.max(...filteredCards.map(c => c.cost)) : 0,
      minCost: filteredCards.length > 0 ? Math.min(...filteredCards.map(c => c.cost)) : 0
    }

    // Si es vista general, mostrar distribución por ASPECTOS
    if (viewType === 'general') {
      const classDistribution = getAvailableClasses(cards)
      return [
        { value: stats.total, label: 'Total Cartas', color: 'text-blue-600' },
        { value: classDistribution.find(c => c.value === 'hero')?.count || 0, label: 'Aspecto Hero', color: 'text-orange-600' },
        { value: classDistribution.find(c => c.value === 'basic')?.count || 0, label: 'Aspecto Basic', color: 'text-gray-600' },
        { value: classDistribution.find(c => c.value === 'aggression')?.count || 0, label: 'Aspecto Aggression', color: 'text-red-600' },
        { value: classDistribution.find(c => c.value === 'justice')?.count || 0, label: 'Aspecto Justice', color: 'text-blue-500' },
        { value: classDistribution.find(c => c.value === 'leadership')?.count || 0, label: 'Aspecto Leadership', color: 'text-yellow-600' },
        { value: classDistribution.find(c => c.value === 'protection')?.count || 0, label: 'Aspecto Protection', color: 'text-emerald-600' },
        { value: classDistribution.find(c => c.value === 'encounter')?.count || 0, label: 'Aspecto Encounter', color: 'text-red-900' },
        { value: classDistribution.find(c => c.value === 'campaign')?.count || 0, label: 'Aspecto Campaign', color: 'text-indigo-600' }
      ].filter(stat => stat.value > 0) // Solo mostrar clases que existen
    }
    
    // Si es vista por aspecto, mostrar estadísticas detalladas de ese aspecto
    const classStats = [
      { value: stats.total, label: 'Total', color: 'text-blue-600' },
      { value: stats.heroes, label: 'Heroes', color: 'text-red-600' },
      { value: stats.allies, label: 'Allies', color: 'text-blue-500' },
      { value: stats.events, label: 'Events', color: 'text-purple-600' },
      { value: stats.upgrades, label: 'Upgrades', color: 'text-green-600' },
      { value: stats.supports, label: 'Supports', color: 'text-yellow-600' },
      { value: stats.resources, label: 'Resources', color: 'text-orange-600' },
      { value: `${stats.minCost}-${stats.maxCost}`, label: 'Cost Range', color: 'text-gray-600' }
    ]
    
    // Filtrar estadísticas que tengan valor 0 para mantener la UI limpia
    return classStats.filter(stat => stat.value !== 0 || stat.label === 'Total' || stat.label === 'Rango Coste')
  }

  // getClassBadgeStyle reutilizado desde utils/classColors

  const getAvailableClasses = (cards: Card[]) => {
    const classes = [...new Set(cards.map(c => c.clase))].sort()
    return classes.map(clase => ({
      value: clase,
      label: clase.charAt(0).toUpperCase() + clase.slice(1),
      count: cards.filter(c => c.clase === clase).length
    }))
  }

  const getStatsTitle = (viewType: string) => {
    if (viewType === 'general') return 'Set Statistics'
    const aspectName = viewType.charAt(0).toUpperCase() + viewType.slice(1)
    return `${aspectName} Statistics`
  }

  if (!set) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Set no encontrado</h1>
          <button
            onClick={() => navigate('/cards')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Volver a cartas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div></div>
          <button
            onClick={() => navigate('/cards')}
              className="text-blue-600 hover:text-blue-800 flex items-center transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a cartas
          </button>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{set.name}</h1>
                <p className="text-blue-100 text-lg">
                  {set.cardCount} cartas disponibles
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas del Set */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {getStatsTitle(statsView)}
            </h2>
            
            {/* Desplegable de vista de estadísticas */}
            <div className="relative">
              <select
                value={statsView}
                onChange={(e) => setStatsView(e.target.value)}
                className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white text-sm font-medium"
              >
                <option value="general">Resumen General</option>
                {getAvailableClasses(cards).map(clase => (
                  <option key={clase.value} value={clase.value}>
                    {clase.label} ({clase.count})
                  </option>
                ))}
              </select>
              <svg className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {generateSetStats(cards, statsView).map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filtros y Ordenamiento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buscador */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                🔍 Buscar por nombre
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Escribe el nombre de la carta..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Ordenamiento */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                📊 Ordenar por
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                >
                  <option value="tipo">Tipo (héroes primero)</option>
                  <option value="clase">Aspecto</option>
                  <option value="nombre">Nombre</option>
                  <option value="fuerza">Fuerza (coste)</option>
                </select>
                <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cartas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Cartas del Set
            </h2>
            {!isLoading && cards.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {cards.length} cartas
                </span>
                {getTotalPages() > 1 && (
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    Página {currentPage} de {getTotalPages()}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Cargando cartas...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.57M15 6.343A7.962 7.962 0 0112 4c-2.34 0-4.29 1.009-5.824 2.57" />
                </svg>
              </div>
              <p className="text-lg">No se encontraron cartas</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {getCurrentPageCards().map((card, index) => (
                  <div key={index} className={`bg-gradient-to-br ${getCardGradient(card.clase)} border-2 rounded-xl p-5 hover:shadow-lg hover:scale-105 transition-all duration-300 hover:-translate-y-1`}>
                    <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2">{card.name}</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Aspecto:</span>
                        <span className={`font-semibold capitalize px-2 py-1 rounded-full text-xs ${getClassBadgeStyle(card.clase)}`}>
                          {card.clase}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Tipo:</span>
                        <span className="font-medium text-gray-800">{translateCardType(card.type)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Coste:</span>
                        <span className="font-bold text-lg text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          {card.cost}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
                    Mostrando {((currentPage - 1) * cardsPerPage) + 1} - {Math.min(currentPage * cardsPerPage, cards.length)} de {cards.length} cartas
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetCardsPage
