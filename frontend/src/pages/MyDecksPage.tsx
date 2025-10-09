import React, { useState } from 'react'

const MyDecksPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica de login
    console.log('Login:', loginData)
    setIsLoggedIn(true)
    setShowLoginForm(false)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }
    // Aquí iría la lógica de registro
    console.log('Register:', registerData)
    setIsLoggedIn(true)
    setShowRegisterForm(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setLoginData({ email: '', password: '' })
    setRegisterData({ username: '', email: '', password: '', confirmPassword: '' })
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          
          <div className="relative z-10 text-center py-12 px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-white mb-4">
                Mis Mazos
              </h1>
              <p className="text-lg text-gray-300 mb-6">
                Gestiona tus mazos personales de Marvel Champions
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative -mt-8 z-20 px-4">
          <div className="max-w-md mx-auto">
            {/* Login/Register Forms */}
            {showLoginForm ? (
              <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Iniciar Sesión</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLoginForm(false)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => {
                        setShowLoginForm(false)
                        setShowRegisterForm(true)
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </div>
            ) : showRegisterForm ? (
              <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Crear Cuenta</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de usuario
                    </label>
                    <input
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      Crear Cuenta
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(false)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => {
                        setShowRegisterForm(false)
                        setShowLoginForm(true)
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Inicia sesión aquí
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Acceso Requerido
                </h2>
                <p className="text-gray-600 mb-6">
                  Necesitas iniciar sesión para acceder a tus mazos personales
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => setShowRegisterForm(true)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                  >
                    Registrarse
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Aquí iría el contenido cuando el usuario esté logueado
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        <div className="relative z-10 text-center py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">
              Mis Mazos
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Gestiona tus mazos personales de Marvel Champions
            </p>
            
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ¡Bienvenido!
            </h2>
            <p className="text-gray-600 mb-6">
              Aquí podrás gestionar tus mazos personales. Esta funcionalidad estará disponible próximamente.
            </p>
            <div className="text-sm text-gray-500">
              <p>Funcionalidades próximas:</p>
              <ul className="mt-2 space-y-1">
                <li>• Crear mazos privados</li>
                <li>• Editar mazos existentes</li>
                <li>• Compartir mazos con otros usuarios</li>
                <li>• Estadísticas de tus mazos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyDecksPage

