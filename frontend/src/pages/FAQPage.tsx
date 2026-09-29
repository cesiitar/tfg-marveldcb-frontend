import React from 'react'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react'
import { usePageMeta } from '../lib/seo'
import pageMeta from '../lib/page-meta.json'
import faqsData from '../data/faqs.json'

// Correo de contacto para reportar errores
const CONTACT_EMAIL = 'aiforge.soporte@gmail.com' // Cambiar por tu correo de Gmail

const FAQPage: React.FC = () => {
  const faqs = faqsData

  usePageMeta(pageMeta.faq)

  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>Ayuda</PageHeaderEyebrow>
          <PageHeaderTitle>Preguntas Frecuentes</PageHeaderTitle>
          <PageHeaderDescription>
            Encuentra respuestas a las preguntas más comunes sobre AIForge
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="relative -mt-8 z-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* FAQs */}
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] overflow-hidden mb-6">
            <div className="p-6 space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-start">
                    <span className="text-blue-600 mr-3 font-bold" aria-hidden="true">Q{index + 1}:</span>
                    <span>{faq.question}</span>
                  </h2>
                  <p className="text-gray-600 leading-relaxed ml-8">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
              ¿No encuentras tu pregunta?
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Si tienes alguna pregunta específica sobre AIForge, necesitas ayuda o quieres reportar un problema, puedes:
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <a
                href="/"
                className="btn btn-primary"
              >
                Volver al Inicio
              </a>
              <a
                href="/decks"
                className="btn btn-secondary"
              >
                Explorar Mazos
              </a>
              <a
                href="/cards/search"
                className="btn btn-secondary"
              >
                Buscar Cartas
              </a>
            </div>
            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-3">
                ¿Encontraste un error o tienes una sugerencia?
              </p>
              <div className="flex flex-col items-center gap-3">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}&su=Reporte de Error - AIForge&body=Por favor, describe el error o sugerencia:`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <EnvelopeSimpleIcon className="w-5 h-5" weight="duotone" aria-hidden="true" />
                  Enviar Correo (Gmail)
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CONTACT_EMAIL)
                    alert(`Correo copiado: ${CONTACT_EMAIL}`)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  O copiar correo: {CONTACT_EMAIL}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage
