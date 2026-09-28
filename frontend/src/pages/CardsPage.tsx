import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CardSet } from '../types/card'
import { apiService } from '../services/api'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  pageHeaderButton,
} from '../components/ui/page-header'
import { CaretRightIcon, MagnifyingGlassIcon, SmileySadIcon, WarningIcon } from '@phosphor-icons/react'

const CardsPage: React.FC = () => {
  const [sets, setSets] = useState<CardSet[]>([])
  const [filteredSets, setFilteredSets] = useState<CardSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true)
        setError(null)
        const setsData = await apiService.getSets()
        setSets(setsData)
        setFilteredSets(setsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los sets')
      } finally {
        setLoading(false)
      }
    }

    fetchSets()
  }, [])

  // Filtrar sets cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSets(sets)
    } else {
      const filtered = sets.filter(set => 
        set.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      )
      setFilteredSets(filtered)
    }
  }, [searchTerm, sets])

  const getSetColor = (index: number) => {
    const colors = [
      // Paleta de la web: marca, tinta y colores de aspecto del juego
      'from-brand-500 to-brand-700',
      'from-ink-700 to-ink-900',
      'from-red-500 to-red-600',
      'from-amber-500 to-amber-600',
      'from-sky-500 to-sky-600',
      'from-green-500 to-green-600',
      'from-teal-500 to-teal-600',
      'from-ink-400 to-ink-500'
    ]
    return colors[index % colors.length]
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600">Cargando sets de cartas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WarningIcon className="w-8 h-8 text-red-600" weight="duotone" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold text-secondary-800 mb-4">Error</h2>
        <p className="text-secondary-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh]">
      {/* Hero Section */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Catálogo</PageHeaderEyebrow>
          <PageHeaderTitle>Cartas</PageHeaderTitle>
          <PageHeaderDescription>
            Explora y construye mazos con inteligencia artificial
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link to="/cards/search" className={pageHeaderButton.primary}>
            Buscar Cartas
          </Link>
        </PageHeaderActions>
      </PageHeader>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Buscador de Sets */}
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-8">
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                  Buscar Sets
                </h2>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre del set..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" weight="bold" aria-hidden="true" />
              </div>
              
              {searchTerm && (
                <div className="mt-3 text-center">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {filteredSets.length} set{filteredSets.length !== 1 ? 's' : ''} encontrado{filteredSets.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sets Grid */}
          {filteredSets.length === 0 && searchTerm ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-ink-100 ring-1 ring-ink-900/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <SmileySadIcon className="w-12 h-12 text-gray-400" weight="duotone" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No se encontraron sets
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                No hay sets que coincidan con "{searchTerm}"
              </p>
              <button 
                onClick={() => setSearchTerm('')}
                className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredSets.map((set, index) => (
                <Link 
                  key={set.id}
                  to={`/cards/set/${set.id}`}
                  className="group deck-card"
                >
                  {/* Header with subtle gradient */}
                  <div className={`h-2 bg-gradient-to-r ${getSetColor(index)}`}></div>
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-700">
                            {set.id}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                            {set.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {set.cardCount} cartas
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Ver cartas
                      </span>
                      <CaretRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" weight="bold" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardsPage
