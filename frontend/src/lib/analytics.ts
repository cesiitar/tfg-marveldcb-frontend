// Google Analytics 4 con consentimiento previo.
//
// - Analytics NO se carga (ni pone cookies) hasta que el visitante acepta en el aviso
//   de cookies (components/CookieConsent.tsx). Si rechaza, no se carga nunca.
// - Las vistas de página se envían a mano (AIForge es una SPA): en GA4 está desactivada
//   la detección automática por historial, para no contarlas dos veces.
// - Solo se mide en el dominio real; en local y en los despliegues de prueba no se envía nada.
const GA_ID = 'G-ZMYXP44B50'
const CONSENT_KEY = 'aiforge_cookie_consent'
const PRODUCTION_HOST = 'aiforgedecks.com'

export type ConsentChoice = 'granted' | 'denied'

/** Evento que reabre el aviso (enlace "Preferencias de cookies" del pie). */
export const OPEN_CONSENT_EVENT = 'aiforge:open-cookie-consent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let loaded = false

// Dirección sin parámetros: nunca deben salir hacia Google los códigos de inicio de
// sesión de Auth0 (?code=…&state=…) ni ningún otro parámetro de la URL.
const cleanLocation = () => window.location.origin + window.location.pathname

const canMeasure = () => {
  try {
    return window.location.hostname === PRODUCTION_HOST || localStorage.getItem('aiforge_ga_debug') === '1'
  } catch {
    return false
  }
}

export function getConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

function loadAnalytics() {
  if (loaded || !canMeasure()) return
  loaded = true
  window.dataLayer = window.dataLayer || []
  // gtag necesita recibir `arguments` tal cual (no un array), igual que en el fragmento oficial.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  // page_location fijado a mano: lo heredan también los eventos automáticos (scroll, clics…).
  window.gtag('config', GA_ID, { send_page_view: false, page_location: cleanLocation() })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
}

/** Borra las cookies de Analytics (al retirar el consentimiento). */
function clearAnalyticsCookies() {
  const names = document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n === '_ga' || n.startsWith('_ga_'))
  for (const name of names) {
    for (const domain of ['', `.${PRODUCTION_HOST}`, window.location.hostname]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    // Sin almacenamiento disponible: la elección solo vale para esta visita.
  }
  // Interruptor oficial de GA para dejar de medir sin recargar la página.
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = choice !== 'granted'
  if (choice === 'granted') {
    loadAnalytics()
    trackPageView()
  } else {
    clearAnalyticsCookies()
  }
}

/** Arranca Analytics si el visitante ya había aceptado en una visita anterior. */
export function initAnalytics() {
  if (getConsent() === 'granted') loadAnalytics()
}

/** Envía una vista de página y deja la dirección limpia para los eventos que vengan después. */
export function trackPageView() {
  if (!loaded || !window.gtag || getConsent() !== 'granted') return
  window.gtag('set', { page_location: cleanLocation(), page_title: document.title })
  window.gtag('event', 'page_view', {
    page_location: cleanLocation(),
    page_path: window.location.pathname,
    page_title: document.title,
  })
}
