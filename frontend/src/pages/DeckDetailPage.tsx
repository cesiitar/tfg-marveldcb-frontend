import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { apiService } from '../services/api'
import { Deck, DeckComment } from '../types/card'
import { translateCardType } from '../utils/typeTranslations'
import { getClassPillClasses, getClassColor, getAspectHeaderGradient } from '../utils/classColors'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

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
        console.log('🔍 Deck recibido del backend:', d)
        console.log('🔍 Descripción:', d.description)
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
          <div className={`bg-gradient-to-r ${getAspectHeaderGradient((deck as any).aspect)} px-6 py-8`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{deck.name}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-white">
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
                    <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descripción
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {formatDescription(deck.description)}
              </p>
            </div>
          </div>

          {/* Columna derecha - Lista de cartas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div key={type} className="mb-3 last:mb-0">
                          <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center">
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full mr-2">
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
                                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full flex-shrink-0" title="Carta automática del héroe"></div>
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

        {/* Estadísticas debajo del mazo */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          {/* Distribución por Aspecto */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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

          {/* Tipos de cartas */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="bg-gradient-to-r from-gray-400 to-gray-500 h-2 rounded-full"
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

        {/* Comentarios debajo de estadísticas */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comentarios ({comments.length})
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
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
                    <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 text-sm">
                                {comment.author_name || 'Usuario anónimo'}
                              </p>
                              {isOwn && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
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
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
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
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
                        <p className="text-gray-700 text-sm leading-relaxed ml-10">
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