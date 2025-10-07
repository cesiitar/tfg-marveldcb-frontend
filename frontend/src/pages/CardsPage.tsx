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
      'from-red-50 to-red-100 border-red-200',
      'from-blue-50 to-blue-100 border-blue-200',
      'from-yellow-50 to-yellow-100 border-yellow-200',
      'from-green-50 to-green-100 border-green-200',
      'from-purple-50 to-purple-100 border-purple-200',
      'from-orange-50 to-orange-100 border-orange-200',
      'from-teal-50 to-teal-100 border-teal-200',
      'from-pink-50 to-pink-100 border-pink-200'
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
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-display font-bold text-primary-800 mb-4">Cartas</h1>
        <p className="text-xl text-secondary-600 mb-8">
          Explora las cartas organizadas por set/expansión
        </p>
        <Link 
          to="/cards/search" 
          className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 font-medium"
        >
          Buscar Cartas
        </Link>
      </div>

      {/* Buscador de Sets */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            🔍 Buscar Sets
          </h2>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por inicio del nombre..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <div className="mt-3 text-center">
              <span className="text-sm text-gray-600">
                {filteredSets.length} set{filteredSets.length !== 1 ? 's' : ''} encontrado{filteredSets.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {filteredSets.length === 0 && searchTerm ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.57M15 6.343A7.962 7.962 0 0112 4c-2.34 0-4.29 1.009-5.824 2.57" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-secondary-600 mb-2">
            No se encontraron sets
          </h3>
          <p className="text-secondary-500 mb-4">
            No hay sets que coincidan con "{searchTerm}"
          </p>
          <button 
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSets.map((set, index) => (
            <Link 
              key={set.id}
              to={`/cards/set/${set.id}`}
              className={`bg-gradient-to-br ${getSetColor(index)} rounded-lg p-4 shadow-md border-2 hover:shadow-lg transition-all duration-300 hover:scale-105`}
            >
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  <span className="text-sm font-bold text-secondary-700">
                    {set.id}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-display font-bold text-secondary-800 leading-tight">
                    {set.name}
                  </h2>
                  <p className="text-sm text-secondary-600">
                    {set.cardCount} cartas
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-secondary-500">
                  Ver cartas
                </span>
                <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

    
    </div>
  )
}

export default CardsPage
