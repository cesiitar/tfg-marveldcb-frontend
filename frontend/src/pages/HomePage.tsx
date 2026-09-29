import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { m, useInView } from 'motion/react'
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CardsIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  HeartIcon,
  SparkleIcon,
  TrophyIcon,
  UsersThreeIcon,
  type Icon,
} from '@phosphor-icons/react'
import { apiService } from '../services/api'
import { AnimatedNumber } from '../components/ui/animated-number'
import { Reveal, RevealGroup, RevealItem, easeOut } from '../components/motion/reveal'
import { SplitWords } from '../components/motion/split-words'
import { TiltCard } from '../components/motion/tilt-card'
import { Magnetic } from '../components/motion/magnetic'
import { CardFan } from '../components/home/card-fan'
import { ScrollMarquee } from '../components/home/scroll-marquee'
import { usePageMeta } from '../lib/seo'
import pageMeta from '../lib/page-meta.json'

/** Cifra global grande; cuenta desde 0 cuando entra en pantalla. */
const BandStat: React.FC<{ label: string; value: number; loading: boolean; Icon: Icon }> = ({ label, value, loading, Icon }) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  return (
    <RevealItem className="px-6 py-8 md:px-10 md:py-10">
      <div ref={ref} className="flex items-center gap-2 text-ink-500">
        <Icon className="w-5 h-5 text-brand-600" weight="duotone" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      {loading ? (
        <div className="mt-4 h-14 w-24 bg-ink-100 rounded-lg animate-pulse" />
      ) : (
        <AnimatedNumber
          value={value}
          countFrom={0}
          play={inView}
          stiffness={40}
          damping={14}
          className="mt-3 block font-display text-6xl md:text-7xl font-extrabold text-ink-900 leading-none"
        />
      )}
    </RevealItem>
  )
}

const UserStat: React.FC<{ label: string; value: number; loading: boolean; Icon: Icon; tone?: 'brand' | 'ink' }> = ({ label, value, loading, Icon, tone = 'ink' }) => (
  <RevealItem>
    <TiltCard maxTilt={5} className="group bg-white rounded-xl p-5 ring-1 ring-ink-900/[0.06] shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="relative flex items-start justify-between">
        <span className="text-sm font-medium text-ink-500">{label}</span>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 ${tone === 'brand' ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-700'}`}>
          <Icon className="w-5 h-5" weight="duotone" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <div className="relative mt-3 h-9 w-14 bg-ink-100 rounded-md animate-pulse" />
      ) : (
        <AnimatedNumber value={value} className="relative mt-2 block font-display text-4xl font-extrabold text-ink-900" />
      )}
    </TiltCard>
  </RevealItem>
)

const HomePage: React.FC = () => {
  usePageMeta(pageMeta.home)
  const { isAuthenticated, user } = useAuth0()
  const [stats, setStats] = useState({
    // Estadísticas globales
    totalDecks: 0,
    totalGames: 0,
    totalWins: 0,
    // Estadísticas del usuario (solo si está logueado)
    myDecks: 0,
    myGames: 0,
    myWins: 0,
    myFavorites: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)

        // Siempre cargar estadísticas globales
        try {
          const decks = await apiService.getDecks()
          const gameHistory = await apiService.getGameHistory(null, false)
          const games = gameHistory.games || []
          const wins = games.filter(g => g.result === 'win').length

          if (isAuthenticated && user?.sub) {
            // Si está logueado, cargar también estadísticas del usuario
            try {
              const userDecks = await apiService.getUserDecks(user.sub)
              const userGameHistory = await apiService.getGameHistory(user.sub, true)
              const userGames = userGameHistory.games || []
              const userWins = userGames.filter(g => g.result === 'win').length
              const favorites = await apiService.getUserFavorites(user.sub)

              setStats({
                totalDecks: decks.length,
                totalGames: games.length,
                totalWins: wins,
                myDecks: userDecks.length,
                myGames: userGames.length,
                myWins: userWins,
                myFavorites: favorites.length
              })
            } catch (err) {
              console.error('Error loading user stats:', err)
              // Si falla cargar estadísticas del usuario, solo mostrar globales
              setStats({
                totalDecks: decks.length,
                totalGames: games.length,
                totalWins: wins,
                myDecks: 0,
                myGames: 0,
                myWins: 0,
                myFavorites: 0
              })
            }
          } else {
            // No logueado: solo estadísticas globales
            setStats({
              totalDecks: decks.length,
              totalGames: games.length,
              totalWins: wins,
              myDecks: 0,
              myGames: 0,
              myWins: 0,
              myFavorites: 0
            })
          }
        } catch (err) {
          console.error('Error loading global stats:', err)
          // Si falla cargar partidas, solo usar datos de mazos
          try {
            const decks = await apiService.getDecks()
            setStats({
              totalDecks: decks.length,
              totalGames: 0,
              totalWins: 0,
              myDecks: 0,
              myGames: 0,
              myWins: 0,
              myFavorites: 0
            })
          } catch (err2) {
            console.error('Error loading decks:', err2)
          }
        }
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [isAuthenticated, user?.sub])

  return (
    <>
      {/* Progreso de lectura de la página */}
      <div className="scroll-progress fixed left-0 right-0 top-16 z-40 h-[3px] bg-brand-500" aria-hidden="true" />

      <div className="space-y-20 md:space-y-28">
        {/* Hero */}
        <section className="sd-hero-exit relative overflow-hidden rounded-2xl bg-ink-900 text-white shadow-2xl">
          <div className="absolute inset-0 halftone pointer-events-none" aria-hidden="true" />
          <div
            className="absolute -top-40 -right-32 w-[620px] h-[620px] rounded-full opacity-60 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgb(184 38 61 / 0.6), transparent 65%)' }}
            aria-hidden="true"
          />
          <div className="relative grid lg:grid-cols-12 gap-6 lg:gap-8 px-6 sm:px-10 lg:px-14 pt-12 pb-10 lg:py-20">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <m.span
                className="eyebrow !text-brand-300 mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: easeOut }}
              >
                Constructor de mazos · Marvel Champions
              </m.span>
              <SplitWords
                className="text-5xl sm:text-6xl lg:text-7xl text-white"
                segments={[
                  { text: 'Forja mazos que' },
                  { text: 'ganan', className: 'text-brand-400' },
                  { text: 'partidas.' },
                ]}
              />
              <Reveal delay={0.55} y={16}>
                <p className="mt-6 text-lg text-ink-300 max-w-xl leading-relaxed">
                  AIForge es una plataforma gratuita para crear mazos de Marvel Champions: construye
                  tus mazos, registra cada partida y deja que la inteligencia artificial te proponga
                  combinaciones pensadas para cada villano.
                </p>
              </Reveal>
              <Reveal delay={0.7} y={16} className="mt-9 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  to="/create-deck"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-semibold shadow-brand"
                >
                  Crear Mazo
                  <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" weight="bold" aria-hidden="true" />
                </Link>
                <Link
                  to="/add-game"
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-ink-900 rounded-lg hover:bg-ink-100 font-semibold"
                >
                  Añadir Partida
                </Link>
                <Link
                  to="/decks"
                  className="inline-flex items-center justify-center px-4 py-3.5 text-ink-200 hover:text-white font-semibold underline decoration-ink-600 underline-offset-[6px] hover:decoration-brand-400 transition-colors"
                >
                  Explorar mazos
                </Link>
              </Reveal>
            </div>

            <div className="lg:col-span-5 flex items-center justify-center">
              <CardFan className="scale-[0.78] sm:scale-100 -my-6 sm:my-0" />
            </div>
          </div>
        </section>

        {/* Estadísticas globales */}
        <section aria-label="Estadísticas globales">
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink-200 bg-white rounded-2xl ring-1 ring-ink-900/[0.06] shadow-sm">
            <BandStat label="Mazos totales" value={stats.totalDecks} loading={loading} Icon={CardsIcon} />
            <BandStat label="Partidas totales" value={stats.totalGames} loading={loading} Icon={ClipboardTextIcon} />
            <BandStat label="Victorias totales" value={stats.totalWins} loading={loading} Icon={TrophyIcon} />
          </RevealGroup>
        </section>

        {/* Estadísticas del usuario (solo si está logueado) */}
        {isAuthenticated && (
          <section>
            <Reveal className="flex items-end justify-between mb-5">
              <h2 className="text-2xl md:text-3xl text-ink-900">Tu actividad</h2>
              <Link to="/profile" className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Ver perfil
                <ArrowUpRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" weight="bold" aria-hidden="true" />
              </Link>
            </Reveal>
            <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <UserStat label="Mis mazos" value={stats.myDecks} loading={loading} Icon={CardsIcon} />
              <UserStat label="Mis partidas" value={stats.myGames} loading={loading} Icon={ClipboardTextIcon} />
              <UserStat label="Mis victorias" value={stats.myWins} loading={loading} Icon={TrophyIcon} />
              <UserStat label="Mis favoritos" value={stats.myFavorites} loading={loading} Icon={HeartIcon} tone="brand" />
            </RevealGroup>
          </section>
        )}

        {/* Franjas tipográficas con el scroll */}
        <ScrollMarquee />

        {/* Características */}
        <section>
          <Reveal className="max-w-2xl mb-10">
            <span className="eyebrow">Por qué AIForge</span>
            <h2 className="mt-3 text-3xl md:text-5xl text-ink-900">
              Todo lo que necesitas entre partida y partida.
            </h2>
          </Reveal>
          <RevealGroup className="grid grid-cols-1 md:grid-cols-6 gap-4" stagger={0.1}>
            <RevealItem className="md:col-span-4 md:row-span-2">
              <TiltCard
                maxTilt={4}
                spotlight="light"
                className="group h-full rounded-2xl bg-brand-700 text-white p-8 md:p-10 flex flex-col justify-between min-h-[340px] shadow-lg"
              >
                <div className="absolute inset-0 halftone pointer-events-none" aria-hidden="true" />
                <div
                  className="sd-parallax absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-2xl opacity-60 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgb(238 154 166 / 0.55), transparent 70%)' }}
                  aria-hidden="true"
                />
                <SparkleIcon
                  className="absolute right-8 top-8 w-28 h-28 md:w-36 md:h-36 text-white/15 transition-transform duration-700 ease-out group-hover:rotate-12 group-hover:scale-110"
                  weight="fill"
                  aria-hidden="true"
                />
                <span className="relative w-12 h-12 rounded-xl bg-white/10 ring-1 ring-inset ring-white/20 flex items-center justify-center">
                  <SparkleIcon className="w-6 h-6" weight="duotone" aria-hidden="true" />
                </span>
                <div className="relative mt-10">
                  <h3 className="text-3xl md:text-4xl text-white">Inteligencia artificial</h3>
                  <p className="mt-3 text-brand-100 max-w-md leading-relaxed">
                    Genera mazos optimizados para enfrentarte a villanos concretos. La IA aprende de tus
                    partidas para proponer mejores combinaciones de cartas.
                  </p>
                  <Link
                    to="/ai-recommendation"
                    className="group/link mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white"
                  >
                    Probar la recomendación IA
                    <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" weight="bold" aria-hidden="true" />
                  </Link>
                </div>
              </TiltCard>
            </RevealItem>

            <RevealItem className="md:col-span-2">
              <TiltCard className="group h-full rounded-2xl bg-white p-7 ring-1 ring-ink-900/[0.06] shadow-sm hover:shadow-lg transition-shadow duration-300">
                <span className="relative w-11 h-11 rounded-lg bg-ink-100 text-ink-800 flex items-center justify-center transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110">
                  <ChartLineUpIcon className="w-6 h-6" weight="duotone" aria-hidden="true" />
                </span>
                <h3 className="relative mt-5 text-xl text-ink-900">Análisis de partidas</h3>
                <p className="relative mt-2 text-ink-600 leading-relaxed">
                  Registra tus partidas y consulta victorias, derrotas y tendencias para ajustar tu estrategia.
                </p>
              </TiltCard>
            </RevealItem>

            <RevealItem className="md:col-span-2">
              <TiltCard className="group h-full rounded-2xl bg-white p-7 ring-1 ring-ink-900/[0.06] shadow-sm hover:shadow-lg transition-shadow duration-300">
                <span className="relative w-11 h-11 rounded-lg bg-ink-100 text-ink-800 flex items-center justify-center transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110">
                  <UsersThreeIcon className="w-6 h-6" weight="duotone" aria-hidden="true" />
                </span>
                <h3 className="relative mt-5 text-xl text-ink-900">Comunidad</h3>
                <p className="relative mt-2 text-ink-600 leading-relaxed">
                  Comparte tus mazos, comenta los de otros jugadores y guarda tus favoritos.
                </p>
              </TiltCard>
            </RevealItem>
          </RevealGroup>
        </section>

        {/* Cómo funciona */}
        <section className="grid lg:grid-cols-12 gap-10">
          <Reveal className="lg:col-span-4">
            <span className="eyebrow">Cómo funciona</span>
            <h2 className="mt-3 text-3xl md:text-4xl text-ink-900">Tres pasos hasta tu próxima partida.</h2>
          </Reveal>
          <div className="lg:col-span-8">
            <div className="h-[3px] bg-ink-200 rounded-full overflow-hidden mb-4" aria-hidden="true">
              <div className="sd-draw h-full bg-brand-600" />
            </div>
            <RevealGroup className="grid sm:grid-cols-3 gap-4" stagger={0.12}>
              {[
                { n: '01', title: 'Elige tu héroe', text: 'Selecciona el héroe con el que quieres construir tu mazo.' },
                { n: '02', title: 'Construye tu mazo', text: 'Añade las cartas que mejor encajan con tu estrategia.' },
                { n: '03', title: 'Juega y aprende', text: 'Registra tus partidas y mejora con cada una.' },
              ].map((step) => (
                <RevealItem key={step.n}>
                  <TiltCard maxTilt={3} className="h-full rounded-2xl bg-white p-6 md:p-7 ring-1 ring-ink-900/[0.06] shadow-sm">
                    <span className="relative font-display text-5xl font-extrabold text-brand-600/90 leading-none">{step.n}</span>
                    <h3 className="relative mt-6 text-lg text-ink-900">{step.title}</h3>
                    <p className="relative mt-2 text-sm text-ink-600 leading-relaxed">{step.text}</p>
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* Llamada a la acción final */}
        <Reveal y={40}>
          <section className="relative overflow-hidden rounded-2xl bg-ink-900 px-6 sm:px-10 lg:px-14 py-14 md:py-20 shadow-xl">
            <div className="absolute inset-0 halftone pointer-events-none" aria-hidden="true" />
            <div
              className="sd-parallax absolute -left-24 -bottom-32 w-[480px] h-[480px] rounded-full opacity-50 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgb(184 38 61 / 0.55), transparent 65%)' }}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-600" aria-hidden="true" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-5xl text-white">¿Listo para crear tu primer mazo?</h2>
                <p className="mt-3 text-ink-300 text-lg">
                  Únete a la comunidad y empieza a construir mazos para tu próxima partida.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Magnetic>
                  <Link
                    to="/create-deck"
                    className="group inline-flex w-full items-center justify-center gap-2 px-7 py-4 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-semibold shadow-brand"
                  >
                    Crear Mazo Ahora
                    <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" weight="bold" aria-hidden="true" />
                  </Link>
                </Magnetic>
                <Link
                  to="/decks"
                  className="inline-flex items-center justify-center px-7 py-4 text-white rounded-lg ring-1 ring-inset ring-white/20 hover:bg-white/5 font-semibold"
                >
                  Ver mazos de la comunidad
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </>
  )
}

export default HomePage
