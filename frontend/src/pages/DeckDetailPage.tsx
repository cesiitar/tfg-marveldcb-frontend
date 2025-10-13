import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiService } from '../services/api'
import { Deck } from '../types/card'
import { getClassPillClasses } from '../utils/classColors'

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

  const totalCards = deck.cards.reduce((sum, c) => sum + (c.quantity as number), 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 md:p-8">
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

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Cartas ({totalCards})</h2>
            <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-200">
              {deck.cards.map((c: any, idx: number) => (
                <div key={c.name || idx} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-gray-800">{c.name}</span>
                  <span className="px-2 py-0.5 rounded bg-white border text-gray-700">x{c.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Información</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Creador: {deck.creator_name || 'Anónimo'}</div>
                <div>Cartas totales: {totalCards}</div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h2>
              <p className="text-sm text-gray-700">Pronto añadiremos descripción, comentarios y gráficos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeckDetailPage


