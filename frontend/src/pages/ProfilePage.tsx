import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Perfil de Usuario</h1>
          <p className="text-gray-600">Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Información del usuario */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Información Personal</h2>
            
            {user?.picture && (
              <div className="flex items-center space-x-4">
                <img
                  src={user.picture}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full"
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-accent-500">0</div>
                <div className="text-sm text-gray-600">Mazos Creados</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-accent-500">0</div>
                <div className="text-sm text-gray-600">Cartas Favoritas</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-accent-500">0</div>
                <div className="text-sm text-gray-600">Partidas Jugadas</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-accent-500">0</div>
                <div className="text-sm text-gray-600">Victorias</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Actividad Reciente</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600 text-center">No hay actividad reciente</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
