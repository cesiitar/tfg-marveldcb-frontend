import React from 'react'
import { Link } from 'react-router-dom'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { usePageMeta } from '../lib/seo'

const NotFoundPage: React.FC = () => {
  usePageMeta({ title: 'Página no encontrada', noindex: true })

  return (
    <div className="min-h-[60vh]">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Error 404</PageHeaderEyebrow>
          <PageHeaderTitle>Página no encontrada</PageHeaderTitle>
          <PageHeaderDescription>
            La dirección que buscas no existe o se ha movido. Prueba con alguna de estas secciones.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/" className="btn btn-primary">Volver al Inicio</Link>
            <Link to="/decks" className="btn btn-secondary">Explorar Mazos</Link>
            <Link to="/cards" className="btn btn-secondary">Ver Cartas</Link>
            <Link to="/faq" className="btn btn-secondary">Preguntas frecuentes</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
