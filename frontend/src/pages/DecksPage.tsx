import React, { useMemo, useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { getClassPillClasses } from '../utils/classColors'

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [heroFilter, setHeroFilter] = useState('')
  const [aspectFilter, setAspectFilter] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const decksData = await apiService.getDecks()
        setDecks(decksData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getDeckHeroName = (d: Deck): string | undefined => d.hero_name
  const getDeckAspect = (d: Deck): string | undefined => (d as any).aspect

  const availableHeroes = useMemo(() => {
    const set = new Set<string>()
    decks.forEach(d => { const h = getDeckHeroName(d); if (h) set.add(h) })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [decks])

  const availableAspects = useMemo(() => {
    const set = new Set<string>()
    decks.forEach(d => { const a = getDeckAspect(d); if (a) set.add(a) })
    // Si el backend aún no manda aspect, ofrecemos las 4 por defecto
    const base = ['aggression', 'justice', 'leadership', 'protection']
    const derived = Array.from(set)
    const merged = new Set([...base, ...derived])
    return Array.from(merged).sort((a, b) => a.localeCompare(b))
  }, [decks])

  const filteredDecks = useMemo(() => {
    return decks.filter(d => {
      const matchesText = !search || d.name.toLowerCase().includes(search.toLowerCase())
      const matchesHero = !heroFilter || getDeckHeroName(d) === heroFilter
      const matchesAspect = !aspectFilter || getDeckAspect(d) === aspectFilter
      return matchesText && matchesHero && matchesAspect
    })
  }, [decks, search, heroFilter, aspectFilter])

  const getHeroColor = (index: number) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mazos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        <div className="relative z-10 text-center py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">
              Decklists Públicos
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Explora los mazos públicos de Marvel Champions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre de mazo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <select
                value={heroFilter}
                onChange={(e) => setHeroFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todos los héroes</option>
                {availableHeroes.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <select
                value={aspectFilter}
                onChange={(e) => setAspectFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todos los aspectos</option>
                {availableAspects.map(a => (
                  <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Decks Grid */}
          {filteredDecks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No hay mazos que coincidan
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                Ajusta los filtros o limpia la búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDecks.map((deck, index) => (
                <div 
                  key={deck.id}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden"
                >
                  {/* Header with subtle gradient */}
                  <div className={`h-1.5 bg-gradient-to-r ${getHeroColor(index)}`}></div>
                  
                  <div className="p-5">
                    <div className="mb-2">
                      <h3 className="text-base font-semibold text-gray-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                        {deck.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Héroe: {getDeckHeroName(deck) || '—'}
                        </span>
                        {getDeckAspect(deck) && (
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${getClassPillClasses(getDeckAspect(deck))}`}>
                            {getDeckAspect(deck)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{deck.cards.length} cartas</span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {deck.creator_name || 'Anónimo'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
                        </svg>
                        {deck.created_at ? new Date(deck.created_at).toLocaleDateString() : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-600 group-hover:text-blue-700 cursor-pointer" onClick={() => window.location.href = `/decks/${deck.id}` }>
                        Ver detalles
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DecksPage
