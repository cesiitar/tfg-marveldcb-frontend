// Cabecera de página compartida: el mismo panel tinta en toda la web.
// Uso:
//   <PageHeader>
//     <PageHeaderTitle>Mis Mazos</PageHeaderTitle>
//     <PageHeaderDescription>Gestiona tus mazos</PageHeaderDescription>
//     <PageHeaderActions>...</PageHeaderActions>
//   </PageHeader>
import * as React from 'react'

import { cn } from '@/lib/utils'

export type PageHeaderProps = React.ComponentPropsWithoutRef<'section'>

export function PageHeader({ className, children, ...props }: PageHeaderProps) {
  return (
    <section
      data-slot="page-header"
      className={cn(
        'animate-rise-in relative overflow-hidden rounded-2xl bg-ink-900 halftone shadow-xl',
        'px-6 sm:px-10 pt-10 pb-14 md:pt-14 md:pb-16',
        className
      )}
      {...props}
    >
      <div
        className="absolute -top-28 -right-20 w-[420px] h-[420px] rounded-full bg-brand-600/30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        {children}
      </div>
    </section>
  )
}

export type PageHeaderContentProps = React.ComponentPropsWithoutRef<'div'>

/** Agrupa eyebrow, título y descripción a la izquierda. */
export function PageHeaderContent({ className, ...props }: PageHeaderContentProps) {
  return <div data-slot="page-header-content" className={cn('max-w-3xl', className)} {...props} />
}

export type PageHeaderEyebrowProps = React.ComponentPropsWithoutRef<'span'>

export function PageHeaderEyebrow({ className, ...props }: PageHeaderEyebrowProps) {
  return (
    <span
      data-slot="page-header-eyebrow"
      className={cn('eyebrow !text-brand-300 mb-3 block', className)}
      {...props}
    />
  )
}

export type PageHeaderTitleProps = React.ComponentPropsWithoutRef<'h1'>

export function PageHeaderTitle({ className, ...props }: PageHeaderTitleProps) {
  return (
    <h1
      data-slot="page-header-title"
      className={cn('text-4xl md:text-5xl text-white', className)}
      {...props}
    />
  )
}

export type PageHeaderDescriptionProps = React.ComponentPropsWithoutRef<'p'>

export function PageHeaderDescription({ className, ...props }: PageHeaderDescriptionProps) {
  return (
    <p
      data-slot="page-header-description"
      className={cn('mt-3 text-lg text-ink-300 max-w-xl leading-relaxed', className)}
      {...props}
    />
  )
}

export type PageHeaderActionsProps = React.ComponentPropsWithoutRef<'div'>

export function PageHeaderActions({ className, ...props }: PageHeaderActionsProps) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn('flex flex-col sm:flex-row flex-wrap gap-3 flex-shrink-0', className)}
      {...props}
    />
  )
}

/** Estilos de botón para usar dentro del PageHeader (fondo oscuro). */
export const pageHeaderButton = {
  primary:
    'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 shadow-brand',
  secondary:
    'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold ring-1 ring-inset ring-white/20 hover:bg-white/5',
} as const
