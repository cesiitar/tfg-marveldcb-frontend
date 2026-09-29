import React from 'react'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react'

// Correo de contacto para reportar errores
const CONTACT_EMAIL = 'aiforge.soporte@gmail.com' // Cambiar por tu correo de Gmail

const FAQPage: React.FC = () => {
  
  const faqs = [
    {
      question: "¿Qué es AIForge?",
      answer: "AIForge es una plataforma web diseñada para crear y optimizar mazos de Marvel Champions usando inteligencia artificial. Permite crear mazos personalizados, explorar todas las cartas disponibles, registrar tus partidas, generar mazos optimizados con IA, y compartir tus creaciones con la comunidad."
    },
    {
      question: "¿Cómo puedo crear mi primer mazo?",
      answer: "Puedes crear mazos de dos formas: manualmente desde 'Crear Mazo' eligiendo héroe, aspecto y cartas, o usando la recomendación de IA que genera un mazo optimizado para un villano específico. Ambas opciones están disponibles en la página 'Crear Mazo'."
    },
    {
      question: "¿Cómo funciona la recomendación de IA?",
      answer: "La IA analiza tu historial de partidas y genera mazos optimizados para enfrentar villanos específicos. Selecciona un villano y la dificultad, y la IA elegirá automáticamente el mejor héroe, aspecto y combinación de cartas para maximizar tus probabilidades de victoria."
    },
    {
      question: "¿Puedo tener mazos con el mismo nombre?",
      answer: "No, los nombres de mazos deben ser únicos en toda la plataforma (no pueden coincidir con ningún otro mazo, sin importar mayúsculas o minúsculas). Si intentas crear o editar un mazo con un nombre que ya existe, recibirás un mensaje de error."
    },
    {
      question: "¿Cuántas cartas debe tener un mazo?",
      answer: "Un mazo válido debe tener entre 40 y 50 cartas (sin contar las cartas del héroe, que se añaden automáticamente). El sistema te avisará si tu mazo está fuera de estos límites."
    },
    {
      question: "¿Puedo compartir mis mazos con otros usuarios?",
      answer: "Sí, todos los mazos que crees son públicos por defecto y aparecen en la sección 'Decklists Públicos'. Otros usuarios pueden verlos, añadirlos a favoritos y usarlos como inspiración para sus propios mazos."
    },
    {
      question: "¿Cómo registro una partida?",
      answer: "Después de crear un mazo, puedes registrar una partida desde la página 'Crear Mazo' o desde 'Registrar Partida'. Selecciona el villano, la dificultad, y registra el resultado (victoria o derrota). Esto ayuda a mejorar la generación de mazos con IA."
    },
    {
      question: "¿Es gratis usar la plataforma?",
      answer: "Sí, AIForge es completamente gratuito para todos los usuarios. No hay costos ocultos ni suscripciones premium. Todas las funcionalidades están disponibles sin restricciones."
    },
    {
      question: "¿Puedo editar un mazo después de crearlo?",
      answer: "Sí, puedes editar tus propios mazos desde la página 'Mis Mazos'. Haz clic en el botón 'Editar' de cualquier mazo que hayas creado para modificar su nombre, descripción, cartas, héroe o aspecto."
    },
    {
      question: "¿Qué pasa si elimino un mazo?",
      answer: "Si eliminas un mazo, se eliminará permanentemente de tu colección. Sin embargo, si otros usuarios lo tenían en favoritos, seguirá apareciendo en sus listas hasta que lo eliminen manualmente."
    }
  ]

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
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-start">
                    <span className="text-blue-600 mr-3 font-bold">Q{index + 1}:</span>
                    <span>{faq.question}</span>
                  </h3>
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
