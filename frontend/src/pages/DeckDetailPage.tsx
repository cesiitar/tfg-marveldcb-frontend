import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck, DeckComment } from '../types/card'
import { translateCardType } from '../utils/typeTranslations'
import { getClassPillClasses, getClassColor, getAspectHeaderGradient } from '../utils/classColors'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { ArrowLeftIcon, CalendarBlankIcon, CardsIcon, CardsThreeIcon, ChartBarIcon, ChatCircleDotsIcon, FileTextIcon, HeartIcon, PaperPlaneTiltIcon, PencilSimpleIcon, TagIcon, TrashIcon, UserIcon, WarningIcon } from '@phosphor-icons/react'

const DeckDetailPage: React.FC = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth0()
  const { showToast, ToastContainer } = useToast()
  const [deck, setDeck] = useState<Deck | null>(null)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mazo...</p>
        </div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8 text-center">
          <div className="text-red-500 mb-4">
            <WarningIcon className="w-16 h-16 mx-auto" weight="duotone" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Mazo no encontrado'}</p>
          <Link 
            to="/decks" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" weight="bold" aria-hidden="true" />
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
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] overflow-hidden mb-8">
          <div className={`bg-gradient-to-r ${getAspectHeaderGradient((deck as any).aspect)} px-6 py-8`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{deck.name}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-white">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5" weight="duotone" aria-hidden="true" />
                    <span className="font-medium">{deck.hero_name}</span>
                  </div>
                  {(deck as any).aspect && (
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-5 h-5" weight="duotone" aria-hidden="true" />
                      <span className="font-medium capitalize">{(deck as any).aspect}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CardsThreeIcon className="w-5 h-5" weight="duotone" aria-hidden="true" />
                    <span className="font-medium">{totalCards} cartas</span>
                  </div>
                  {deck.created_at && (
                    <div className="flex items-center gap-2">
                      <CalendarBlankIcon className="w-5 h-5" weight="duotone" aria-hidden="true" />
                      <span>{new Date(deck.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <Link 
                to="/decks" 
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" weight="bold" aria-hidden="true" />
                Volver a Decklists
              </Link>
            </div>
          </div>
          
          {/* Información adicional en el header */}
          <div className="px-6 py-4 bg-white border-t">
            <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Creador:</span>
                  <span className="font-medium text-gray-900">{deck.creator_name || 'Anónimo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-gray-900">{totalCards}/50 cartas</span>
                </div>
              </div>
              {isAuthenticated && (
                <button
                  onClick={handleToggleFavorite}
                  disabled={loadingFavorite}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isFavorite 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  } ${loadingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingFavorite ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <HeartIcon className="w-5 h-5" weight={isFavorite ? 'fill' : 'regular'} aria-hidden="true" />
                  )}
                  <span className="font-medium">
                    {isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Descripción */}
          <div className="lg:col-span-1 space-y-6">
            {/* Descripción del mazo */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <div className="w-10 h-10 bg-ink-900 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <FileTextIcon className="w-5 h-5 text-white" weight="duotone" aria-hidden="true" />
                </div>
                Descripción
              </h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {formatDescription(deck.description)}
                </p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Lista de cartas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-ink-50 px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <div className="w-10 h-10 bg-ink-900 rounded-lg flex items-center justify-center mr-3 shadow-md">
                    <CardsIcon className="w-5 h-5 text-white" weight="duotone" aria-hidden="true" />
                  </div>
                  <span>Lista de Cartas</span>
                  <span className="ml-2 px-3 py-1 bg-ink-100 text-ink-700 rounded-full text-sm font-bold">
                    {totalCards}
                  </span>
                </h2>
              </div>
              
              <div className="p-6 max-h-[600px] overflow-y-auto">
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
                      const typeLabel = translateCardType(type)
                      
                      return (
                        <div key={type} className="mb-4 last:mb-0">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="bg-ink-100 text-ink-800 text-xs font-bold px-3 py-1 rounded-full mr-2 shadow-sm">
                              {cards.length}
                            </span>
                            <span className="text-base">{typeLabel}</span>
                          </h3>
                          
                          <div className="space-y-1.5">
                            {cards.map((card: any, idx: number) => {
                              const isHeroCard = card.clase === 'hero' || card.type === 'hero'
                              const isBasic = card.clase === 'basic'
                              return (
                                <div key={`${card.name}-${idx}`} className="flex items-center justify-between py-2 px-3 hover:bg-ink-50 transition-all duration-200 rounded-lg text-sm group border border-transparent hover:border-ink-200">
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <span className="text-xs font-bold text-gray-700 min-w-[1.5rem] bg-gray-100 px-1.5 py-0.5 rounded">
                                      {card.quantity}x
                                    </span>
                                    
                                    {/* Indicador de carta automática del héroe */}
                                    {isHeroCard && (
                                      <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 shadow-sm" title="Carta automática del héroe"></div>
                                    )}
                                    
                                    {/* Punto de color según clase */}
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${getClassColor(card.clase)}`}></div>
                                    
                                    <span 
                                      className="text-gray-800 font-medium truncate cursor-help group-hover:text-brand-700 transition-colors" 
                                      title={`Set: ${card.set}`}
                                    >
                                      {card.name}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                                    {isBasic && (
                                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium border border-gray-200">
                                        basic
                                      </span>
                                    )}
                                    {card.clase && card.clase !== 'basic' && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shadow-sm ${getClassPillClasses(card.clase)}`}>
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

        {/* Estadísticas debajo del mazo */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          {/* Distribución por Aspecto */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-10 h-10 bg-ink-900 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <ChartBarIcon className="w-5 h-5 text-white" weight="duotone" aria-hidden="true" />
              </div>
              Distribución por Aspecto
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
                <div className="space-y-5">
                  {aspectStats.map(({ clase, count, percentage }) => {
                    const getGradientClass = (cls: string) => {
                      switch (cls.toLowerCase()) {
                        case 'aggression': return 'from-red-500 to-red-600'
                        case 'justice': return 'from-amber-500 to-amber-600'
                        case 'leadership': return 'from-sky-500 to-sky-600'
                        case 'protection': return 'from-green-500 to-green-600'
                        case 'hero': return 'from-purple-500 to-purple-600'
                        case 'pool': return 'from-teal-500 to-teal-600'
                        default: return 'from-gray-400 to-gray-500'
                      }
                    }
                    
                    return (
                      <div key={clase} className="group hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getGradientClass(clase)} shadow-md`}></div>
                            <span className="text-sm font-semibold capitalize text-gray-800">{clase}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">{count}</span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`h-3 rounded-full bg-gradient-to-r ${getGradientClass(clase)} shadow-sm transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Tipos de cartas */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-10 h-10 bg-ink-900 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <TagIcon className="w-5 h-5 text-white" weight="duotone" aria-hidden="true" />
              </div>
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
                <div className="space-y-4">
                  {sortedTypes.map(({ type, count }) => {
                    const percentage = Math.round((count / totalCards) * 100)
                    return (
                      <div key={type} className="group hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="capitalize font-semibold text-gray-800 text-sm">{type.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">{count}</span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className="bg-ink-800 h-3 rounded-full shadow-sm transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Comentarios debajo de estadísticas */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-10 h-10 bg-ink-900 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <ChatCircleDotsIcon className="w-5 h-5 text-white" weight="duotone" aria-hidden="true" />
              </div>
              <span>Comentarios</span>
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                {comments.length}
              </span>
            </h3>

            {/* Formulario para añadir comentario (solo si está autenticado) */}
            {isAuthenticated ? (
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe tu comentario..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={savingComment}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${newComment.length > 900 ? 'text-red-500' : 'text-gray-500'}`}>
                    {newComment.length}/1000 caracteres
                  </span>
                </div>
                <button
                  onClick={handleSubmitComment}
                  disabled={savingComment || !newComment.trim() || newComment.length > 1000}
                  className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingComment ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
                <p>Debes iniciar sesión para comentar</p>
              </div>
            )}

            {/* Lista de comentarios */}
            {loadingComments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Cargando comentarios...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const isEditing = editingCommentId === comment.id
                  const isOwn = isOwnComment(comment)
                  const isDeleting = deletingCommentId === comment.id

                  return (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4 mb-4 last:mb-0 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-brand-600 rounded-[10px] flex items-center justify-center shadow-md flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-white" weight="duotone" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 text-base">
                                {comment.author_name || 'Usuario anónimo'}
                              </p>
                              {isOwn && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium border border-blue-200">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {comment.updated_at && comment.updated_at !== comment.created_at && (
                                <span className="ml-1 text-gray-400">(editado)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {isOwn && !isEditing && (
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleStartEdit(comment)}
                              disabled={isDeleting}
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                              title="Editar comentario"
                            >
                              <PencilSimpleIcon className="w-4 h-4" weight="duotone" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={isDeleting}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Eliminar comentario"
                            >
                              {isDeleting ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                        <div className="ml-10 mt-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                            disabled={updatingComment}
                            maxLength={1000}
                          />
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${editingText.length > 900 ? 'text-red-500' : 'text-gray-500'}`}>
                              {editingText.length}/1000 caracteres
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleCancelEdit}
                                disabled={updatingComment}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={updatingComment || !editingText.trim() || editingText.length > 1000}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingComment ? 'Guardando...' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm leading-relaxed ml-13 bg-white p-3 rounded-lg border border-gray-100">
                          {comment.comment_text}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ToastContainer />
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteCommentConfirm}
        title="Eliminar Comentario"
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