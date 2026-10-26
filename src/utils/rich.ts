const htmlEscapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Turns content text into HTML: escapes it and renders **bold** as <strong>.
 * The CV build (scripts/cv.mjs) supports the same markup.
 */
export function rich(text: string) {
  return text.replace(/[&<>"']/g, (c) => htmlEscapes[c]).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** Content text with the **bold** markup removed, for meta tags. */
export function plain(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1');
}
