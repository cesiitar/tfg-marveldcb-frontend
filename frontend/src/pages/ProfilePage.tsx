import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  pageHeaderButton,
} from '../components/ui/page-header'
import { AnimatedNumber } from '../components/ui/animated-number'
import { usePageMeta } from '../lib/seo'

const ProfilePage: React.FC = () => {
  usePageMeta({ title: 'Mi perfil', noindex: true })
  const { user, isAuthenticated, logout } = useAuth()
  const [deckCount, setDeckCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [, setError] = useState<string | null>(null)

  // Cargar estadísticas del usuario
  const loadUserStats = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    setError(null)

    try {
      const auth0Id = user?.sub
      if (!auth0Id) {
        throw new Error('No se pudo obtener el Auth0 ID del usuario')
      }
      const stats = await apiService.getUserStats(auth0Id)
      const primary = stats && typeof stats.deckCount === 'number' ? stats.deckCount : 0
      // Fallback: si el endpoint de stats no está, contar mazos del usuario
      if (primary === 0) {
        try {
          const decks = await apiService.getUserDecks(auth0Id)
          setDeckCount(Array.isArray(decks) ? decks.length : 0)
        } catch {
          setDeckCount(primary)
        }
      } else {
        setDeckCount(primary)
      }
    } catch (err) {
      console.error('Error:', err)
      // Si hay error, mostrar 0 en lugar de mensaje de error
      setDeckCount(0)
      setError(null) // No mostrar error, solo usar valor por defecto
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadUserStats()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Perfil de Usuario</h1>
          <p className="text-gray-600">Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Tu cuenta</PageHeaderEyebrow>
          <PageHeaderTitle>Mi Perfil</PageHeaderTitle>
          <PageHeaderDescription>{user?.name || 'Usuario'}</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className={pageHeaderButton.secondary}
          >
            Cerrar Sesión
          </button>
        </PageHeaderActions>
      </PageHeader>

      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Información del usuario */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Información Personal</h2>
            
            {user?.picture && (
              <div className="flex items-center space-x-4">
                <img
                  src={user.picture}
                  alt="Avatar"
                  className="w-16 h-16 rounded-xl ring-1 ring-ink-900/10 object-cover"
                />
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {user.name || 'Usuario'}
                  </p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700">Nombre:</span>
                <span className="ml-2 text-gray-600">{user?.name || 'No disponible'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">{user?.email || 'No disponible'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email verificado:</span>
                <span className="ml-2 text-gray-600">
                  {user?.email_verified ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Estadísticas</h2>
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Cargando estadísticas...</p>
              </div>
            )}

            {!loading && (
              <div className="bg-gray-50 p-6 rounded-xl text-center ring-1 ring-ink-900/[0.05]">
                <AnimatedNumber value={deckCount} className="block font-display text-5xl font-extrabold text-brand-600 mb-2" />
                <div className="text-lg text-gray-600">Mazos Creados</div>
                <div className="text-sm text-gray-500 mt-2">
                  {deckCount === 0 ? 'Aún no has creado ningún mazo' : 'Total de mazos en tu colección'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
