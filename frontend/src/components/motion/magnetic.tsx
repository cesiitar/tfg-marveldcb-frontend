// Envoltorio magnético: el contenido se desplaza ligeramente hacia el cursor.
// Decorativo, solo con ratón; muelle para que tenga inercia (Emil Kowalski).
import * as React from 'react'
import { m, useMotionTemplate, useReducedMotion, useSpring } from 'motion/react'

import { cn } from '@/lib/utils'

export interface MagneticProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Fracción del desplazamiento del cursor que sigue el contenido. */
  strength?: number
}

export function Magnetic({ strength = 0.25, className, children, ...props }: MagneticProps) {
  const reduce = useReducedMotion()
  const rect = React.useRef<DOMRect | null>(null)
  const x = useSpring(0, { stiffness: 180, damping: 15, mass: 0.4 })
  const y = useSpring(0, { stiffness: 180, damping: 15, mass: 0.4 })
  const transform = useMotionTemplate`translate(${x}px, ${y}px)`

  return (
    <div
      data-slot="magnetic"
      className={cn('inline-flex', className)}
      onPointerEnter={(e) => {
        if (reduce || e.pointerType !== 'mouse') return
        rect.current = e.currentTarget.getBoundingClientRect()
      }}
      onPointerMove={(e) => {
        const r = rect.current
        if (!r) return
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onPointerLeave={() => {
        rect.current = null
        x.set(0)
        y.set(0)
      }}
      {...props}
    >
      <m.div className="inline-flex w-full" style={{ transform }}>
        {children}
      </m.div>
    </div>
  )
}
