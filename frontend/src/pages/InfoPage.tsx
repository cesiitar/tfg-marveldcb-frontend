// Páginas de texto (Sobre AIForge, Política de privacidad).
// El contenido vive en src/data/legal-pages.json y lo comparte el prerender
// (seo/prerender.mjs), así que la versión estática y la de React coinciden.
import React from 'react'
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
} from '../components/ui/page-header'
import { usePageMeta } from '../lib/seo'
import pages from '../data/legal-pages.json'

type PageKey = keyof typeof pages

interface Section {
  title: string
  paragraphs?: string[]
  items?: string[]
  after?: string[]
}

/** Admite **negrita** y [enlaces](https://…) dentro de los textos del JSON. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/)
        if (bold) return <strong key={i} className="font-semibold text-ink-900">{bold[1]}</strong>
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (link)
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-2 hover:text-brand-800">
              {link[1]}
            </a>
          )
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}

const InfoPage: React.FC<{ page: PageKey }> = ({ page }) => {
  const data = pages[page]
  usePageMeta({ title: data.title, description: data.description })

  const updated = new Date(data.updated).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-[60vh]">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderEyebrow>{data.eyebrow}</PageHeaderEyebrow>
          <PageHeaderTitle>{data.heading}</PageHeaderTitle>
          <PageHeaderDescription>{data.lead}</PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <div className="relative -mt-8 z-20 px-4">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg ring-1 ring-ink-900/[0.04] p-6 md:p-10">
          {(data.sections as Section[]).map((section) => (
            <section key={section.title} className="border-b border-gray-200 last:border-b-0 py-6 first:pt-0 last:pb-0">
              <h2 className="text-2xl text-ink-900 mb-3">{section.title}</h2>
              {section.paragraphs?.map((p, i) => (
                <p key={i} className="text-ink-600 leading-relaxed mb-3 last:mb-0">
                  <Inline text={p} />
                </p>
              ))}
              {section.items && (
                <ul className="my-3 space-y-2 list-disc pl-6 text-ink-600 leading-relaxed marker:text-brand-600">
                  {section.items.map((item, i) => (
                    <li key={i}>
                      <Inline text={item} />
                    </li>
                  ))}
                </ul>
              )}
              {section.after?.map((p, i) => (
                <p key={i} className="text-ink-600 leading-relaxed mt-3">
                  <Inline text={p} />
                </p>
              ))}
            </section>
          ))}
          <p className="mt-8 pt-6 border-t border-gray-200 font-mono text-xs uppercase tracking-[0.14em] text-ink-400">
            Última actualización: <time dateTime={data.updated}>{updated}</time>
          </p>
        </article>
      </div>
    </div>
  )
}

export default InfoPage
