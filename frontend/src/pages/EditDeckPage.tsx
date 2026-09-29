import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Deck, Card } from '../types/card'
import { useToast } from '../components/Toast'
import { translateCardType } from '../utils/typeTranslations'
import { getClassColor } from '../utils/classColors'
import { ArrowLeftIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon, UserIcon, WarningIcon } from '@phosphor-icons/react'
import { usePageMeta } from '../lib/seo'

const EditDeckPage: React.FC = () => {
  usePageMeta({ title: 'Editar mazo', noindex: true })
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { showToast, ToastContainer } = useToast()
  
  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para edición
  const [deckName, setDeckName] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(new Map())
  const [basicCards, setBasicCards] = useState<Card[]>([])
  const [aspectCards, setAspectCards] = useState<Card[]>([])
  const [heroCards, setHeroCards] = useState<Card[]>([])
  const [basicSearchTerm, setBasicSearchTerm] = useState('')
  const [aspectSearchTerm, setAspectSearchTerm] = useState('')
  const [basicSetFilter, setBasicSetFilter] = useState<string>('')
  const [aspectSetFilter, setAspectSetFilter] = useState<string>('')
  const [filteredBasicCards, setFilteredBasicCards] = useState<Card[]>([])
  const [filteredAspectCards, setFilteredAspectCards] = useState<Card[]>([])

  // Función helper para crear clave única de carta usando ID
  const getCardKey = (card: Card): string => {
    return `${card.id}` // Usar ID único en lugar de nombre
  }

  // Función helper para obtener carta desde la clave
  const getCardFromKey = (cardKey: string): Card | undefined => {
    const cardId = parseInt(cardKey)
    return [...basicCards, ...aspectCards].find(c => c.id === cardId)
  }
  
  // Cargar el mazo existente
  useEffect(() => {
    const loadDeck = async () => {
      if (!id || !isAuthenticated) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Cargar el mazo
        const deckData = await apiService.getDeckById(Number(id))
        setDeck(deckData)
        
        // Cargar cartas básicas y del aspecto
        const basicCardsData = await apiService.getCardsByAspect('basic')
        setBasicCards(basicCardsData)
        setFilteredBasicCards(basicCardsData)
        
        const aspectCardsData = await apiService.getCardsByAspect(deckData.aspect || 'aggression')
        setAspectCards(aspectCardsData)
        setFilteredAspectCards(aspectCardsData)
        
        const heroes = await apiService.getHeroes()
        const hero = heroes.find(h => h.id === (deckData as any).hero_id)
        if (hero) {
          const heroCardsData = await apiService.getHeroCards(hero.id)
          setHeroCards(heroCardsData)
        }
        
        // Inicializar estados de edición
        setDeckName(deckData.name)
        setDeckDescription((deckData as any).description || '')
        
        // Convertir cartas del mazo a Map para edición usando IDs
        const cardsMap = new Map<string, number>()
        deckData.cards.forEach((card: any) => {
          // Buscar la carta por nombre + set para obtener su ID correcto
          const foundCard = [...basicCardsData, ...aspectCardsData].find(c => 
            c.name === (card.card_name || card.name) && 
            c.set === (card.card_set || card.set)
          )
          if (foundCard) {
            const cardKey = getCardKey(foundCard)
            cardsMap.set(cardKey, card.quantity)
          }
        })
        setSelectedCards(cardsMap)
        
      } catch (err) {
        console.error('Error loading deck:', err)
        setError('Error al cargar el mazo')
        showToast('Error al cargar el mazo', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    loadDeck()
  }, [id, isAuthenticated])

  // Obtener sets únicos de cartas básicas
  const uniqueBasicSets = Array.from(new Set(basicCards.map(card => card.set).filter(Boolean))).sort()
  
  // Obtener sets únicos de cartas del aspecto
  const uniqueAspectSets = Array.from(new Set(aspectCards.map(card => card.set).filter(Boolean))).sort()

  // Filtrar cartas básicas cuando cambie el término de búsqueda o el filtro de set
  useEffect(() => {
    let filtered = basicCards

    // Aplicar filtro de nombre
    if (basicSearchTerm.trim() !== '') {
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(basicSearchTerm.toLowerCase()) ||
        card.set.toLowerCase().includes(basicSearchTerm.toLowerCase()) ||
        card.type.toLowerCase().includes(basicSearchTerm.toLowerCase())
      )
    }

    // Aplicar filtro de set
    if (basicSetFilter !== '') {
      filtered = filtered.filter(card => card.set === basicSetFilter)
    }

    setFilteredBasicCards(filtered)
  }, [basicSearchTerm, basicSetFilter, basicCards])

  // Filtrar cartas del aspecto cuando cambie el término de búsqueda o el filtro de set
  useEffect(() => {
    let filtered = aspectCards

    // Aplicar filtro de nombre
    if (aspectSearchTerm.trim() !== '') {
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(aspectSearchTerm.toLowerCase()) ||
        card.set.toLowerCase().includes(aspectSearchTerm.toLowerCase()) ||
        card.type.toLowerCase().includes(aspectSearchTerm.toLowerCase())
      )
    }

    // Aplicar filtro de set
    if (aspectSetFilter !== '') {
      filtered = filtered.filter(card => card.set === aspectSetFilter)
    }

    setFilteredAspectCards(filtered)
  }, [aspectSearchTerm, aspectSetFilter, aspectCards])

  // Calcular total de cartas seleccionadas
  const totalSelectedCards = Array.from(selectedCards.values()).reduce((sum, quantity) => sum + quantity, 0)
  const heroCardsCount = heroCards.reduce((sum, card) => sum + (card.quantity || 1), 0)
  const totalCards = heroCardsCount + totalSelectedCards
  const remainingCards = 50 - totalCards

  // Añadir carta al mazo
  const addCard = (card: Card) => {
    if (remainingCards <= 0) {
      showToast('Ya tienes 50 cartas en el mazo', 'error')
      return
    }
    
    const cardKey = getCardKey(card)
    const currentQuantity = selectedCards.get(cardKey) || 0
    const maxQuantity = card.max_quantity || 3
    
    if (currentQuantity >= maxQuantity) {
      showToast(`No puedes añadir más de ${maxQuantity} copias de esta carta`, 'error')
      return
    }
    
    setSelectedCards(prev => new Map(prev.set(cardKey, currentQuantity + 1)))
  }

  // Quitar carta del mazo
  const removeCard = (card: Card) => {
    const cardKey = getCardKey(card)
    const currentQuantity = selectedCards.get(cardKey) || 0
    if (currentQuantity <= 1) {
      setSelectedCards(prev => {
        const newMap = new Map(prev)
        newMap.delete(cardKey)
        return newMap
      })
    } else {
      setSelectedCards(prev => new Map(prev.set(cardKey, currentQuantity - 1)))
    }
  }

  // Guardar cambios
  const handleSave = async () => {
    if (!deck) return
    
    if (!deckName.trim()) {
      showToast('El nombre del mazo es obligatorio', 'error')
      return
    }
    
    if (totalCards < 40 || totalCards > 50) {
      showToast('El mazo debe tener entre 40 y 50 cartas', 'error')
      return
    }
    
    // Verificar que tenemos el Auth0 SUB del usuario
    if (!user?.sub) {
      showToast('No hay Auth0 ID. Inicia sesión nuevamente.', 'error')
      return
    }
    
    // Validar nombre duplicado (globalmente, case-insensitive, excluyendo el mazo actual)
    try {
      const allDecks = await apiService.getDecks()
      const normalizedNewName = deckName.trim().toLowerCase()
      const duplicateDeck = allDecks.find(d => 
        d.id !== deck.id && d.name.trim().toLowerCase() === normalizedNewName
      )
      
      if (duplicateDeck) {
        showToast(`Ya existe un mazo con el nombre "${deckName}". Por favor, elige otro nombre.`, 'error')
        return
      }
    } catch (err) {
      console.error('Error verificando nombres duplicados:', err)
      // Continuar con la actualización si falla la verificación (no bloquear)
    }
    
    try {
      setSaving(true)
      
      // Convertir Map a array de cartas usando IDs únicos
      const editableCardsArray = Array.from(selectedCards.entries()).map(([cardKey, quantity]) => {
        const card = getCardFromKey(cardKey)
        if (!card) {
          return null
        }
        
        return {
          card_id: card.id,
          card_name: card.name,
          card_set: card.set,
          quantity: quantity
        }
      }).filter(Boolean)
      
      // Obtener las cartas del héroe desde la API
      // Usar el hero_id que viene del backend (más seguro)
      const heroId = (deck as any).hero_id
      let cardsArray = [...editableCardsArray]
      
      if (heroId) {
        const heroCardsData = await apiService.getHeroCards(heroId)
        const heroCards = heroCardsData.map((card: Card) => ({
          card_id: card.id,
          card_name: card.name,
          card_set: card.set,
          quantity: card.quantity || 1
        }))
        
        // Combinar cartas editables + cartas del héroe
        cardsArray = [...editableCardsArray, ...heroCards]
      }
      
      const updatedDeck = {
        name: deckName.trim(),
        description: deckDescription.trim(),
        hero_name: deck.hero_name,
        hero_id: (deck as any).hero_id,
        aspect: deck.aspect,
        cards: cardsArray
      }
      
      await apiService.updateDeck(deck.id!, updatedDeck, user.sub)
      
      showToast('Mazo actualizado exitosamente', 'success')
      
      // Redirigir a la página de mis mazos
      setTimeout(() => {
        navigate('/mydecks')
      }, 1500)
      
    } catch (err: any) {
      console.error('Error updating deck:', err)
      showToast(`Error al actualizar el mazo: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-900/[0.06] p-8 text-center max-w-sm">
          <h2 className="text-xl text-ink-900 mb-2">Inicia sesión para editar</h2>
          <p className="text-ink-500">Necesitas iniciar sesión para editar tus mazos.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-brand-600 mx-auto mb-4"></div>
          <p className="text-ink-500">Cargando mazo...</p>
        </div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-900/[0.06] p-8 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <WarningIcon className="w-7 h-7 text-red-600" weight="duotone" aria-hidden="true" />
          </div>
          <h2 className="text-xl text-ink-900 mb-2">No se pudo abrir el mazo</h2>
          <p className="text-ink-500 mb-6">{error || 'Mazo no encontrado'}</p>
          <button onClick={() => navigate('/mydecks')} className="btn btn-primary">
            Volver a Mis Mazos
          </button>
        </div>
      </div>
    )
  }

  const aspectColor = getClassColor(deck.aspect)
  const isValidSize = totalCards >= 40 && totalCards <= 50
  const sizeHint =
    totalCards < 40
      ? `Faltan ${40 - totalCards} cartas para llegar al mínimo de 40.`
      : totalCards > 50
        ? `Sobran ${totalCards - 50} cartas: el máximo es 50.`
        : remainingCards === 0
          ? 'Mazo completo.'
          : `Puedes añadir hasta ${remainingCards} cartas más.`

  const renderCardRow = (card: Card) => {
    const quantity = selectedCards.get(getCardKey(card)) || 0
    const maxQuantity = card.max_quantity || 3
    const canAddMore = remainingCards > 0 && quantity < maxQuantity

    return (
      <li
        key={card.id}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-inset transition-colors ${
          quantity > 0 ? 'bg-brand-50/60 ring-brand-200' : 'bg-white ring-ink-100 hover:bg-ink-50'
        }`}
      >
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{card.name}</p>
          <p className="truncate text-xs text-ink-500">
            {translateCardType(card.type)} · coste {card.cost} · {card.set} · máx. {maxQuantity}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white ring-1 ring-inset ring-ink-200 p-0.5">
          <button
            onClick={() => removeCard(card)}
            disabled={quantity === 0}
            className="w-7 h-7 rounded-md flex items-center justify-center text-ink-600 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Quitar una copia de ${card.name}`}
          >
            <MinusIcon className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
          </button>
          <span className={`w-6 text-center text-sm font-bold tabular-nums ${quantity > 0 ? 'text-brand-700' : 'text-ink-400'}`}>{quantity}</span>
          <button
            onClick={() => addCard(card)}
            disabled={!canAddMore}
            className="w-7 h-7 rounded-md flex items-center justify-center text-ink-600 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Añadir una copia de ${card.name}`}
          >
            <PlusIcon className="w-3.5 h-3.5" weight="bold" aria-hidden="true" />
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <section className="animate-rise-in relative overflow-hidden rounded-2xl bg-ink-900 halftone text-white shadow-xl">
        <div className={`absolute inset-y-0 left-0 w-1.5 ${aspectColor}`} aria-hidden="true" />
        <div className={`absolute -top-40 -right-28 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl pointer-events-none ${aspectColor}`} aria-hidden="true" />

        <div className="relative px-6 sm:px-10 pt-7 pb-9 md:pt-8 md:pb-10">
          <button
            onClick={() => navigate('/mydecks')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
            Mis Mazos
          </button>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ring-white/15">
                  <UserIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                  {deck.hero_name}
                </span>
                {deck.aspect && (
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-sm font-semibold capitalize ring-1 ring-inset ring-white/15">
                    <span className={`w-2.5 h-2.5 rotate-45 ${aspectColor}`} aria-hidden="true" />
                    {deck.aspect}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl text-white">Editar mazo</h1>
              <p className="mt-3 text-ink-300 truncate">{deckName || deck.name}</p>
            </div>

            <div className="min-w-[14rem]">
              <p className="font-display text-4xl font-extrabold leading-none tabular-nums">
                {totalCards}<span className="text-ink-400 text-2xl">/50</span>
              </p>
              <p className={`mt-1 text-sm ${isValidSize ? 'text-ink-300' : 'text-amber-300'}`}>{sizeHint}</p>
              <div className="mt-3 relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
                <div className={`h-full rounded-full ${isValidSize ? aspectColor : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (totalCards / 50) * 100)}%` }} />
                <span className="absolute top-0 bottom-0 w-px bg-white/40" style={{ left: '80%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Información del mazo */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 bg-white rounded-2xl shadow-sm ring-1 ring-ink-900/[0.06] p-6 space-y-5">
          <h2 className="text-lg text-ink-900">Información del mazo</h2>

          <div>
            <label htmlFor="edit-deck-name" className="block text-sm font-semibold text-ink-800 mb-2">
              Nombre
            </label>
            <input
              id="edit-deck-name"
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-900"
              placeholder="Nombre del mazo"
            />
          </div>

          <div>
            <label htmlFor="edit-deck-desc" className="block text-sm font-semibold text-ink-800 mb-2">
              Descripción
            </label>
            <textarea
              id="edit-deck-desc"
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-900"
              placeholder="Describe tu estrategia o tema del mazo..."
            />
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-100 text-sm">
            <div className="bg-ink-50 px-4 py-3">
              <dt className="text-ink-500">Cartas del héroe</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold text-ink-900 tabular-nums">{heroCardsCount}</dd>
            </div>
            <div className="bg-ink-50 px-4 py-3">
              <dt className="text-ink-500">Seleccionadas</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold text-ink-900 tabular-nums">{totalSelectedCards}</dd>
            </div>
            <div className="bg-ink-50 px-4 py-3">
              <dt className="text-ink-500">Total</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold text-ink-900 tabular-nums">{totalCards}/50</dd>
            </div>
            <div className="bg-ink-50 px-4 py-3">
              <dt className="text-ink-500">Restantes</dt>
              <dd className={`mt-0.5 font-display text-xl font-extrabold tabular-nums ${remainingCards < 0 ? 'text-red-600' : remainingCards === 0 ? 'text-green-600' : 'text-ink-900'}`}>
                {remainingCards}
              </dd>
            </div>
          </dl>

          <div className="space-y-2">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || totalCards < 40 || totalCards > 50}
                className="btn btn-primary btn-lg flex-1"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => navigate('/mydecks')} className="btn btn-secondary btn-lg">
                Cancelar
              </button>
            </div>
            {!isValidSize && (
              <p className="text-sm text-amber-700">El mazo debe tener entre 40 y 50 cartas para poder guardarlo.</p>
            )}
          </div>
        </aside>

        {/* Cartas */}
        <div className="lg:col-span-8 space-y-6">
          {[
            {
              key: 'basic',
              title: 'Cartas básicas',
              search: basicSearchTerm,
              setSearch: setBasicSearchTerm,
              setFilter: basicSetFilter,
              setSetFilter: setBasicSetFilter,
              sets: uniqueBasicSets,
              cards: filteredBasicCards,
              placeholder: 'Buscar cartas básicas',
              empty: 'No se encontraron cartas básicas',
              dot: getClassColor('basic'),
            },
            {
              key: 'aspect',
              title: `Cartas de ${deck?.aspect || 'aspecto'}`,
              search: aspectSearchTerm,
              setSearch: setAspectSearchTerm,
              setFilter: aspectSetFilter,
              setSetFilter: setAspectSetFilter,
              sets: uniqueAspectSets,
              cards: filteredAspectCards,
              placeholder: 'Buscar cartas del aspecto',
              empty: 'No se encontraron cartas del aspecto',
              dot: aspectColor,
            },
          ].map((group) => (
            <section key={group.key} className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-900/[0.06] p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2.5 text-lg text-ink-900">
                  <span className={`w-2.5 h-2.5 rotate-45 ${group.dot}`} aria-hidden="true" />
                  {group.title}
                </h2>
                <span className="text-sm text-ink-500 tabular-nums">{group.cards.length} cartas</span>
              </div>

              <div className="mt-4 grid sm:grid-cols-[1fr_14rem] gap-2">
                <label className="relative">
                  <span className="sr-only">{group.placeholder}</span>
                  <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" weight="bold" aria-hidden="true" />
                  <input
                    type="text"
                    value={group.search}
                    onChange={(e) => group.setSearch(e.target.value)}
                    placeholder={group.placeholder}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl !bg-ink-50 border border-transparent text-sm text-ink-900 placeholder:text-ink-400"
                  />
                </label>
                <label>
                  <span className="sr-only">Filtrar por set</span>
                  <select
                    value={group.setFilter}
                    onChange={(e) => group.setSetFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-ink-200 text-sm text-ink-800"
                  >
                    <option value="">Todos los sets</option>
                    {group.sets.map((set) => (
                      <option key={set} value={set}>
                        {set}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {group.cards.length === 0 && (group.search || group.setFilter) ? (
                <p className="mt-6 text-center text-sm text-ink-400">{group.empty}</p>
              ) : (
                <ul className="mt-4 max-h-80 overflow-y-auto space-y-1.5 pr-1">
                  {group.cards.map(renderCardRow)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default EditDeckPage
