import React from 'react'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { useToast } from '../components/Toast'
import { Deck } from '../types/card'
import { getClassColor, getClassPillClasses } from '../utils/classColors'
import { CardFan } from '../components/home/card-fan'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { AnimatedNumber } from '../components/ui/animated-number'
import { InfoIcon, SparkleIcon, XIcon } from '@phosphor-icons/react'

import { usePageMeta } from '../lib/seo'

const AIRecommendationPage: React.FC = () => {
  usePageMeta({ title: 'Recomendación con IA', noindex: true })
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  
  const [villains, setVillains] = useState<{ id: number; name: string }[]>([])
  const [selectedVillainId, setSelectedVillainId] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<'normal' | 'expert'>('normal')
  const [selectedPatches] = useState<string[]>([]) // Placeholder para parches
  const [loadingVillains, setLoadingVillains] = useState(true)
  const [generatingDeck, setGeneratingDeck] = useState(false)
  const [generatedDecks, setGeneratedDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [totalGenerated, setTotalGenerated] = useState<number>(0)
  const [totalRequested, setTotalRequested] = useState<number>(3)
  const [error, setError] = useState<string | null>(null)
  const [deckName, setDeckName] = useState<string>('')
  const [deckDescription, setDeckDescription] = useState<string>('')
  const [maxDecks, setMaxDecks] = useState<number>(3)

  // Cargar villanos al montar
  useEffect(() => {
    const loadVillains = async () => {
      try {
        setLoadingVillains(true)
        const villainsData = await apiService.getVillainsWithIds()
        setVillains(villainsData)
      } catch (err) {
        console.error('Error cargando villanos:', err)
        setError('Error al cargar la lista de villanos')
        showToast('Error al cargar la lista de villanos', 'error')
      } finally {
        setLoadingVillains(false)
      }
    }

    loadVillains()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerateDeck = async () => {
    if (!selectedVillainId) {
      showToast('Por favor, selecciona un villano', 'error')
      return
    }

    if (!isAuthenticated || !user?.sub) {
      showToast('Debes estar autenticado para generar un mazo', 'error')
      return
    }

    setGeneratingDeck(true)
    setError(null)

    try {
      // Llamar al endpoint de generación de mazo basado en villano
      const response = await apiService.generateDeckForVillain(
        {
          villain_id: selectedVillainId,
          difficulty: difficulty,
          patches: selectedPatches, // Por ahora vacío, se implementará después
          max_decks: maxDecks  // Número de mazos a generar (1-4)
        },
        user.sub
      )

      // Validar que la respuesta tenga el formato esperado
      if (!response || !response.decks || !Array.isArray(response.decks)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }

      setGeneratedDecks(response.decks)
      setTotalGenerated(response.total_generated ?? response.decks.length)
      setTotalRequested(response.total_requested ?? maxDecks)
      setSelectedDeck(null)  // Resetear selección
      // Inicializar nombre y descripción como vacíos para que el usuario los complete
      setDeckName('')
      setDeckDescription('')
      
      const decksCount = response.decks.length
      showToast(`${decksCount} mazo(s) generado(s) exitosamente`, 'success')
    } catch (err: any) {
      console.error('Error generando mazo:', err)
      let errorMessage = err.message || 'Error al generar el mazo con IA'
      
      // Mensajes más específicos según el tipo de error
      if (errorMessage.includes('no disponible') || errorMessage.includes('503')) {
        errorMessage = 'Modelo de IA no disponible. Necesita ser entrenado primero o no hay suficientes datos.'
      } else if (errorMessage.includes('404') || errorMessage.includes('no encontrado')) {
        errorMessage = 'Villano no encontrado. Por favor, selecciona otro villano.'
      } else if (errorMessage.includes('401') || errorMessage.includes('autenticado')) {
        errorMessage = 'Debes estar autenticado para generar un mazo.'
      } else if (errorMessage.includes('400') || errorMessage.includes('inválid')) {
        errorMessage = 'Datos inválidos. Por favor, verifica la dificultad seleccionada.'
      }
      
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setGeneratingDeck(false)
    }
  }

  const handleSelectDeck = (deck: Deck) => {
    // Si ya está seleccionado, deseleccionarlo
    if (selectedDeck && 
        selectedDeck.hero_id === deck.hero_id && 
        selectedDeck.aspect === deck.aspect &&
        selectedDeck.cards.length === deck.cards.length) {
      setSelectedDeck(null)
      setDeckName('')
      setDeckDescription('')
    } else {
      setSelectedDeck(deck)
      setDeckName('')
      setDeckDescription('')
    }
  }

  const handleUseDeck = async () => {
    if (!selectedDeck || !user?.sub) {
      showToast('Por favor, selecciona un mazo', 'error')
      return
    }
    
    // Validar que nombre y descripción estén rellenados
    if (!deckName.trim()) {
      showToast('Por favor, ingresa un nombre para el mazo', 'error')
      return
    }
    
    if (!deckDescription.trim()) {
      showToast('Por favor, ingresa una descripción para el mazo', 'error')
      return
    }
    
    // Si el mazo no tiene ID, guardarlo primero
    if (!selectedDeck.id) {
      // Validar nombre duplicado antes de crear el mazo (globalmente, case-insensitive)
      try {
        const allDecks = await apiService.getDecks()
        const normalizedNewName = deckName.trim().toLowerCase()
        const duplicateDeck = allDecks.find(deck => 
          deck.name.trim().toLowerCase() === normalizedNewName
        )
        
        if (duplicateDeck) {
          showToast(`Ya existe un mazo con el nombre "${deckName}". Por favor, elige otro nombre.`, 'error')
          return
        }
      } catch (err) {
        console.error('Error verificando nombres duplicados:', err)
        // Continuar con la creación si falla la verificación (no bloquear)
      }
      
      try {
        setGeneratingDeck(true)
        const savedDeck = await apiService.createDeck(
          {
            name: deckName.trim(),
            description: deckDescription.trim(),
            hero_name: selectedDeck.hero_name,
            hero_id: selectedDeck.hero_id,
            aspect: selectedDeck.aspect,
            cards: selectedDeck.cards
          },
          user.sub
        )
        showToast('Mazo guardado exitosamente', 'success')
        navigate(`/decks/${savedDeck.id}`)
      } catch (err: any) {
        console.error('Error guardando mazo:', err)
        showToast('Error al guardar el mazo', 'error')
      } finally {
        setGeneratingDeck(false)
      }
    } else {
      // Si ya tiene ID, navegar directamente
      navigate(`/decks/${selectedDeck.id}`)
    }
  }

  const stepLabel = (n: number, text: string) => (
    <h2 className="flex items-center gap-3 text-base text-ink-900">
      <span className="w-6 h-6 rounded-full bg-ink-900 text-white text-xs font-bold flex items-center justify-center tabular-nums" aria-hidden="true">
        {n}
      </span>
      {text}
    </h2>
  )

  const resetSelection = () => {
    setSelectedDeck(null)
    setDeckName('')
    setDeckDescription('')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] space-y-8">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderEyebrow>Inteligencia artificial</PageHeaderEyebrow>
            <PageHeaderTitle>Recomendación de IA</PageHeaderTitle>
            <PageHeaderDescription>
              Selecciona un villano y genera un mazo optimizado con inteligencia artificial
            </PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-900/[0.06] p-8 text-center max-w-lg mx-auto">
          <h2 className="text-xl text-ink-900 mb-2">Inicia sesión para usar la IA</h2>
          <p className="text-ink-500">
            La recomendación usa tus partidas y guarda los mazos en tu cuenta. Inicia sesión con el botón de la parte superior.
          </p>
        </div>
      </div>
    )
  }

  const showSkeleton = generatingDeck && generatedDecks.length === 0

  return (
    <div className="min-h-[60vh]">
      <PageHeader className="mb-8">
        <PageHeaderContent>
          <PageHeaderEyebrow>Inteligencia artificial</PageHeaderEyebrow>
          <PageHeaderTitle>Recomendación de IA</PageHeaderTitle>
          <PageHeaderDescription>
            Selecciona un villano y genera un mazo optimizado con inteligencia artificial
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12 items-start">
        {/* Configuración */}
        <section className="lg:col-span-5 lg:sticky lg:top-20 bg-white rounded-2xl shadow-sm ring-1 ring-ink-900/[0.06] divide-y divide-ink-100">
          <div className="p-6">
            {stepLabel(1, 'Elige el villano')}
            {loadingVillains ? (
              <div className="mt-4 h-12 rounded-xl bg-ink-100 animate-pulse" />
            ) : (
              <select
                value={selectedVillainId || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value)
                  setSelectedVillainId(id || null)
                }}
                className="mt-4 w-full px-4 py-3 rounded-xl border border-ink-200 text-base text-ink-900"
                aria-label="Villano"
              >
                <option value="">Selecciona un villano...</option>
                {villains.map((villain) => (
                  <option key={villain.id} value={villain.id}>
                    {villain.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <fieldset className="p-6">
            <legend className="sr-only">Dificultad</legend>
            {stepLabel(2, 'Dificultad')}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([
                { value: 'normal', label: 'Normal', hint: 'Dificultad estándar' },
                { value: 'expert', label: 'Experto', hint: 'Mayor desafío' },
              ] as const).map((opt) => {
                const active = difficulty === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`relative cursor-pointer rounded-xl p-4 ring-1 ring-inset transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-500 ${
                      active ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-900 ring-ink-200 hover:ring-ink-300 hover:bg-ink-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={opt.value}
                      checked={active}
                      onChange={(e) => setDifficulty(e.target.value as 'normal' | 'expert')}
                      className="sr-only"
                    />
                    <span className="block font-semibold">{opt.label}</span>
                    <span className={`block text-sm ${active ? 'text-ink-300' : 'text-ink-500'}`}>{opt.hint}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="p-6">
            {stepLabel(3, 'Número de mazos')}
            <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="Número de mazos a generar">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxDecks(n)}
                  aria-pressed={maxDecks === n}
                  className={`relative h-12 rounded-xl font-display text-lg font-extrabold tabular-nums ring-1 ring-inset transition-colors duration-200 ${
                    maxDecks === n ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-500">
              Recomendado: 3. Los mazos se ordenan por probabilidad de victoria.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <button
              onClick={handleGenerateDeck}
              disabled={!selectedVillainId || generatingDeck}
              className="btn btn-primary btn-lg w-full"
            >
              {generatingDeck ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando mazo...
                </>
              ) : (
                <>
                  <SparkleIcon className="w-5 h-5" weight="fill" aria-hidden="true" />
                  {`Generar ${maxDecks} mazo${maxDecks > 1 ? 's' : ''} con IA`}
                </>
              )}
            </button>
            {!selectedVillainId && (
              <p className="text-center text-sm text-ink-400">Elige un villano para activar la generación.</p>
            )}
            <p className="flex items-start gap-2 text-xs text-ink-400">
              <InfoIcon className="w-4 h-4 flex-shrink-0" weight="duotone" aria-hidden="true" />
              Pronto podrás limitar la IA a los parches y cartas de tu colección. Por ahora usa todas las cartas.
            </p>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-200" role="alert">
                <p className="text-sm font-semibold text-red-800">No se pudo completar</p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            )}
          </div>
        </section>

        {/* Resultados */}
        <div className="lg:col-span-7 space-y-5">
          {showSkeleton ? (
            <div className="space-y-4" aria-live="polite" aria-busy="true">
              <p className="text-sm font-medium text-ink-500">Analizando partidas y combinaciones...</p>
              {Array.from({ length: maxDecks }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-ink-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-ink-100" />
                      <div className="h-3 w-1/4 rounded bg-ink-100" />
                    </div>
                    <div className="h-8 w-16 rounded bg-ink-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : generatedDecks.length > 0 ? (
            <>
              {totalGenerated < totalRequested && (
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-inset ring-amber-200">
                  <InfoIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" weight="duotone" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Se generaron {totalGenerated} de {totalRequested} mazos solicitados
                    </p>
                    <p className="text-sm text-amber-800 mt-0.5">
                      {totalGenerated === 1
                        ? 'Solo hay una combinación disponible con datos históricos.'
                        : `Solo hay ${totalGenerated} combinaciones disponibles con datos históricos.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-end justify-between">
                <h2 className="text-2xl text-ink-900">Mazos generados</h2>
                <span className="text-sm text-ink-500">Toca uno para personalizarlo</span>
              </div>

              <ol className="space-y-3">
                {generatedDecks.map((deck, index) => {
                  const winProbability = deck.win_probability ?? null
                  const isSelected = !!selectedDeck &&
                    selectedDeck.hero_id === deck.hero_id &&
                    selectedDeck.aspect === deck.aspect &&
                    selectedDeck.cards.length === deck.cards.length
                  const pct = winProbability !== null ? Math.round(winProbability * 100) : null

                  return (
                    <li key={index}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => handleSelectDeck(deck)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSelectDeck(deck)
                          }
                        }}
                        className={`group relative flex items-center gap-4 md:gap-6 rounded-2xl bg-white p-5 md:p-6 cursor-pointer ring-1 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                          isSelected ? 'ring-2 ring-brand-600 shadow-lg' : 'ring-ink-900/[0.06] shadow-sm'
                        }`}
                      >
                        <span
                          className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center font-display text-lg font-extrabold tabular-nums ${
                            index === 0 ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'
                          }`}
                          aria-label={`Opción ${index + 1}`}
                        >
                          {index + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-ink-900 truncate">{deck.hero_name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                            {deck.aspect && (
                              <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${getClassPillClasses(deck.aspect)}`}>
                                {deck.aspect}
                              </span>
                            )}
                            <span className="tabular-nums">{deck.cards.reduce((sum, card) => sum + card.quantity, 0)} cartas</span>
                            {index === 0 && <span className="font-semibold text-brand-700">Mejor opción</span>}
                          </div>
                        </div>

                        {pct !== null && (
                          <div className="w-28 md:w-36 flex-shrink-0 text-right">
                            <AnimatedNumber
                              value={pct}
                              format={(n) => `${n}%`}
                              className="block font-display text-3xl font-extrabold text-ink-900 leading-none"
                            />
                            <p className="mt-1 text-xs text-ink-500">prob. de victoria</p>
                            <div className="mt-2 h-1.5 rounded-full bg-ink-100 overflow-hidden" aria-hidden="true">
                              <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>

              {selectedDeck && (
                <section className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.06] overflow-hidden animate-rise-in">
                  <div className="flex items-center justify-between gap-4 bg-ink-900 halftone px-6 py-5 text-white">
                    <div className="min-w-0">
                      <h2 className="text-2xl text-white">Personaliza el mazo</h2>
                      <p className="mt-1 text-sm text-ink-300 truncate">
                        {selectedDeck.hero_name}
                        {selectedDeck.aspect && <span className="capitalize"> · {selectedDeck.aspect}</span>}
                        {selectedDeck.win_probability !== null && selectedDeck.win_probability !== undefined && (
                          <> · {Math.round(selectedDeck.win_probability * 100)}% de victoria</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={resetSelection}
                      className="p-2 rounded-lg text-ink-300 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Cerrar personalización"
                      title="Cerrar"
                    >
                      <XIcon className="w-5 h-5" weight="bold" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label htmlFor="ai-deck-name" className="block text-sm font-semibold text-ink-800 mb-2">
                        Nombre del mazo <span className="text-brand-600">*</span>
                      </label>
                      <input
                        id="ai-deck-name"
                        type="text"
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        placeholder="Por ejemplo: Spider-Man contra Rhino"
                        className="w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="ai-deck-desc" className="block text-sm font-semibold text-ink-800 mb-2">
                        Descripción <span className="text-brand-600">*</span>
                      </label>
                      <textarea
                        id="ai-deck-desc"
                        value={deckDescription}
                        onChange={(e) => setDeckDescription(e.target.value)}
                        placeholder="Cuenta la estrategia del mazo..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-ink-200 resize-none text-ink-900"
                      />
                    </div>

                    <p className="flex items-start gap-2 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
                      <SparkleIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-600" weight="fill" aria-hidden="true" />
                      La IA ha elegido el héroe y el aspecto con más probabilidades de ganar a este villano.
                    </p>

                    <div className="border-t border-ink-100 pt-5">
                      <h3 className="flex items-baseline justify-between text-lg text-ink-900">
                        <span>Lista de cartas</span>
                        <span className="text-sm font-medium text-ink-500 tabular-nums">
                          {selectedDeck.cards.reduce((sum, card) => sum + card.quantity, 0)} cartas
                        </span>
                      </h3>
                      <ul className="mt-3 max-h-[420px] overflow-y-auto sm:columns-2 sm:gap-8 pr-1">
                        {selectedDeck.cards.map((card, index) => (
                          <li
                            key={`${card.card_id}-${index}`}
                            className="break-inside-avoid flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-ink-50"
                            title={(card.card_set || card.set) ? `Set: ${card.card_set || card.set}` : undefined}
                          >
                            <span className="w-6 text-right text-sm font-semibold text-ink-400 tabular-nums">{card.quantity}×</span>
                            <span className={`w-1 self-stretch rounded-full flex-shrink-0 ${getClassColor(card.clase || 'basic')}`} aria-hidden="true" />
                            <span className="flex-1 min-w-0 truncate text-sm font-medium text-ink-800">{card.card_name}</span>
                            {card.clase && <span className="text-[11px] font-medium capitalize text-ink-400">{card.clase}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-ink-100 pt-5 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleUseDeck}
                        disabled={generatingDeck || !deckName.trim() || !deckDescription.trim()}
                        className="btn btn-primary btn-lg flex-1"
                      >
                        {generatingDeck ? 'Guardando...' : 'Guardar y ver mazo'}
                      </button>
                      <button onClick={resetSelection} disabled={generatingDeck} className="btn btn-secondary btn-lg">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {!selectedDeck && (
                <button
                  onClick={() => {
                    setGeneratedDecks([])
                    setSelectedDeck(null)
                    setDeckName('')
                    setDeckDescription('')
                    setError(null)
                  }}
                  disabled={generatingDeck || !selectedVillainId}
                  className="btn btn-secondary w-full"
                >
                  Generar otros mazos
                </button>
              )}
            </>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-ink-900 halftone text-white px-6 sm:px-10 pt-10 pb-8">
              <div
                className="absolute -bottom-32 -right-20 w-[420px] h-[420px] rounded-full bg-brand-600/30 blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div className="relative max-w-md">
                <h2 className="text-2xl md:text-3xl text-white">Tus mazos aparecerán aquí</h2>
                <p className="mt-3 text-ink-300 leading-relaxed">
                  Elige un villano y la dificultad. La IA combinará héroes, aspectos y cartas
                  y te los ordenará por probabilidad de victoria.
                </p>
              </div>
              <CardFan className="relative mt-4 scale-[0.72] sm:scale-90 -mb-10 sm:-mb-4" />
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default AIRecommendationPage
