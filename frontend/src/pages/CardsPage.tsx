import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CardSet } from '../types/card'
import { apiService } from '../services/api'

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
        const response = await apiService.getSets()
        const setsData = response.sets || response
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
      'from-blue-500 to-blue-600',
      'from-slate-500 to-slate-600', 
      'from-indigo-500 to-indigo-600',
      'from-emerald-500 to-emerald-600',
      'from-purple-500 to-purple-600',
      'from-rose-500 to-rose-600',
      'from-teal-500 to-teal-600',
      'from-violet-500 to-violet-600',
      'from-cyan-500 to-cyan-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600',
      'from-pink-500 to-pink-600',
      'from-amber-500 to-amber-600',
      'from-red-500 to-red-600',
      'from-lime-500 to-lime-600',
      'from-sky-500 to-sky-600'
    ]
    return colors[index % colors.length]
  }

  const getSetIcon = (index: number) => {
    const icons = [
      <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24" key={index}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>,
      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24" key={index}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>,
      <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24" key={index}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>,
      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24" key={index}>
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
      </svg>
    ]
    return icons[index % icons.length]
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
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-secondary-800 mb-4">Error</h2>
        <p className="text-secondary-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 font-medium"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        <div className="relative z-10 text-center py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">
              AI<span className="text-blue-400">Forge</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Explora y construye mazos con inteligencia artificial
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link 
                to="/cards/search" 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Buscar Cartas
              </Link>
            </div>
          </div>
        </div>
      </div>

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
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.57M15 6.343A7.962 7.962 0 0112 4c-2.34 0-4.29 1.009-5.824 2.57" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No se encontraron sets
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                No hay sets que coincidan con "{searchTerm}"
              </p>
              <button 
                onClick={() => setSearchTerm('')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                  className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden"
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
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
