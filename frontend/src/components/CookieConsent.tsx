// Aviso de cookies: Analytics solo se activa si el visitante acepta.
// "Rechazar" tiene el mismo peso visual que "Aceptar" y la web funciona igual en ambos casos.
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getConsent, initAnalytics, OPEN_CONSENT_EVENT, setConsent, trackPageView, type ConsentChoice } from '../lib/analytics'

const CookieConsent: React.FC = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Al arrancar: cargar Analytics si ya se aceptó antes, o mostrar el aviso si aún no se ha elegido.
  useEffect(() => {
    initAnalytics()
    setOpen(getConsent() === null)
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_CONSENT_EVENT, reopen)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen)
  }, [])

  // Vista de página en cada cambio de ruta. Se espera un momento para que la página
  // nueva haya puesto su <title> (las páginas se cargan de forma diferida).
  useEffect(() => {
    const timer = window.setTimeout(trackPageView, 700)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const choose = (choice: ConsentChoice) => {
    setConsent(choice)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-ink-900 text-ink-200 shadow-2xl ring-1 ring-white/10 p-5 sm:p-6 animate-rise-in">
        <p className="font-display text-lg font-extrabold text-white">Cookies de analítica</p>
        <p className="mt-2 text-sm leading-relaxed">
          AIForge usa Google Analytics para saber cuántas visitas recibe y qué páginas se usan más. Solo se activa si
          aceptas; la web funciona igual si lo rechazas. Más detalles en la{' '}
          <Link to="/privacy" className="text-white underline underline-offset-2 hover:text-brand-300">
            política de privacidad
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button type="button" onClick={() => choose('denied')} className="btn btn-dark ring-1 ring-inset ring-white/20">
            Rechazar
          </button>
          <button type="button" onClick={() => choose('granted')} className="btn btn-primary">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
