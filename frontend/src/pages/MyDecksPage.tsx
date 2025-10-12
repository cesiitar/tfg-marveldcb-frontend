import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { Deck } from '../types/card'

const MyDecksPage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar mazos del usuario cuando se autentica
  const loadUserDecks = async () => {
    if (!isAuthenticated) return

    setLoading(true)

    try {
      const auth0Id = user?.sub
      if (!auth0Id) {
        throw new Error('No se pudo obtener el Auth0 ID del usuario')
      }
      const userDecks = await apiService.getUserDecks(auth0Id)
      setDecks(userDecks || [])
    } catch (err) {
      console.error('Error:', err)
      // Si hay error, mostrar array vacío en lugar de mensaje de error
      setDecks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadUserDecks()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Acceso Requerido</h1>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para acceder a tus mazos personales
          </p>
          <p className="text-sm text-gray-500">
            Usa el botón "Login" en el header para iniciar sesión
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Mazos</h1>
            <p className="text-gray-600">Gestiona tus mazos personales de Marvel Champions</p>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Cerrar Sesión
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mazos...</p>
          </div>
        )}

        {!loading && (
          <div>
            {decks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  ¡Bienvenido, {user?.name || 'Usuario'}!
                </h2>
                <p className="text-gray-600 mb-6">
                  Aún no has creado ningún mazo. ¡Crea tu primer mazo para empezar!
                </p>
                <button className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 font-medium">
                  <Link to="/create-deck">Crear Mi Primer Mazo</Link>
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-700">
                    Tus Mazos ({decks.length})
                  </h2>
                  <button className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors duration-200 font-medium">
                    <Link to="/create-deck">Crear Nuevo Mazo</Link>
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {decks.map((deck) => (
                    <div key={deck.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{deck.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">Héroe: {deck.hero_name}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{deck.cards.length} cartas</span>
                        <span>ID: {deck.id}</span>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors duration-200">
                          Ver
                        </button>
                        <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors duration-200">
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyDecksPage

