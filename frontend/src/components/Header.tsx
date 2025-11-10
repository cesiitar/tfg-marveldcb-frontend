import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth()

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
              My Decks
            </Link>
            <Link 
              to="/decks" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Decklists
            </Link>
            <Link 
              to="/games-history" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Game History
            </Link>
            <Link 
              to="/cards" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Cards
            </Link>
            <Link 
              to="/reviews" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Reviews
            </Link>
            <Link 
              to="/rules" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              Rules
            </Link>
            <Link 
              to="/faq" 
              className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-lg"
            >
              FAQs
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                >
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{user?.name || 'Usuario'}</span>
                </Link>
                <button 
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleLoginClick}
                  className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                >
                  Login
                </button>
                <button 
                  onClick={handleSignupClick}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Sign Up
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
                My Decks
              </Link>
              <Link 
                to="/decks" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Decklists
              </Link>
              <Link 
                to="/games-history" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Game History
              </Link>
              <Link 
                to="/cards" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Cards
              </Link>
              <Link 
                to="/reviews" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Reviews
              </Link>
              <Link 
                to="/rules" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Rules
              </Link>
              <Link 
                to="/faq" 
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQs
              </Link>
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
                      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                      className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleLoginClick}
                      className="px-4 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200 text-left"
                    >
                      Login
                    </button>
                    <button 
                      onClick={handleSignupClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-left"
                    >
                      Sign Up
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
