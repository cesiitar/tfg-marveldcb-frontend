import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CaretDownIcon, EnvelopeSimpleIcon, ListIcon, XIcon } from '@phosphor-icons/react'

const navItems = [
  { to: '/mydecks', label: 'Mis Mazos' },
  { to: '/decks', label: 'Mazos' },
  { to: '/cards', label: 'Cartas' },
  { to: '/games-history', label: 'Historial' },
  { to: '/ai-recommendation', label: 'Recomendación IA' },
  { to: '/faq', label: 'FAQ' },
]

const contactHref = 'mailto:aiforge.soporte@gmail.com?subject=Reporte de Error - AIForge&body=Por favor, describe el error o sugerencia:'

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-2 text-[15px] font-medium rounded-md transition-colors duration-200 ${
    isActive
      ? 'text-white after:absolute after:left-3 after:right-3 after:-bottom-[13px] after:h-[2px] after:bg-brand-500'
      : 'text-ink-300 hover:text-white hover:bg-white/5'
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-between px-3 py-3 rounded-lg font-medium transition-colors duration-200 ${
    isActive ? 'bg-white/10 text-white' : 'text-ink-300 hover:text-white hover:bg-white/5'
  }`

const Logo: React.FC = () => (
  <Link to="/" className="group flex items-center gap-3 flex-shrink-0">
    <span className="relative w-10 h-10 rounded-[10px] bg-brand-600 flex items-center justify-center shadow-brand ring-1 ring-inset ring-white/15 transition-transform duration-300 ease-out group-hover:-rotate-6">
      <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden="true">
        <path d="M7 25 16 6l9 19h-5l-4-9-4 9z" fill="white" />
      </svg>
    </span>
    <span className="font-display font-extrabold text-2xl tracking-tight text-white" style={{ fontStretch: '85%' }}>
      AI<span className="text-brand-400">Forge</span>
    </span>
  </Link>
)

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
    <header className="sticky top-0 z-50 bg-ink-900 border-b border-white/[0.06] shadow-[0_1px_0_0_rgb(0_0_0/0.2)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-6">
          <Logo />

          {/* Navegación de escritorio */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label="Principal">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Contacto y autenticación */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <a
              href={contactHref}
              className="p-2 rounded-md text-ink-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
              title="Contacto"
              aria-label="Contacto"
            >
              <EnvelopeSimpleIcon className="w-5 h-5" weight="duotone" aria-hidden="true" />
            </a>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg text-ink-200 hover:text-white hover:bg-white/5 font-medium"
                  aria-expanded={isUserMenuOpen}
                >
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt="Avatar"
                      className="w-8 h-8 rounded-[9px] ring-1 ring-white/15 object-cover"
                    />
                  )}
                  <span className="max-w-[140px] truncate text-sm">{user?.name || 'Usuario'}</span>
                  <CaretDownIcon className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} weight="bold" aria-hidden="true" />
                </button>

                {isUserMenuOpen && (
                  <div className="animate-rise-in absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl p-1.5 z-50 ring-1 ring-ink-900/5">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-medium text-ink-700 rounded-lg hover:bg-ink-100 transition-colors"
                    >
                      Mi Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout({ logoutParams: { returnTo: window.location.origin } })
                      }}
                      className="block w-full text-left px-3 py-2 text-sm font-medium text-ink-700 rounded-lg hover:bg-ink-100 transition-colors"
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
                  className="px-3 py-2 text-sm font-medium text-ink-200 hover:text-white rounded-md"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={handleSignupClick}
                  className="px-4 py-2 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-500 shadow-brand"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <button
            className="lg:hidden p-2 -mr-2 rounded-md text-ink-300 hover:text-white hover:bg-white/5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <XIcon className="w-6 h-6" weight="bold" aria-hidden="true" />
            ) : (
              <ListIcon className="w-6 h-6" weight="bold" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="lg:hidden animate-rise-in pb-5 pt-2 border-t border-white/[0.06]">
            <nav className="flex flex-col gap-0.5" aria-label="Principal móvil">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={mobileLinkClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <a
                href={contactHref}
                className="flex items-center gap-2 px-3 py-3 rounded-lg font-medium text-ink-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <EnvelopeSimpleIcon className="w-5 h-5" weight="duotone" aria-hidden="true" />
                Contacto
              </a>
              <div className="flex flex-col gap-2 pt-4 mt-3 border-t border-white/[0.06]">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="px-3 py-2 text-ink-200 hover:text-white font-medium flex items-center gap-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {user?.picture && (
                        <img
                          src={user.picture}
                          alt="Avatar"
                          className="w-8 h-8 rounded-[9px] ring-1 ring-white/15 object-cover"
                        />
                      )}
                      <span>{user?.name || 'Usuario'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        logout({ logoutParams: { returnTo: window.location.origin } })
                      }}
                      className="px-3 py-2 text-ink-300 hover:text-white font-medium text-left"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLoginClick}
                      className="px-4 py-2.5 text-ink-100 font-medium rounded-lg ring-1 ring-inset ring-white/15 hover:bg-white/5"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={handleSignupClick}
                      className="px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-semibold"
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
