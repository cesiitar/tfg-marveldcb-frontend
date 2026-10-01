import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck, DeckComment } from '../types/card'
import { translateCardType } from '../utils/typeTranslations'
import { getClassColor } from '../utils/classColors'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { ArrowLeftIcon, CalendarBlankIcon, CardsIcon, ChartBarIcon, ChatCircleDotsIcon, FileTextIcon, HeartIcon, PaperPlaneTiltIcon, PencilSimpleIcon, TrashIcon, UserIcon, WarningIcon } from '@phosphor-icons/react'
import { usePageMeta, SERVED_FROM_FALLBACK } from '../lib/seo'
import { renderMarkdown } from '../lib/markdown-lite'

const DeckDetailPage: React.FC = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  const [deck, setDeck] = useState<Deck | null>(null)
  usePageMeta({ title: deck ? `${deck.name} · mazo de ${deck.hero_name}` : 'Mazo', description: deck ? `Mazo de Marvel Champions con ${deck.hero_name}${deck.creator_name ? ` creado por ${deck.creator_name}` : ''}: lista de cartas, estadísticas y comentarios en AIForge.` : undefined, canonical: !!deck, noindex: SERVED_FROM_FALLBACK && !deck })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loadingFavorite, setLoadingFavorite] = useState(false)
  const [comments, setComments] = useState<DeckComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [updatingComment, setUpdatingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null)
  const [descriptionOpen, setDescriptionOpen] = useState(false)

  useEffect(() => {
    const loadDeck = async () => {
      try {
        setLoading(true)
        setError(null)
        const d = await apiService.getDeckById(Number(id))
        setDeck(d)
        
        // Guardar el ID del mazo visto para restaurar la vista al volver
        if (d.id) {
          try {
            localStorage.setItem('lastViewedDeckId', d.id.toString())
            // También guardar desde qué página vino (para saber a dónde volver)
            const referrer = document.referrer
            if (referrer && !referrer.includes('/decks/')) {
              localStorage.setItem('lastViewedDeckFrom', referrer)
            }
          } catch (err) {
            console.error('Error guardando último mazo visto:', err)
          }
        }
      } catch (err) {
        setError('No se pudo cargar el mazo')
      } finally {
        setLoading(false)
      }
    }
    loadDeck()
  }, [id])

  // Cargar estado de favorito
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !user?.sub || !deck?.id) return

      try {
        const favoriteStatus = await apiService.isFavorite(deck.id, user.sub)
        setIsFavorite(favoriteStatus)
      } catch (err) {
        console.error('Error checking favorite:', err)
      }
    }

    checkFavorite()
  }, [isAuthenticated, user?.sub, deck?.id])

  // Cargar comentarios del mazo
  useEffect(() => {
    const loadComments = async () => {
      if (!deck?.id) return

      try {
        setLoadingComments(true)
        const commentsData = await apiService.getDeckComments(deck.id)
        setComments(commentsData)
      } catch (err) {
        console.error('Error loading comments:', err)
      } finally {
        setLoadingComments(false)
      }
    }

    loadComments()
  }, [deck?.id])

  // Manejar toggle de favorito
  const handleToggleFavorite = async () => {
    if (!user?.sub || !deck?.id) {
      showToast('Debes iniciar sesión para usar favoritos', 'error')
      return
    }

    try {
      setLoadingFavorite(true)
      const result = await apiService.toggleFavorite(deck.id, user.sub)
      setIsFavorite(result.is_favorite)
      showToast(result.message, 'success')
    } catch (err) {
      console.error('Error toggling favorite:', err)
      showToast('Error al actualizar favorito', 'error')
    } finally {
      setLoadingFavorite(false)
    }
  }

  // Manejar envío de comentario
  const handleSubmitComment = async () => {
    if (!isAuthenticated || !user?.sub) {
      showToast('Debes iniciar sesión para comentar', 'error')
      return
    }

    if (!deck?.id) {
      showToast('Error: No se pudo identificar el mazo', 'error')
      return
    }

    const trimmedComment = newComment.trim()
    if (!trimmedComment) {
      showToast('El comentario no puede estar vacío', 'error')
      return
    }

    if (trimmedComment.length > 1000) {
      showToast('El comentario no puede exceder 1000 caracteres', 'error')
      return
    }

    try {
      setSavingComment(true)
      const newCommentData = await apiService.createDeckComment(deck.id, trimmedComment, user.sub)
      setComments([newCommentData, ...comments]) // Añadir al principio
      setNewComment('')
      showToast('Comentario añadido correctamente', 'success')
    } catch (err) {
      console.error('Error creating comment:', err)
      showToast('Error al crear el comentario', 'error')
    } finally {
      setSavingComment(false)
    }
  }

  // Iniciar edición de comentario
  const handleStartEdit = (comment: DeckComment) => {
    setEditingCommentId(comment.id)
    setEditingText(comment.comment_text)
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingText('')
  }

  // Guardar edición de comentario
  const handleSaveEdit = async (commentId: number) => {
    if (!isAuthenticated || !user?.sub) {
      showToast('Debes iniciar sesión para editar comentarios', 'error')
      return
    }

    const trimmedText = editingText.trim()
    if (!trimmedText) {
      showToast('El comentario no puede estar vacío', 'error')
      return
    }

    if (trimmedText.length > 1000) {
      showToast('El comentario no puede exceder 1000 caracteres', 'error')
      return
    }

    try {
      setUpdatingComment(true)
      const updatedComment = await apiService.updateDeckComment(commentId, trimmedText, user.sub)
      setComments(comments.map(c => c.id === commentId ? updatedComment : c))
      setEditingCommentId(null)
      setEditingText('')
      showToast('Comentario actualizado correctamente', 'success')
    } catch (err) {
      console.error('Error updating comment:', err)
      showToast('Error al actualizar el comentario', 'error')
    } finally {
      setUpdatingComment(false)
    }
  }

  // Eliminar comentario
  const handleDeleteComment = (commentId: number) => {
    if (!isAuthenticated || !user?.sub) {
      showToast('Debes iniciar sesión para eliminar comentarios', 'error')
      return
    }
    setCommentToDelete(commentId)
    setShowDeleteCommentConfirm(true)
  }

  const confirmDeleteComment = async () => {
    if (!commentToDelete || !user?.sub) return

    try {
      setDeletingCommentId(commentToDelete)
      await apiService.deleteDeckComment(commentToDelete, user.sub)
      setComments(comments.filter(c => c.id !== commentToDelete))
      showToast('Comentario eliminado correctamente', 'success')
    } catch (err) {
      console.error('Error deleting comment:', err)
      showToast('Error al eliminar el comentario', 'error')
    } finally {
      setDeletingCommentId(null)
      setShowDeleteCommentConfirm(false)
      setCommentToDelete(null)
    }
  }

  // Verificar si un comentario es del usuario actual
  const isOwnComment = (comment: DeckComment): boolean => {
    return isAuthenticated && user?.sub === comment.auth0_id
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
          <Link to="/decks" className="btn btn-primary">
            <ArrowLeftIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
            Volver a Mazos
          </Link>
        </div>
      </div>
    )
  }

  const totalCards = deck.cards.reduce((sum, c) => sum + (c.quantity as number), 0)
  const aspect = (deck as any).aspect as string | undefined
  const aspectColor = getClassColor(aspect)

  // Composición (solo presentación)
  const aspectStats = Object.entries(
    deck.cards.reduce((acc: Record<string, number>, card: any) => {
      const clase = card.clase || 'basic'
      acc[clase] = (acc[clase] || 0) + card.quantity
      return acc
    }, {})
  )
    .map(([clase, count]) => ({ clase, count, percentage: totalCards ? Math.round((count / totalCards) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)

  const typeStats = Object.entries(
    deck.cards.reduce((acc: Record<string, number>, card: any) => {
      const type = card.type || 'unknown'
      acc[type] = (acc[type] || 0) + card.quantity
      return acc
    }, {})
  )
    .map(([type, count]) => ({ type, count, percentage: totalCards ? Math.round((count / totalCards) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Agrupar cartas por tipo
  const cardsByType = deck.cards.reduce((acc: any, c: any) => {
    const cardName = c.card_name || c.name || 'Carta sin nombre'
    const cardType = c.type || 'unknown'
    const cardClase = c.clase || 'basic'
    const cardSet = c.set || 'Set desconocido'
    if (!acc[cardType]) acc[cardType] = []
    acc[cardType].push({ name: cardName, quantity: c.quantity, clase: cardClase, set: cardSet, type: cardType })
    return acc
  }, {})

  const typeOrder = ['hero', 'ally', 'event', 'upgrade', 'support', 'resource', 'player_side_scheme', 'attachment', 'environment', 'minion', 'obligation', 'side_scheme', 'treachery', 'villain', 'main_scheme', 'evidence']

  const sortedTypes = Object.keys(cardsByType).sort((a, b) => {
    const aIndex = typeOrder.indexOf(a)
    const bIndex = typeOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const initials = (name?: string) =>
    (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

  // Descripción larga: se muestra plegada para que no descompense la página
  const description = deck.description?.trim() || ''
  const longDescription = description.length > 900
  const spinner = (size = 'w-4 h-4') => (
    <svg className={`${size} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Cabecera del mazo */}
      <section className="animate-rise-in relative overflow-hidden rounded-2xl bg-ink-900 halftone text-white shadow-xl">
        <div className={`absolute inset-y-0 left-0 w-1.5 ${aspectColor}`} aria-hidden="true" />
        <div className={`absolute -top-40 -right-28 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl pointer-events-none ${aspectColor}`} aria-hidden="true" />

        <div className="relative px-6 sm:px-10 pt-7">
          <Link to="/decks" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-300 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
            Mazos
          </Link>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ring-white/15">
                  <UserIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                  {deck.hero_name}
                </span>
                {aspect && (
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-sm font-semibold capitalize ring-1 ring-inset ring-white/15">
                    <span className={`w-2.5 h-2.5 rotate-45 ${aspectColor}`} aria-hidden="true" />
                    {aspect}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl text-white break-words">{deck.name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-ink-300">
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-ink-400" weight="duotone" aria-hidden="true" />
                  Creado por <span className="font-semibold text-white">{deck.creator_name || 'Anónimo'}</span>
                </span>
                {deck.created_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarBlankIcon className="w-4 h-4 text-ink-400" weight="duotone" aria-hidden="true" />
                    <time dateTime={deck.created_at} className="tabular-nums">{new Date(deck.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                  </span>
                )}
                {typeof deck.favorite_count === 'number' && (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <HeartIcon className="w-4 h-4 text-brand-400" weight="fill" aria-hidden="true" />
                    {deck.favorite_count} {deck.favorite_count === 1 ? 'favorito' : 'favoritos'}
                  </span>
                )}
              </p>
            </div>

            {isAuthenticated && (
              <button
                onClick={handleToggleFavorite}
                disabled={loadingFavorite}
                aria-pressed={isFavorite}
                className={`btn btn-lg flex-shrink-0 self-start lg:self-auto ${isFavorite ? 'bg-white text-brand-700 hover:bg-ink-100' : 'bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15'}`}
              >
                {loadingFavorite ? spinner('w-5 h-5') : <HeartIcon className="w-5 h-5" weight={isFavorite ? 'fill' : 'regular'} aria-hidden="true" />}
                {isFavorite ? 'En favoritos' : 'Añadir a favoritos'}
              </button>
            )}
          </div>
        </div>

        {/* Franja de cifras: el mazo de un vistazo */}
        <div className="relative mt-8 border-t border-white/10 bg-black/20">
          <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 lg:divide-x divide-white/10">
            <div className="px-6 sm:px-10 py-4 lg:py-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">Cartas</dt>
              <dd className="mt-1 font-display text-3xl font-extrabold leading-none tabular-nums">
                {totalCards}<span className="text-lg text-ink-400">/50</span>
              </dd>
            </div>
            {typeStats.slice(0, 4).map(({ type, count }, i) => (
              // En pantallas pequeñas caben 4 cifras: la quinta solo aparece en escritorio
              <div key={type} className={`px-6 sm:px-8 lg:px-6 py-4 lg:py-5 ${i === 3 ? 'hidden lg:block' : ''}`}>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">{translateCardType(type)}</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold leading-none tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
          {/* Composición por aspecto en una línea */}
          <div className="flex h-1.5 w-full" role="img" aria-label={`Aspectos: ${aspectStats.map((a) => `${a.clase} ${a.percentage}%`).join(', ')}`}>
            {aspectStats.map(({ clase, percentage }) => (
              <div key={clase} className={`h-full ${getClassColor(clase)}`} style={{ width: `${percentage}%` }} />
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Columna principal: lista de cartas, descripción y comentarios */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <section className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-ink-100">
              <h2 className="flex items-center gap-2 text-xl text-ink-900">
                <CardsIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
                Lista de cartas
              </h2>
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-sm font-semibold text-ink-700 tabular-nums">{totalCards}</span>
            </div>

            <div className="p-5 sm:p-6 sm:columns-2 sm:gap-8">
              {sortedTypes.map((type) => {
                const cards = cardsByType[type]
                const typeTotal = cards.reduce((sum: number, c: any) => sum + (c.quantity || 0), 0)
                return (
                  <div key={type} className="break-inside-avoid mb-6 last:mb-0">
                    <h3 className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">{translateCardType(type)}</span>
                      <span className="text-xs font-semibold text-ink-400 tabular-nums">{typeTotal}</span>
                    </h3>
                    <ul className="rounded-xl ring-1 ring-ink-900/[0.06] divide-y divide-ink-100 overflow-hidden">
                      {cards.map((card: any, idx: number) => (
                        <li
                          key={`${card.name}-${idx}`}
                          className="relative flex items-center gap-3 pl-4 pr-3 py-2 bg-white hover:bg-ink-50 transition-colors"
                          title={`${card.name} · ${card.set}`}
                        >
                          <span className={`absolute inset-y-0 left-0 w-1 ${getClassColor(card.clase)}`} aria-hidden="true" />
                          <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-md bg-ink-100 px-1.5 font-mono text-xs font-semibold text-ink-700 tabular-nums">
                            {card.quantity}×
                          </span>
                          <span className="flex-1 min-w-0 truncate text-sm font-medium text-ink-800">{card.name}</span>
                          <span className="hidden sm:inline text-[11px] font-medium capitalize text-ink-400">{card.clase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Descripción del creador */}
          <section className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg text-ink-900">
              <FileTextIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
              Descripción
            </h2>
            {description ? (
              <div className="relative mt-3">
                <div
                  id="deck-description"
                  className={`deck-prose ${longDescription && !descriptionOpen ? 'max-h-80 overflow-hidden' : ''}`}
                  // Markdown del usuario convertido a HTML seguro (mismo conversor que el prerender)
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(deck.description) }}
                />
                {longDescription && !descriptionOpen && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
                )}
                {longDescription && (
                  <button
                    type="button"
                    onClick={() => setDescriptionOpen((open) => !open)}
                    aria-expanded={descriptionOpen}
                    aria-controls="deck-description"
                    className="relative mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {descriptionOpen ? 'Mostrar menos' : 'Leer descripción completa'}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-400 italic">El creador no ha añadido descripción.</p>
            )}
          </section>

          {/* Comentarios */}
          <section className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg text-ink-900">
              <ChatCircleDotsIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
              Comentarios
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600 tabular-nums">{comments.length}</span>
            </h2>

            {/* Formulario para añadir comentario (solo si está autenticado) */}
            {isAuthenticated ? (
              <div className="mt-4 flex gap-3">
                <span className="w-8 h-8 flex-shrink-0 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold" aria-hidden="true">
                  {initials(user?.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <label htmlFor="new-comment" className="sr-only">Escribe un comentario</label>
                  <textarea
                    id="new-comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="¿Qué opinas de este mazo?"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 resize-none text-sm text-ink-900 placeholder:text-ink-400"
                    rows={2}
                    disabled={savingComment}
                    maxLength={1000}
                  />
                  <div className="mt-2 flex items-center justify-end gap-3">
                    {newComment.length > 0 && (
                      <span className={`text-xs tabular-nums ${newComment.length > 900 ? 'text-red-600' : 'text-ink-400'}`}>
                        {newComment.length}/1000
                      </span>
                    )}
                    <button
                      onClick={handleSubmitComment}
                      disabled={savingComment || !newComment.trim() || newComment.length > 1000}
                      className="btn btn-primary btn-sm"
                    >
                      {savingComment ? (
                        <>
                          {spinner()}
                          Publicando...
                        </>
                      ) : (
                        <>
                          <PaperPlaneTiltIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                          Publicar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-500">Inicia sesión para comentar este mazo.</p>
            )}

            {/* Lista de comentarios */}
            {loadingComments ? (
              <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
                {spinner()}
                Cargando comentarios...
              </div>
            ) : comments.length === 0 ? (
              <p className="mt-4 text-sm text-ink-400">Todavía no hay comentarios. Abre la conversación.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {comments.map((comment) => {
                  const isEditing = editingCommentId === comment.id
                  const isOwn = isOwnComment(comment)
                  const isDeleting = deletingCommentId === comment.id

                  return (
                    <li key={comment.id} className="group flex gap-3">
                      <span className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isOwn ? 'bg-brand-600 text-white' : 'bg-ink-900 text-white'}`} aria-hidden="true">
                        {initials(comment.author_name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 text-sm">
                            <span className="font-semibold text-ink-900">{comment.author_name || 'Usuario anónimo'}</span>
                            {isOwn && <span className="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">Tú</span>}
                            <span className="ml-2 text-xs text-ink-400 tabular-nums">
                              {new Date(comment.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              {comment.updated_at && comment.updated_at !== comment.created_at && ' · editado'}
                            </span>
                          </p>
                          {isOwn && !isEditing && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => handleStartEdit(comment)}
                                disabled={isDeleting}
                                className="btn btn-ghost btn-sm !p-1.5"
                                aria-label="Editar comentario"
                                title="Editar comentario"
                              >
                                <PencilSimpleIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={isDeleting}
                                className="btn btn-ghost btn-sm !p-1.5 hover:!text-red-600 hover:!bg-red-50"
                                aria-label="Eliminar comentario"
                                title="Eliminar comentario"
                              >
                                {isDeleting ? spinner() : <TrashIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />}
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 resize-none text-sm text-ink-900"
                              rows={2}
                              disabled={updatingComment}
                              maxLength={1000}
                              aria-label="Editar comentario"
                            />
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <span className={`mr-auto text-xs tabular-nums ${editingText.length > 900 ? 'text-red-600' : 'text-ink-400'}`}>
                                {editingText.length}/1000
                              </span>
                              <button onClick={handleCancelEdit} disabled={updatingComment} className="btn btn-ghost btn-sm">
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={updatingComment || !editingText.trim() || editingText.length > 1000}
                                className="btn btn-primary btn-sm"
                              >
                                {updatingComment ? 'Guardando...' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-sm text-ink-700 leading-relaxed whitespace-pre-line break-words">
                            {comment.comment_text}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Columna lateral: composición */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20">
          <section className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg text-ink-900">
              <ChartBarIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
              Composición
            </h2>

            <h3 className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">Por aspecto</h3>
            <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-ink-100" role="img" aria-label="Distribución de cartas por aspecto">
              {aspectStats.map(({ clase, percentage }) => (
                <div key={clase} className={`h-full ${getClassColor(clase)}`} style={{ width: `${percentage}%` }} />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {aspectStats.map(({ clase, count, percentage }) => (
                <li key={clase} className="flex items-center gap-3 text-sm">
                  <span className={`w-2.5 h-2.5 rotate-45 flex-shrink-0 ${getClassColor(clase)}`} aria-hidden="true" />
                  <span className="flex-1 capitalize text-ink-700">{clase}</span>
                  <span className="font-semibold text-ink-900 tabular-nums">{count}</span>
                  <span className="w-10 text-right text-ink-400 tabular-nums">{percentage}%</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 pt-5 border-t border-ink-100 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">Por tipo</h3>
            <ul className="mt-3 space-y-2.5">
              {typeStats.map(({ type, count, percentage }) => (
                <li key={type}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-700">{translateCardType(type)}</span>
                    <span className="font-semibold text-ink-900 tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-ink-800" style={{ width: `${percentage}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ToastContainer />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteCommentConfirm}
        title="Eliminar comentario"
        message="¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDeleteComment}
        onCancel={() => {
          setShowDeleteCommentConfirm(false)
          setCommentToDelete(null)
        }}
      />
    </div>
  )
}

export default DeckDetailPage