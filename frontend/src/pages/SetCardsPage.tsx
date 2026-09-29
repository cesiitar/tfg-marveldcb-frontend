import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import { Card, CardSet } from '../types/card'
import { GameCard } from '../components/ui/game-card'
import { Reveal } from '../components/motion/reveal'
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
import { CardsIcon, CaretDownIcon, CaretLeftIcon, CaretRightIcon, ChartBarIcon, FunnelIcon, MagnifyingGlassIcon, SmileySadIcon } from '@phosphor-icons/react'

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
        { value: stats.total, label: 'Total Cartas', color: 'text-ink-900' },
        { value: classDistribution.find(c => c.value === 'hero')?.count || 0, label: 'Aspecto Hero', color: 'text-purple-600' },
        { value: classDistribution.find(c => c.value === 'basic')?.count || 0, label: 'Aspecto Basic', color: 'text-gray-600' },
        { value: classDistribution.find(c => c.value === 'aggression')?.count || 0, label: 'Aspecto Aggression', color: 'text-red-600' },
        { value: classDistribution.find(c => c.value === 'justice')?.count || 0, label: 'Aspecto Justice', color: 'text-amber-600' },
        { value: classDistribution.find(c => c.value === 'leadership')?.count || 0, label: 'Aspecto Leadership', color: 'text-sky-600' },
        { value: classDistribution.find(c => c.value === 'protection')?.count || 0, label: 'Aspecto Protection', color: 'text-green-600' },
        { value: classDistribution.find(c => c.value === 'encounter')?.count || 0, label: 'Aspecto Encounter', color: 'text-red-900' },
        { value: classDistribution.find(c => c.value === 'campaign')?.count || 0, label: 'Aspecto Campaign', color: 'text-indigo-600' }
      ].filter(stat => stat.value > 0) // Solo mostrar clases que existen
    }
    
    // Si es vista por aspecto, mostrar estadísticas detalladas de ese aspecto
    const classStats = [
      { value: stats.total, label: 'Total', color: 'text-ink-900' },
      { value: stats.heroes, label: 'Heroes', color: 'text-ink-800' },
      { value: stats.allies, label: 'Allies', color: 'text-ink-800' },
      { value: stats.events, label: 'Events', color: 'text-ink-800' },
      { value: stats.upgrades, label: 'Upgrades', color: 'text-ink-800' },
      { value: stats.supports, label: 'Supports', color: 'text-ink-800' },
      { value: stats.resources, label: 'Resources', color: 'text-ink-800' },
      { value: `${stats.minCost}-${stats.maxCost}`, label: 'Cost Range', color: 'text-ink-800' }
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
            className="btn btn-primary"
          >
            Volver a cartas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh]">
      <div>
        {/* Header */}
        <PageHeader className="mb-8">
          <PageHeaderContent>
            <PageHeaderEyebrow>Set de cartas</PageHeaderEyebrow>
            <PageHeaderTitle>{set.name}</PageHeaderTitle>
            <PageHeaderDescription>
              <AnimatedNumber value={set.cardCount} className="font-semibold text-white" /> cartas disponibles
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <button onClick={() => navigate('/cards')} className={pageHeaderButton.secondary}>
              <CaretLeftIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
              Volver a cartas
            </button>
          </PageHeaderActions>
        </PageHeader>

        {/* Estadísticas del Set */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <ChartBarIcon className="w-6 h-6 mr-2 text-blue-600" weight="duotone" aria-hidden="true" />
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
              <CaretDownIcon className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" weight="bold" aria-hidden="true" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {generateSetStats(cards, statsView).map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white rounded-xl ring-1 ring-ink-900/[0.06] border-0">
                {typeof stat.value === 'number' ? (
                  <AnimatedNumber value={stat.value} className={`block font-display text-2xl font-extrabold ${stat.color}`} />
                ) : (
                  <div className={`font-display text-2xl font-extrabold tabular-nums ${stat.color}`}>{stat.value}</div>
                )}
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <FunnelIcon className="w-6 h-6 mr-2 text-blue-600" weight="duotone" aria-hidden="true" />
            Filtros y Ordenamiento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buscador */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Buscar por nombre
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Escribe el nombre de la carta..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" weight="bold" aria-hidden="true" />
              </div>
            </div>

            {/* Ordenamiento */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Ordenar por
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
                <CaretDownIcon className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" weight="bold" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Cartas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <CardsIcon className="w-6 h-6 mr-2 text-brand-600" weight="duotone" aria-hidden="true" />
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
                <SmileySadIcon className="w-8 h-8 text-gray-400" weight="duotone" aria-hidden="true" />
              </div>
              <p className="text-lg">No se encontraron cartas</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                {getCurrentPageCards().map((card, index) => (
                  <Reveal key={`${currentPage}-${index}`} delay={(index % 5) * 0.05} y={24}>
                    <GameCard name={card.name} aspect={card.clase} type={card.type} cost={card.cost} />
                  </Reveal>
                ))}
              </div>
              
              {getTotalPages() > 1 && (
                <div className="mt-8 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="page-btn"
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
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                      className="page-btn"
                    >
                      <CaretRightIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
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
