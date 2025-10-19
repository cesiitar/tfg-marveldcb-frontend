import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { getClassPillClasses } from '../utils/classColors'

const getClassColor = (clase: string): string => {
  const c = clase.toLowerCase()
  switch (c) {
    case 'aggression':
      return 'bg-red-500'
    case 'justice':
      return 'bg-amber-500'
    case 'leadership':
      return 'bg-blue-500'
    case 'protection':
      return 'bg-emerald-500'
    case 'hero':
      return 'bg-violet-500'
    case 'encounter':
      return 'bg-red-700'
    case 'campaign':
      return 'bg-indigo-500'
    case 'basic':
    default:
      return 'bg-gray-400'
  }
}

const DeckDetailPage: React.FC = () => {
  const { id } = useParams()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDeck = async () => {
      try {
        setLoading(true)
        setError(null)
        const d = await apiService.getDeckById(Number(id))
        console.log('🔍 Deck recibido del backend:', d)
        console.log('🔍 Descripción:', d.description)
        setDeck(d)
      } catch (err) {
        setError('No se pudo cargar el mazo')
      } finally {
        setLoading(false)
      }
    }
    loadDeck()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mazo...</p>
        </div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Mazo no encontrado'}</p>
          <Link 
            to="/decks" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Decklists
          </Link>
        </div>
      </div>
    )
  }

  const totalCards = deck.cards.reduce((sum, c) => sum + (c.quantity as number), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{deck.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-blue-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{deck.hero_name}</span>
                  </div>
                  {(deck as any).aspect && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium capitalize">{(deck as any).aspect}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m-6 0l-3 3m3-3l3 3m-3-3v10a2 2 0 002 2h2a2 2 0 002-2V7" />
                    </svg>
                    <span className="font-medium">{totalCards} cartas</span>
                  </div>
                  {deck.created_at && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m-6 0l-3 3m3-3l3 3m-3-3v10a2 2 0 002 2h2a2 2 0 002-2V7" />
                      </svg>
                      <span>{new Date(deck.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <Link 
                to="/decks" 
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Decklists
              </Link>
            </div>
          </div>
          
          {/* Información adicional en el header */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Creador:</span>
                <span className="font-medium text-gray-900">{deck.creator_name || 'Anónimo'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-gray-900">{totalCards}/50 cartas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Descripción y estadísticas */}
          <div className="lg:col-span-1 space-y-6">
            {/* Descripción del mazo */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descripción
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {deck.description || 'Sin descripción'}
              </p>
            </div>

            {/* Estadísticas de cartas */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Distribución por Clase
              </h3>
              {(() => {
                const stats = deck.cards.reduce((acc: any, card: any) => {
                  const clase = card.clase || 'basic'
                  acc[clase] = (acc[clase] || 0) + card.quantity
                  return acc
                }, {})

                const aspectStats = Object.entries(stats).map(([clase, count]) => ({
                  clase,
                  count: count as number,
                  percentage: Math.round(((count as number) / totalCards) * 100)
                })).sort((a, b) => b.count - a.count)

                return (
                  <div className="space-y-4">
                    {aspectStats.map(({ clase, count, percentage }) => (
                      <div key={clase} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${getClassColor(clase)}`}></div>
                          <span className="text-sm font-medium capitalize">{clase}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getClassColor(clase)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                          <span className="text-xs text-gray-500 w-8 text-right">{percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Gráfico de tipos de cartas */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tipos de Cartas
              </h3>
              {(() => {
                const typeStats = deck.cards.reduce((acc: any, card: any) => {
                  const type = card.type || 'unknown'
                  acc[type] = (acc[type] || 0) + card.quantity
                  return acc
                }, {})

                const sortedTypes = Object.entries(typeStats)
                  .map(([type, count]) => ({ type, count: count as number }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 6) // Mostrar solo los 6 tipos más comunes

                return (
                  <div className="space-y-3">
                    {sortedTypes.map(({ type, count }) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                              style={{ width: `${(count / totalCards) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-600 w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Columna derecha - Lista de cartas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Lista de Cartas ({totalCards})
                </h2>
              </div>
              
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {(() => {
                  // Agrupar cartas por tipo
                  const cardsByType = deck.cards.reduce((acc: any, c: any) => {
                    const cardName = c.card_name || c.name || 'Carta sin nombre'
                    const cardType = c.type || 'unknown'
                    const cardClase = c.clase || 'basic'
                    const cardSet = c.set || 'Set desconocido'
                    if (!acc[cardType]) acc[cardType] = []
                    acc[cardType].push({ name: cardName, quantity: c.quantity, clase: cardClase, set: cardSet })
                    return acc
                  }, {})

                  const typeOrder = ['hero', 'ally', 'event', 'upgrade', 'support', 'resource', 'player_side_scheme', 'attachment', 'environment', 'minion', 'obligation', 'side_scheme', 'treachery', 'villain', 'main_scheme', 'evidence']
                  const typeLabels: { [key: string]: string } = {
                    hero: 'Hero',
                    ally: 'Ally',
                    event: 'Event',
                    upgrade: 'Upgrade',
                    support: 'Support',
                    resource: 'Resource',
                    player_side_scheme: 'Player Side Scheme',
                    attachment: 'Attachment',
                    environment: 'Environment',
                    minion: 'Minion',
                    obligation: 'Obligation',
                    side_scheme: 'Side Scheme',
                    treachery: 'Treachery',
                    villain: 'Villain',
                    main_scheme: 'Main Scheme',
                    evidence: 'Evidence'
                  }

                  return Object.keys(cardsByType)
                    .sort((a, b) => {
                      const aIndex = typeOrder.indexOf(a)
                      const bIndex = typeOrder.indexOf(b)
                      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
                      if (aIndex === -1) return 1
                      if (bIndex === -1) return -1
                      return aIndex - bIndex
                    })
                    .map(type => {
                      const cards = cardsByType[type]
                      const typeLabel = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)
                      
                      return (
                        <div key={type} className="mb-3 last:mb-0">
                          <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full mr-2">
                              {cards.length}
                            </span>
                            {typeLabel} ({cards.length})
                          </h3>
                          
                          <div className="space-y-0.5">
                            {cards.map((card: any, idx: number) => {
                              const isHeroCard = card.clase === 'hero' || card.type === 'hero'
                              const isBasic = card.clase === 'basic'
                              return (
                                <div key={`${card.name}-${idx}`} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 transition-colors rounded text-sm group relative">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <span className="text-xs font-medium text-gray-600 min-w-[1.2rem]">
                                      {card.quantity}x
                                    </span>
                                    
                                    {/* Indicador de carta automática del héroe */}
                                    {isHeroCard && (
                                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full flex-shrink-0" title="Carta automática del héroe"></div>
                                    )}
                                    
                                    {/* Punto de color según clase */}
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getClassColor(card.clase)}`}></div>
                                    
                                    <span 
                                      className="text-gray-800 font-medium truncate cursor-help" 
                                      title={`Set: ${card.set}`}
                                    >
                                      {card.name}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    {isBasic && (
                                      <span className="text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-600">
                                        basic
                                      </span>
                                    )}
                                    {card.clase && card.clase !== 'basic' && (
                                      <span className={`text-xs px-1 py-0.5 rounded-full ${getClassPillClasses(card.clase)}`}>
                                        {card.clase}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeckDetailPage