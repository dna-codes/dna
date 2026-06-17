/** Sanitize a DNA name for use as a mermaid identifier (no quotes / spaces). */
export function mermaidId(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, '_')
}

/** Escape a string for use inside a mermaid node label (quotes become &quot;). */
export function labelEscape(s: string): string {
  return s.replace(/"/g, '&quot;')
}
