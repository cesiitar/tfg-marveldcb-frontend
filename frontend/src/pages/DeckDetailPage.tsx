import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck, DeckComment } from '../types/card'
import { translateCardType } from '../utils/typeTranslations'
import { getClassColor } from '../utils/classColors'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { ArrowLeftIcon, CardsIcon, ChartBarIcon, ChatCircleDotsIcon, FileTextIcon, HeartIcon, PaperPlaneTiltIcon, PencilSimpleIcon, TrashIcon, UserIcon, WarningIcon } from '@phosphor-icons/react'
import { usePageMeta } from '../lib/seo'

const DeckDetailPage: React.FC = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  const [deck, setDeck] = useState<Deck | null>(null)
  usePageMeta({ title: deck ? `${deck.name} · mazo de ${deck.hero_name}` : 'Mazo', description: deck ? `Mazo de Marvel Champions con ${deck.hero_name}${deck.creator_name ? ` creado por ${deck.creator_name}` : ''}: lista de cartas, estadísticas y comentarios en AIForge.` : undefined, canonical: !!deck })
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

  // Limpia enlaces markdown tipo [texto](/card/123) y recorta espacios
  const formatDescription = (text?: string | null) => {
    if (!text) return 'Sin descripción'
    const cleaned = text.replace(/\[([^\]]+?)\]\(\/card\/\d+\)/g, '$1')
    return cleaned.trim()
  }

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
            Volver a Decklists
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

  return (
    <div className="space-y-8">
      {/* Cabecera del mazo */}
      <section className="animate-rise-in relative overflow-hidden rounded-2xl bg-ink-900 halftone text-white shadow-xl">
        <div className={`absolute inset-y-0 left-0 w-1.5 ${aspectColor}`} aria-hidden="true" />
        <div className={`absolute -top-40 -right-28 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl pointer-events-none ${aspectColor}`} aria-hidden="true" />

        <div className="relative px-6 sm:px-10 pt-7 pb-9 md:pt-8 md:pb-11">
          <Link to="/decks" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-300 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
            Decklists
          </Link>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
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
              <p className="mt-3 text-ink-300">
                Creado por <span className="font-semibold text-white">{deck.creator_name || 'Anónimo'}</span>
                {deck.created_at && (
                  <>
                    {' el '}
                    <time dateTime={deck.created_at} className="tabular-nums">{new Date(deck.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-5 flex-shrink-0">
              <div className="min-w-[10rem]">
                <p className="font-display text-4xl font-extrabold leading-none tabular-nums">
                  {totalCards}<span className="text-ink-400 text-2xl">/50</span>
                </p>
                <p className="mt-1 text-sm text-ink-400">cartas en el mazo</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
                  <div className={`h-full rounded-full ${aspectColor}`} style={{ width: `${Math.min(100, (totalCards / 50) * 100)}%` }} />
                </div>
              </div>
              {isAuthenticated && (
                <button
                  onClick={handleToggleFavorite}
                  disabled={loadingFavorite}
                  aria-pressed={isFavorite}
                  className={`btn btn-lg ${isFavorite ? 'bg-white text-brand-700 hover:bg-ink-100' : 'bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15'}`}
                >
                  {loadingFavorite ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <HeartIcon className="w-5 h-5" weight={isFavorite ? 'fill' : 'regular'} aria-hidden="true" />
                  )}
                  {isFavorite ? 'En favoritos' : 'Añadir a favoritos'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Columna izquierda: descripción y composición */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          <section className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm p-6">
            <h2 className="flex items-center gap-2 text-lg text-ink-900">
              <FileTextIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
              Descripción
            </h2>
            <p className={`mt-3 leading-relaxed whitespace-pre-line ${deck.description ? 'text-ink-700' : 'text-ink-400 italic'}`}>
              {formatDescription(deck.description)}
            </p>
          </section>

          <section className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm p-6">
            <h2 className="flex items-center gap-2 text-lg text-ink-900">
              <ChartBarIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
              Composición
            </h2>

            {/* Barra segmentada por aspecto */}
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-ink-100" role="img" aria-label="Distribución de cartas por aspecto">
              {aspectStats.map(({ clase, percentage }) => (
                <div key={clase} className={`h-full ${getClassColor(clase)} first:rounded-l-full last:rounded-r-full`} style={{ width: `${percentage}%` }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {aspectStats.map(({ clase, count, percentage }) => (
                <li key={clase} className="flex items-center gap-3 text-sm">
                  <span className={`w-2.5 h-2.5 rotate-45 flex-shrink-0 ${getClassColor(clase)}`} aria-hidden="true" />
                  <span className="flex-1 capitalize text-ink-700">{clase}</span>
                  <span className="font-semibold text-ink-900 tabular-nums">{count}</span>
                  <span className="w-10 text-right text-ink-400 tabular-nums">{percentage}%</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-5 border-t border-ink-100">
              <h3 className="text-sm font-semibold text-ink-500">Tipos de carta</h3>
              <ul className="mt-3 space-y-3">
                {typeStats.map(({ type, count, percentage }) => (
                  <li key={type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-700">{translateCardType(type)}</span>
                      <span className="font-semibold text-ink-900 tabular-nums">{count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full bg-ink-800" style={{ width: `${percentage}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </aside>

        {/* Columna derecha: lista de cartas */}
        <section className="lg:col-span-8 bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm">
          <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
            <h2 className="flex items-center gap-2 text-xl text-ink-900">
              <CardsIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
              Lista de cartas
            </h2>
            <span className="text-sm font-medium text-ink-500 tabular-nums">{totalCards} cartas</span>
          </div>

          <div className="p-6 sm:columns-2 sm:gap-10">
            {sortedTypes.map((type) => {
              const cards = cardsByType[type]
              const typeTotal = cards.reduce((sum: number, c: any) => sum + (c.quantity || 0), 0)
              return (
                <div key={type} className="break-inside-avoid mb-6 last:mb-0">
                  <h3 className="flex items-baseline justify-between border-b border-ink-100 pb-2 mb-2">
                    <span className="text-base text-ink-900">{translateCardType(type)}</span>
                    <span className="text-xs font-semibold text-ink-400 tabular-nums">{typeTotal}</span>
                  </h3>
                  <ul>
                    {cards.map((card: any, idx: number) => (
                      <li
                        key={`${card.name}-${idx}`}
                        className="group flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-ink-50 transition-colors"
                        title={`Set: ${card.set}`}
                      >
                        <span className="w-6 text-right text-sm font-semibold text-ink-400 tabular-nums">{card.quantity}×</span>
                        <span className={`w-1 self-stretch rounded-full flex-shrink-0 ${getClassColor(card.clase)}`} aria-hidden="true" />
                        <span className="flex-1 min-w-0 truncate text-sm font-medium text-ink-800 group-hover:text-ink-950">{card.name}</span>
                        <span className="text-[11px] font-medium capitalize text-ink-400">{card.clase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Comentarios */}
      <section className="bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-xl text-ink-900">
          <ChatCircleDotsIcon className="w-5 h-5 text-ink-400" weight="duotone" aria-hidden="true" />
          Comentarios
          <span className="ml-1 text-base font-semibold text-ink-400 tabular-nums">{comments.length}</span>
        </h2>

        {/* Formulario para añadir comentario (solo si está autenticado) */}
        {isAuthenticated ? (
          <div className="mt-5">
            <label htmlFor="new-comment" className="sr-only">Escribe un comentario</label>
            <textarea
              id="new-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="¿Qué opinas de este mazo?"
              className="w-full px-4 py-3 rounded-xl border border-ink-200 resize-none text-ink-900 placeholder:text-ink-400"
              rows={3}
              disabled={savingComment}
              maxLength={1000}
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              <span className={`text-xs tabular-nums ${newComment.length > 900 ? 'text-red-600' : 'text-ink-400'}`}>
                {newComment.length}/1000
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={savingComment || !newComment.trim() || newComment.length > 1000}
                className="btn btn-primary"
              >
                {savingComment ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publicando...
                  </>
                ) : (
                  <>
                    <PaperPlaneTiltIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                    Publicar comentario
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-500">
            Inicia sesión para comentar este mazo.
          </p>
        )}

        {/* Lista de comentarios */}
        {loadingComments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-ink-200 border-t-brand-600 mx-auto mb-2"></div>
            <p className="text-ink-500 text-sm">Cargando comentarios...</p>
          </div>
        ) : comments.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-400">Todavía no hay comentarios. Abre la conversación.</p>
        ) : (
          <ul className="mt-8 divide-y divide-ink-100">
            {comments.map((comment) => {
              const isEditing = editingCommentId === comment.id
              const isOwn = isOwnComment(comment)
              const isDeleting = deletingCommentId === comment.id

              return (
                <li key={comment.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${isOwn ? 'bg-brand-600 text-white' : 'bg-ink-900 text-white'}`} aria-hidden="true">
                    {initials(comment.author_name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">
                          {comment.author_name || 'Usuario anónimo'}
                          {isOwn && <span className="ml-2 align-middle rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">Tú</span>}
                        </p>
                        <p className="text-xs text-ink-400 tabular-nums">
                          {new Date(comment.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {comment.updated_at && comment.updated_at !== comment.created_at && (
                            <span className="ml-1">(editado)</span>
                          )}
                        </p>
                      </div>
                      {isOwn && !isEditing && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleStartEdit(comment)}
                            disabled={isDeleting}
                            className="btn btn-ghost btn-sm !p-2"
                            aria-label="Editar comentario"
                            title="Editar comentario"
                          >
                            <PencilSimpleIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isDeleting}
                            className="btn btn-ghost btn-sm !p-2 hover:!text-red-600 hover:!bg-red-50"
                            aria-label="Eliminar comentario"
                            title="Eliminar comentario"
                          >
                            {isDeleting ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <TrashIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-3">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-ink-200 resize-none text-ink-900"
                          rows={3}
                          disabled={updatingComment}
                          maxLength={1000}
                          aria-label="Editar comentario"
                        />
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className={`text-xs tabular-nums ${editingText.length > 900 ? 'text-red-600' : 'text-ink-400'}`}>
                            {editingText.length}/1000
                          </span>
                          <div className="flex items-center gap-2">
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
                      </div>
                    ) : (
                      <p className="mt-2 text-ink-700 leading-relaxed whitespace-pre-line break-words">
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