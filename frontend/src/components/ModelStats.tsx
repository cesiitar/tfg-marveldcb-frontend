// Cifras reales del último entrenamiento del modelo de IA (GET /api/model/stats).
// El prerender (seo/prerender.mjs) genera el mismo bloque en el HTML estático.
import React, { useEffect, useState } from 'react'
import { apiService, type ModelStats as ModelStatsData } from '../services/api'

const pct = (n?: number) => `${Math.round((n || 0) * 100)} %`

const ModelStats: React.FC = () => {
  const [stats, setStats] = useState<ModelStatsData | null>(null)

  useEffect(() => {
    apiService.getModelStats().then(setStats).catch(() => setStats(null))
  }, [])

  if (!stats?.available) return null

  const trainedAt = stats.trained_at
    ? new Date(stats.trained_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const figures = [
    { label: 'Partidas de entrenamiento', value: String(stats.games ?? 0) },
    { label: 'Acierto en prueba', value: pct(stats.accuracy_test) },
    { label: 'Héroes', value: String(stats.heroes ?? 0) },
    { label: 'Villanos', value: String(stats.villains ?? 0) },
  ]

  return (
    <div className="mt-5 rounded-xl bg-ink-50 ring-1 ring-ink-900/[0.06] p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">El modelo en cifras</p>
      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {figures.map((f) => (
          <div key={f.label}>
            <dd className="font-display text-2xl font-extrabold text-ink-900 tabular-nums">{f.value}</dd>
            <dt className="text-xs text-ink-500">{f.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-ink-600 leading-relaxed">
        {trainedAt ? `Último entrenamiento: ${trainedAt}. ` : ''}
        El acierto se mide sobre {stats.n_test} partidas que el modelo no vio al entrenar ({stats.n_train} se usaron para
        entrenarlo). Con una muestra de este tamaño la cifra es orientativa y cambia cada vez que se registran partidas nuevas.
      </p>
    </div>
  )
}

export default ModelStats
