// Página actual de un listado guardada en la URL (?page=N).
// Así cada página tiene su propia dirección, se puede compartir y el botón
// "atrás" del navegador vuelve a la página anterior del listado.
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  /** push: true crea una entrada en el historial (clic del usuario); por defecto la reemplaza. */
  const setPage = useCallback(
    (next: number, { push = false }: { push?: boolean } = {}) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next <= 1) params.delete('page')
          else params.set('page', String(next))
          return params
        },
        { replace: !push }
      )
    },
    [setSearchParams]
  )

  return [page, setPage] as const
}
