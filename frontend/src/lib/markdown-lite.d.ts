/** Convierte Markdown de usuario a HTML seguro (solo etiquetas generadas por el conversor). */
export function renderMarkdown(text: string | null | undefined, options?: { baseHeading?: number }): string

/** Resumen en texto plano, sin Markdown ni HTML, recortado a `max` caracteres. */
export function plainText(text: string | null | undefined, max?: number): string
