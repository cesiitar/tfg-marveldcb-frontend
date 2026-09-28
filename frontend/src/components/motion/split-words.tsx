// Titular que entra palabra a palabra desde detrás de una máscara.
// El texto completo queda accesible vía aria-label; las piezas animadas son aria-hidden.
import * as React from 'react'
import { m, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'
import { easeOut } from './reveal'

export interface SplitWordsSegment {
  text: string
  className?: string
}

export interface SplitWordsProps extends Omit<React.ComponentPropsWithoutRef<'h1'>, 'children'> {
  segments: SplitWordsSegment[]
  /** Retraso inicial en segundos. */
  delay?: number
  /** Separación entre palabras en segundos. */
  stagger?: number
}

export function SplitWords({ segments, delay = 0.1, stagger = 0.07, className, ...props }: SplitWordsProps) {
  const reduce = useReducedMotion()
  const words = segments.flatMap((segment) =>
    segment.text.split(' ').filter(Boolean).map((word) => ({ word, className: segment.className }))
  )
  const label = segments.map((s) => s.text).join(' ')

  return (
    <h1 data-slot="split-words" aria-label={label} className={cn(className)} {...props}>
      {words.map(({ word, className: wordClass }, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]">
            <m.span
              className={cn('inline-block', wordClass)}
              initial={{ transform: reduce ? 'translateY(0%)' : 'translateY(110%)', opacity: reduce ? 0 : 1 }}
              animate={{ transform: 'translateY(0%)', opacity: 1 }}
              transition={reduce ? { duration: 0.25 } : { duration: 0.9, ease: easeOut, delay: delay + i * stagger }}
            >
              {word}
            </m.span>
          </span>
          {i < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </h1>
  )
}
