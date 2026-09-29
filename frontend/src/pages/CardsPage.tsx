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
import { ArrowRightIcon, CardsThreeIcon, MagnifyingGlassIcon, SmileySadIcon, WarningIcon } from '@phosphor-icons/react'
import { AnimatedNumber } from '../components/ui/animated-number'
import { Reveal } from '../components/motion/reveal'
import { TiltCard } from '../components/motion/tilt-card'
import { usePageMeta } from '../lib/seo'
import pageMeta from '../lib/page-meta.json'

const CardsPage: React.FC = () => {
  usePageMeta(pageMeta.cards)
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

  // Datos derivados solo para la presentación (barra de tamaño y cifras de la cabecera)
  const maxCards = Math.max(1, ...sets.map((s) => s.cardCount || 0))
  const totalCards = sets.reduce((sum, s) => sum + (s.cardCount || 0), 0)

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
          className="btn btn-primary"
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
          <div className="mt-6 flex items-center gap-6">
            <div>
              <AnimatedNumber value={sets.length} className="block font-display text-3xl font-extrabold text-white leading-none" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">Sets</span>
            </div>
            <span className="h-9 w-px bg-white/15" aria-hidden="true" />
            <div>
              <AnimatedNumber value={totalCards} className="block font-display text-3xl font-extrabold text-white leading-none" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">Cartas</span>
            </div>
          </div>
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
          {/* Barra de búsqueda de sets */}
          <div className="bg-white rounded-2xl p-2.5 shadow-lg ring-1 ring-ink-900/[0.06] mb-10 flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label className="relative flex-1">
              <span className="sr-only">Buscar sets por nombre</span>
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" weight="bold" aria-hidden="true" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar set por nombre: Core Set, Hulk, Mutant Genesis…"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl !bg-ink-50 border border-transparent text-ink-900 placeholder:text-ink-400"
              />
            </label>
            <div className="flex items-center justify-between sm:justify-end gap-3 px-2 sm:px-3">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-500 tabular-nums">
                {filteredSets.length} de {sets.length} sets
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Sets Grid */}
          {filteredSets.length === 0 && searchTerm ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-ink-100 ring-1 ring-ink-900/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <SmileySadIcon className="w-12 h-12 text-gray-400" weight="duotone" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                No se encontraron sets
              </h2>
              <p className="text-gray-500 mb-8 text-lg">
                No hay sets que coincidan con "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="btn btn-primary"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredSets.map((set, index) => (
                <Reveal key={set.id} delay={(index % 4) * 0.06} y={28}>
                  <Link to={`/cards/set/${set.id}`} className="group block h-full rounded-2xl">
                    <TiltCard
                      maxTilt={5}
                      spotlight="light"
                      className="h-full rounded-2xl bg-white ring-1 ring-ink-900/[0.07] shadow-sm hover:shadow-xl transition-shadow duration-300"
                    >
                      {/* Portada del set */}
                      <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${getSetColor(index)}`}>
                        <div className="absolute inset-0 halftone opacity-80" aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" aria-hidden="true" />
                        <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/85">
                          Set · {set.cardCount} cartas
                        </span>
                        <CardsThreeIcon
                          className="absolute left-4 bottom-4 w-8 h-8 text-white transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110"
                          weight="duotone"
                          aria-hidden="true"
                        />
                        <span
                          className="absolute -right-1 -bottom-7 font-display text-[7.5rem] leading-none font-extrabold text-transparent tabular-nums transition-transform duration-500 ease-out group-hover:-translate-x-2 group-hover:-translate-y-1"
                          style={{ WebkitTextStroke: '1.5px rgb(255 255 255 / 0.6)', fontStretch: '80%' }}
                          aria-hidden="true"
                        >
                          {String(set.id).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Información */}
                      <div className="relative p-5">
                        <h2 className="text-lg leading-tight text-ink-900 group-hover:text-brand-700 transition-colors duration-200">
                          {set.name}
                        </h2>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden" aria-hidden="true">
                            <div
                              className="h-full rounded-full bg-ink-800 group-hover:bg-brand-600 transition-colors duration-300"
                              style={{ width: `${Math.max(6, Math.round((set.cardCount / maxCards) * 100))}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-ink-500 tabular-nums">{set.cardCount}</span>
                        </div>
                        <div className="mt-5 flex items-center justify-between text-sm font-semibold text-ink-500 group-hover:text-brand-600 transition-colors duration-200">
                          <span>Ver cartas</span>
                          <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" weight="bold" aria-hidden="true" />
                        </div>
                      </div>
                    </TiltCard>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardsPage
