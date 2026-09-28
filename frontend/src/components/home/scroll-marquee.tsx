// Franjas tipográficas que se desplazan con el scroll en sentidos opuestos.
// Usan CSS scroll-driven animations (.sd-drift-*), que corren fuera del hilo
// principal; en navegadores sin soporte se quedan quietas.

const aspects = [
  { name: 'Aggression', dot: 'bg-red-500' },
  { name: 'Justice', dot: 'bg-amber-500' },
  { name: 'Leadership', dot: 'bg-sky-500' },
  { name: 'Protection', dot: 'bg-green-500' },
  { name: 'Pool', dot: 'bg-teal-400' },
]

const verbs = ['Construye', 'Juega', 'Registra', 'Analiza', 'Comparte', 'Mejora']

export function ScrollMarquee() {
  return (
    <section
      data-slot="scroll-marquee"
      aria-hidden="true"
      className="relative w-screen ml-[calc(50%-50vw)] py-6 md:py-10 -rotate-2 select-none"
    >
      <div className="bg-ink-900 py-5 md:py-7 overflow-hidden shadow-xl">
        <div className="sd-drift-left flex w-max items-center gap-10 whitespace-nowrap will-change-transform">
          {[0, 1, 2].flatMap((r) =>
            aspects.map((a) => (
              <span key={`${r}-${a.name}`} className="flex items-center gap-10">
                <span
                  className="font-display text-5xl md:text-7xl font-extrabold uppercase text-transparent"
                  style={{ WebkitTextStroke: '1.5px rgb(255 255 255 / 0.55)', fontStretch: '80%' }}
                >
                  {a.name}
                </span>
                <span className={`w-3 h-3 md:w-4 md:h-4 rotate-45 ${a.dot}`} />
              </span>
            ))
          )}
        </div>
      </div>
      <div className="bg-brand-600 py-3 md:py-4 overflow-hidden rotate-[3deg] -mt-2 shadow-brand">
        <div className="sd-drift-right flex w-max items-center gap-8 whitespace-nowrap will-change-transform">
          {[0, 1, 2, 3].flatMap((r) =>
            verbs.map((v) => (
              <span key={`${r}-${v}`} className="flex items-center gap-8">
                <span className="font-display text-2xl md:text-4xl font-extrabold uppercase text-white" style={{ fontStretch: '80%' }}>
                  {v}
                </span>
                <span className="text-white/60 text-xl">✦</span>
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
