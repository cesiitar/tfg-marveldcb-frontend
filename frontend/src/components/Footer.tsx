import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-20 bg-ink-900 text-ink-300 overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 halftone opacity-60 pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Logo y descripción */}
          <div className="md:col-span-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-[9px] bg-brand-600 flex items-center justify-center ring-1 ring-inset ring-white/15">
                <svg viewBox="0 0 32 32" className="w-5 h-5" aria-hidden="true">
                  <path d="M7 25 16 6l9 19h-5l-4-9-4 9z" fill="white" />
                </svg>
              </span>
              <span className="text-xl font-display font-extrabold text-white" style={{ fontStretch: '85%' }}>
                AI<span className="text-brand-400">Forge</span>
              </span>
            </div>
            <p className="max-w-md leading-relaxed">
              Crea mazos de Marvel Champions, registra tus partidas y recibe recomendaciones
              generadas con inteligencia artificial.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div className="md:col-span-3">
            <p className="eyebrow !text-ink-400 mb-4">Explorar</p>
            <ul className="space-y-2.5">
              <li><Link to="/mydecks" className="hover:text-white transition-colors">Mis Mazos</Link></li>
              <li><Link to="/decks" className="hover:text-white transition-colors">Mazos de la comunidad</Link></li>
              <li><Link to="/cards" className="hover:text-white transition-colors">Cartas</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas frecuentes</Link></li>
            </ul>
          </div>

          {/* Proyecto y contacto */}
          <div className="md:col-span-3">
            <p className="eyebrow !text-ink-400 mb-4">Proyecto</p>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="hover:text-white transition-colors">Sobre AIForge</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
              <li>
                <a href="mailto:aiforge.soporte@gmail.com" className="hover:text-white transition-colors">
                  Soporte
                </a>
              </li>
              <li>
                <a
                  href="mailto:aiforge.soporte@gmail.com?subject=Reporte de Error - AIForge"
                  className="hover:text-white transition-colors"
                >
                  Reportar un error
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.08] mt-12 pt-6 flex flex-col sm:flex-row gap-2 justify-between text-sm text-ink-500">
          <p>© 2024–{new Date().getFullYear()} AIForge. Proyecto TFG · Todos los derechos reservados.</p>
          <p className="font-mono text-xs uppercase tracking-[0.16em]">Hecho para Marvel Champions</p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-500 max-w-3xl">
          Proyecto fan sin ánimo de lucro, no afiliado a Fantasy Flight Games ni a Marvel. Marvel Champions: The Card
          Game es un producto de Fantasy Flight Games. Datos de cartas:{' '}
          <a href="https://marvelcdb.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white transition-colors">
            MarvelCDB
          </a>
          .
        </p>
      </div>
    </footer>
  )
}

export default Footer
