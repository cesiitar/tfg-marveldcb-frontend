import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar el menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // Abrir registro de Auth0 (pantalla con email y proveedores sociales)
  const handleSignupClick = async () => {
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    })
  }

  // Abrir login clásico (usuario/contraseña o sociales si están activos)
  const handleLoginClick = async () => {
    await loginWithRedirect({
      authorizationParams: {
        prompt: 'login'
      }
    })
  }

  return (
    <header className="bg-slate-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-display font-bold text-2xl">A</span>
            </div>
            <span className="text-white font-display font-bold text-3xl">AI<span className="text-blue-400">Forge</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/mydecks" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Mis Mazos
            </Link>
            <Link 
              to="/decks" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Mazos
            </Link>
            <Link 
              to="/cards" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Cartas
            </Link>
            <Link 
              to="/games-history" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Historial de Partidas
            </Link>
            <Link 
              to="/ai-recommendation" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Recomendación IA
            </Link>
            <Link 
              to="/faq" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Preguntas Frecuentes
            </Link>
          </nav>

          {/* Contacto y Auth Buttons */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Contacto */}
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=aiforge.soporte@gmail.com&su=Reporte de Error - AIForge&body=Por favor, describe el error o sugerencia:`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contacto
            </a>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 focus:outline-none"
                >
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{user?.name || 'Usuario'}</span>
                  <svg className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Mi Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout({ logoutParams: { returnTo: window.location.origin } })
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={handleLoginClick}
                  className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={handleSignupClick}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-300 hover:text-blue-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/mydecks" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Mis Mazos
              </Link>
              <Link 
                to="/decks" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Mazos
              </Link>
              <Link 
                to="/cards" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Cartas
              </Link>
              <Link 
                to="/games-history" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Historial de Partidas
              </Link>
              <Link 
                to="/ai-recommendation" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Recomendación IA
              </Link>
              <Link 
                to="/faq" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Preguntas Frecuentes
              </Link>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=aiforge.soporte@gmail.com&su=Reporte de Error - AIForge&body=Por favor, describe el error o sugerencia:`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contacto
              </a>
              <div className="flex flex-col space-y-2 pt-4 border-t border-slate-700">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/profile" 
                      className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-left flex items-center space-x-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {user?.picture && (
                        <img
                          src={user.picture}
                          alt="Avatar"
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>{user?.name || 'Usuario'}</span>
                    </Link>
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false)
                        logout({ logoutParams: { returnTo: window.location.origin } })
                      }}
                      className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-left"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleLoginClick}
                      className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-left"
                    >
                      Iniciar Sesión
                    </button>
                    <button 
                      onClick={handleSignupClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-left"
                    >
                      Registrarse
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
