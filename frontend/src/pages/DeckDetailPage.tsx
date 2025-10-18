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
      return 'bg-slate-500'
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">Cargando mazo...</div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center text-red-600">{error || 'Mazo no encontrado'}</div>
      </div>
    )
  }

  const formattedDate = deck.created_at ? new Date(deck.created_at).toLocaleDateString() : 'Fecha desconocida'
  const totalCards = deck.cards.reduce((sum, c) => sum + (c.quantity as number), 0)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{deck.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Héroe: {deck.hero_name}</span>
              {(deck as any).aspect && (
                <span className={`px-2 py-0.5 rounded-full ${getClassPillClasses((deck as any).aspect)}`}>{(deck as any).aspect}</span>
              )}
              {deck.created_at && (
                <span className="text-gray-500">{new Date(deck.created_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <Link className="text-blue-600 hover:text-blue-700 text-sm" to="/decks">← Volver a Decklists</Link>
        </div>

        <div className="mt-4 grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Estadísticas y gráficos */}
          <div className="lg:col-span-1">
            {/* Información del mazo */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Información del Mazo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Héroe:</span>
                  <span className="font-medium">{deck.hero_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aspecto:</span>
                  <span className="font-medium capitalize">{(deck as any).aspect || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total cartas:</span>
                  <span className="font-medium">{totalCards}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Creado:</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <span className="text-gray-600 text-xs">Descripción:</span>
                  <p className="text-sm text-gray-700 mt-1">
                    {deck.description ? deck.description : 'Sin descripción'}
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas de cartas */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Distribución de Cartas</h3>
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
                  <div className="space-y-3">
                    {aspectStats.map(({ clase, count, percentage }) => (
                      <div key={clase} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getClassColor(clase)}`}></div>
                          <span className="text-sm font-medium capitalize">{clase}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getClassColor(clase)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Gráfico de tipos de cartas */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tipos de Cartas</h3>
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
                  <div className="space-y-2">
                    {sortedTypes.map(({ type, count }) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full"
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
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                <h2 className="text-lg font-semibold text-gray-800">Lista de Cartas ({totalCards})</h2>
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

          {/* Columna derecha - Información y comentarios */}
          <div className="space-y-4">
            {/* Información del mazo */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-gray-600">Creador:</span>
                  <span className="text-xs text-gray-800">{deck.creator_name || 'Anónimo'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-gray-600">Cartas:</span>
                  <span className="text-xs text-gray-800 font-semibold">{totalCards}/50</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-gray-600">Fecha:</span>
                  <span className="text-xs text-gray-800">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descripción
              </h2>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Pronto añadiremos descripción, comentarios y gráficos estadísticos para este mazo.
                </p>
              </div>
            </div>

            {/* Placeholder para comentarios */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comentarios
              </h2>
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Los comentarios estarán disponibles próximamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeckDetailPage


 