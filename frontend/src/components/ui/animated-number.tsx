// Cult UI — animated-number (https://cult-ui.com/r/animated-number.json)
// Adaptado a este proyecto:
//  - Extiende las props nativas de <span> y exporta sus tipos.
//  - Respeta prefers-reduced-motion (salta directamente al valor final).
//  - Escribe el texto vía ref en lugar de <motion.span>: mismo muelle de
//    Motion, pero sin arrastrar el runtime de componentes animados (~50 kB gz).
//  - Cifras tabulares para que el ancho no baile durante el conteo.
import * as React from 'react'
import { useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'motion/react'

import { cn } from '@/lib/utils'

export interface AnimatedNumberProps
  extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Valor final que se muestra. Cada cambio anima desde el valor anterior. */
  value: number
  mass?: number
  stiffness?: number
  damping?: number
  /** Decimales que se conservan durante la animación. */
  precision?: number
  /** Formato del número mostrado (por defecto, separadores de miles en español). */
  format?: (value: number) => string
  /**
   * Si se indica, el número cuenta desde este valor cuando `play` pasa a true.
   * Hasta entonces el DOM ya contiene el valor final (visible para buscadores y
   * lectores de pantalla aunque nunca se haga scroll).
   */
  countFrom?: number
  /** Dispara el conteo desde `countFrom` (por ejemplo, al entrar en pantalla). */
  play?: boolean
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
}

const defaultFormat = (num: number) => num.toLocaleString('es-ES')

export function AnimatedNumber({
  value,
  mass = 0.8,
  stiffness = 75,
  damping = 15,
  precision = 0,
  format = defaultFormat,
  countFrom,
  play = true,
  onAnimationStart,
  onAnimationComplete,
  className,
  ...props
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()
  const spring = useSpring(value, { mass, stiffness, damping })
  const display = useTransform(spring, (current) =>
    format(parseFloat(current.toFixed(precision)))
  )

  // Solo cambia el texto de un elemento pequeño: sin lecturas de layout.
  useMotionValueEvent(display, 'change', (latest) => {
    if (ref.current) ref.current.textContent = latest
  })

  const playedRef = React.useRef(countFrom === undefined)

  React.useEffect(() => {
    if (reduceMotion) {
      spring.jump(value)
      return
    }
    if (!playedRef.current) {
      if (!play) return
      playedRef.current = true
      spring.jump(countFrom!)
    }
    spring.set(value)
    onAnimationStart?.()
    const unsubscribe = spring.on('change', () => {
      if (spring.get() === value) onAnimationComplete?.()
    })
    return () => unsubscribe()
  }, [spring, value, reduceMotion, play, countFrom, onAnimationStart, onAnimationComplete])

  return (
    <span
      ref={ref}
      data-slot="animated-number"
      className={cn('tabular-nums', className)}
      {...props}
    >
      {display.get()}
    </span>
  )
}

export default AnimatedNumber
