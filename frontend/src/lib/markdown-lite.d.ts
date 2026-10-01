/** Convierte Markdown de usuario a HTML seguro (solo etiquetas generadas por el conversor). */
export function renderMarkdown(text: string | null | undefined, options?: { baseHeading?: number }): string

export const IMPORT_NOTE: RegExp
export function stripImportNote(text: string | null | undefined): string
export function isImportedDeck(deck: { source_url?: string | null; description?: string | null } | null | undefined): boolean

/** Resumen en texto plano, sin Markdown ni HTML, recortado a `max` caracteres. */
export function plainText(text: string | null | undefined, max?: number): string
