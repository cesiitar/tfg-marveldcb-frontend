// Tarjeta con "vida": inclinación 3D con muelle + foco de luz que sigue al cursor.
// - Solo con ratón (pointerType 'mouse'); en táctil y con reducir movimiento es estática.
// - Mide el rectángulo una vez al entrar (sin lecturas de layout en cada movimiento).
// - El foco se mueve con transform, no con variables CSS heredadas.
import * as React from 'react'
import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from 'motion/react'

import { cn } from '@/lib/utils'

export interface TiltCardProps extends HTMLMotionProps<'div'> {
  /** Inclinación máxima en grados. 0 desactiva la inclinación y deja solo el foco. */
  maxTilt?: number
  /** Color del foco: claro para fondos oscuros, marca para fondos claros. */
  spotlight?: 'light' | 'brand'
  /** 'above' pinta el foco sobre el contenido (efecto foil); por defecto va debajo. */
  spotlightLayer?: 'below' | 'above'
}

const spotlightColor = {
  light: 'radial-gradient(circle, rgb(255 255 255 / 0.16), transparent 62%)',
  brand: 'radial-gradient(circle, rgb(184 38 61 / 0.10), transparent 62%)',
}

const SPOT = 360

export function TiltCard({ maxTilt = 6, spotlight = 'brand', spotlightLayer = 'below', className, children, ...props }: TiltCardProps) {
  const reduce = useReducedMotion()
  const rect = React.useRef<DOMRect | null>(null)
  const spring = { stiffness: 170, damping: 20, mass: 0.6 }
  const rotateX = useSpring(0, spring)
  const rotateY = useSpring(0, spring)
  const spotX = useMotionValue(-SPOT)
  const spotY = useMotionValue(-SPOT)
  const spotOpacity = useSpring(0, { stiffness: 200, damping: 30 })

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  const spotTransform = useMotionTemplate`translate(${spotX}px, ${spotY}px)`

  const enabled = !reduce

  return (
    <m.div
      data-slot="tilt-card"
      style={enabled ? { transform } : undefined}
      onPointerEnter={(e) => {
        if (!enabled || e.pointerType !== 'mouse') return
        rect.current = e.currentTarget.getBoundingClientRect()
        spotOpacity.set(1)
      }}
      onPointerMove={(e) => {
        const r = rect.current
        if (!r) return
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        if (maxTilt) {
          rotateX.set((0.5 - y / r.height) * maxTilt * 2)
          rotateY.set((x / r.width - 0.5) * maxTilt * 2)
        }
        spotX.set(x - SPOT / 2)
        spotY.set(y - SPOT / 2)
      }}
      onPointerLeave={() => {
        rect.current = null
        rotateX.set(0)
        rotateY.set(0)
        spotOpacity.set(0)
      }}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <m.div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-0 rounded-full',
          spotlightLayer === 'above' ? 'z-20 mix-blend-soft-light' : 'z-0'
        )}
        style={{
          width: SPOT,
          height: SPOT,
          transform: spotTransform,
          opacity: spotOpacity,
          background:
            spotlightLayer === 'above'
              ? 'radial-gradient(circle, rgb(255 255 255 / 0.6), transparent 60%)'
              : spotlightColor[spotlight],
        }}
      />
      {children as React.ReactNode}
    </m.div>
  )
}
