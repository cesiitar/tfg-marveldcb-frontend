import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { Card, CardSet } from '../types/card'
import { getClassGradientClasses, getClassBadgeStyle } from '../utils/classColors'
import { translateCardType } from '../utils/typeTranslations'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { ArrowsClockwiseIcon, CardsIcon, CaretDownIcon, CheckCircleIcon, MagnifyingGlassIcon, SmileySadIcon, TagIcon, TrashIcon } from '@phosphor-icons/react'

const CardSearchPage: React.FC = () => {
  // Cargar filtros desde localStorage al inicializar
  const loadFiltersFromStorage = () => {
    try {
      const savedName = localStorage.getItem('cardSearch_name') || ''
      const savedAspect = localStorage.getItem('cardSearch_aspect') || ''
      const savedType = localStorage.getItem('cardSearch_type') || ''
      const savedCost = localStorage.getItem('cardSearch_cost') || ''
      const savedSetName = localStorage.getItem('cardSearch_set_name') || ''
      const savedHasSearched = localStorage.getItem('cardSearch_hasSearched') === 'true'
      
      return {
        name: savedName,
        aspect: savedAspect,
        type: savedType,
        cost: savedCost,
        set_name: savedSetName,
        hasSearched: savedHasSearched
      }
    } catch (err) {
      console.error('Error cargando filtros desde localStorage:', err)
      return {
    name: '',
    aspect: '',
    type: '',
    cost: '',
        set_name: '',
        hasSearched: false
      }
    }
  }
  
  const initialFilters = loadFiltersFromStorage()
  const [searchForm, setSearchForm] = useState({
    name: initialFilters.name,
    aspect: initialFilters.aspect,
    type: initialFilters.type,
    cost: initialFilters.cost,
    set_name: initialFilters.set_name
  })
  
  const [sets, setSets] = useState<CardSet[]>([])
  const [searchResults, setSearchResults] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(initialFilters.hasSearched)
  
  // Guardar filtros en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('cardSearch_name', searchForm.name)
      localStorage.setItem('cardSearch_aspect', searchForm.aspect)
      localStorage.setItem('cardSearch_type', searchForm.type)
      localStorage.setItem('cardSearch_cost', searchForm.cost)
      localStorage.setItem('cardSearch_set_name', searchForm.set_name)
      localStorage.setItem('cardSearch_hasSearched', hasSearched.toString())
    } catch (err) {
      console.error('Error guardando filtros en localStorage:', err)
    }
  }, [searchForm.name, searchForm.aspect, searchForm.type, searchForm.cost, searchForm.set_name, hasSearched])

  // Cargar sets al montar el componente
  useEffect(() => {
    const loadSets = async () => {
      try {
        const setsData = await apiService.getSets()
        setSets(setsData)
      } catch (error) {
        console.error('Error loading sets:', error)
      }
    }
    loadSets()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const filters: any = {}
      
      if (searchForm.name.trim()) filters.name = searchForm.name.trim()
      if (searchForm.aspect) filters.aspect = searchForm.aspect
      if (searchForm.type) filters.type = searchForm.type
      if (searchForm.cost) filters.cost = parseInt(searchForm.cost)
      if (searchForm.set_name) filters.set_name = searchForm.set_name
      
      const results = await apiService.searchCards(filters)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching cards:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchForm({
      name: '',
      aspect: '',
      type: '',
      cost: '',
      set_name: ''
    })
    setSearchResults([])
    setHasSearched(false)
    // Limpiar también localStorage
    try {
      localStorage.removeItem('cardSearch_name')
      localStorage.removeItem('cardSearch_aspect')
      localStorage.removeItem('cardSearch_type')
      localStorage.removeItem('cardSearch_cost')
      localStorage.removeItem('cardSearch_set_name')
      localStorage.removeItem('cardSearch_hasSearched')
    } catch (err) {
      console.error('Error limpiando localStorage:', err)
    }
  }

  const getCardGradient = (clase: string) => {
    return getClassGradientClasses(clase)
  }

  return (
    <div className="space-y-8">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Catálogo</PageHeaderEyebrow>
          <PageHeaderTitle>Búsqueda de Cartas</PageHeaderTitle>
          <PageHeaderDescription>
            Encuentra las cartas perfectas para tu mazo
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Search Form */}
      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <MagnifyingGlassIcon className="w-7 h-7 mr-3 text-blue-600" weight="bold" aria-hidden="true" />
              Filtros de Búsqueda
            </h2>
            <p className="text-gray-600 mt-2">Encuentra las cartas perfectas para tu mazo</p>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-8">
            {/* Name */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <TagIcon className="w-5 h-5 mr-2 text-brand-600" weight="duotone" aria-hidden="true" />
                Nombre de la Carta
              </h3>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={searchForm.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Escribe el nombre de la carta..."
                />
                <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" weight="bold" aria-hidden="true" />
              </div>
            </div>

            {/* Aspect */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <TagIcon className="w-5 h-5 mr-2 text-brand-600" weight="duotone" aria-hidden="true" />
                Aspecto de la Carta
              </h3>
              <div className="flex flex-wrap gap-3">
                {['aggression', 'justice', 'leadership', 'protection', 'basic', 'campaign', 'hero', 'pool'].map((aspect) => (
                  <button
                    key={aspect}
                    type="button"
                    onClick={() => setSearchForm(prev => ({ ...prev, aspect: prev.aspect === aspect ? '' : aspect }))}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 capitalize ${
                      searchForm.aspect === aspect
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    {aspect}
                  </button>
                ))}
              </div>
            </div>

            {/* Type and Cost */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <CardsIcon className="w-5 h-5 mr-2 text-brand-600" weight="duotone" aria-hidden="true" />
                Tipo y Coste
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tipo de Carta
                  </label>
                  <div className="relative">
                    <select
                      name="type"
                      value={searchForm.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                    >
                      <option value="">Any</option>
                      <option value="hero">Hero</option>
                      <option value="ally">Ally</option>
                      <option value="event">Event</option>
                      <option value="upgrade">Upgrade</option>
                      <option value="support">Support</option>
                      <option value="resource">Resource</option>
                      <option value="attachment">Attachment</option>
                      <option value="environment">Environment</option>
                      <option value="minion">Minion</option>
                      <option value="obligation">Obligation</option>
                      <option value="side_scheme">Side Scheme</option>
                      <option value="treachery">Treachery</option>
                      <option value="villain">Villain</option>
                      <option value="main_scheme">Main Scheme</option>
                      <option value="evidence">Evidence</option>
                      <option value="player_side_scheme">Player Side Scheme</option>
                      <option value="alter_ego">Alter Ego</option>
                    </select>
                    <CaretDownIcon className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" weight="bold" aria-hidden="true" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Coste de la Carta
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={searchForm.cost}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Ej: 3"
                  />
                </div>
              </div>
            </div>

            {/* Set */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <CardsIcon className="w-5 h-5 mr-2 text-brand-600" weight="duotone" aria-hidden="true" />
                Set de Cartas
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Seleccionar Set
                </label>
                <div className="relative">
                  <select
                    name="set_name"
                    value={searchForm.set_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="">Cualquiera</option>
                    {sets.map((set) => (
                      <option key={set.id} value={set.name}>
                        {set.name} ({set.cardCount} cartas)
                      </option>
                    ))}
                  </select>
                  <CaretDownIcon className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" weight="bold" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={clearSearch}
                className="px-8 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center"
              >
                <TrashIcon className="w-5 h-5 mr-2" weight="duotone" aria-hidden="true" />
                Limpiar Filtros
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-10 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Buscando...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-5 h-5 mr-2" weight="bold" aria-hidden="true" />
                    Buscar Cartas
                  </>
                )}
              </button>
            </div>
            </form>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <CheckCircleIcon className="w-7 h-7 mr-3 text-brand-600" weight="duotone" aria-hidden="true" />
            Resultados de la Búsqueda
          </h3>
          {hasSearched && (
            <span className="bg-green-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full">
              {searchResults.length} cartas encontradas
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowsClockwiseIcon className="w-8 h-8 text-gray-400 animate-spin" weight="bold" aria-hidden="true" />
            </div>
            <h4 className="text-lg font-semibold text-secondary-600 mb-2">
              Buscando cartas...
            </h4>
            <p className="text-secondary-500">
              Por favor espera mientras procesamos tu búsqueda
            </p>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-16 text-secondary-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" weight="bold" aria-hidden="true" />
            </div>
            <h4 className="text-lg font-semibold text-secondary-600 mb-2">
              No hay resultados aún
            </h4>
            <p className="text-secondary-500">
              Los resultados de tu búsqueda aparecerán aquí
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-16 text-secondary-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SmileySadIcon className="w-8 h-8 text-gray-400" weight="duotone" aria-hidden="true" />
            </div>
            <h4 className="text-lg font-semibold text-secondary-600 mb-2">
              No se encontraron cartas
            </h4>
            <p className="text-secondary-500">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((card, index) => (
              <div key={index} className={`bg-gradient-to-br ${getCardGradient(card.clase)} border-2 rounded-xl p-5 hover:shadow-lg hover:scale-105 transition-all duration-300 hover:-translate-y-1`}>
                <h4 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2">{card.name}</h4>
                
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Set:</span>
                    <span className="font-medium text-sm text-ink-700 bg-ink-100 px-2 py-1 rounded-full">
                      {card.set}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CardSearchPage

