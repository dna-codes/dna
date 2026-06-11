export interface FixtureTheme {
  bg:        string
  slate:     string  // card / node-body fill
  primary:   string
  accent:    string
  text:      string
  textMuted: string
}

export const DEFAULT_THEME: FixtureTheme = {
  bg:        '#0A0F1E',
  slate:     '#1E293B',
  primary:   '#0D9488',
  accent:    '#2DD4BF',
  text:      '#E5ECF6',
  textMuted: 'rgba(229,236,246,0.55)',
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

function rgba(hex: string, alpha: number): string {
  return `rgba(${hexToRgb(hex)},${alpha})`
}

export function themeToVars(theme: FixtureTheme): Record<string, string> {
  const { bg, slate, primary, accent, text, textMuted } = theme
  return {
    '--bg':                  bg,
    '--slate':               slate,
    '--primary':             primary,
    '--primary-dark':        primary,
    '--accent':              accent,
    '--text':                text,
    '--text-heading':        text,
    '--text-muted':          textMuted,
    '--border':              rgba(accent, 0.30),
    '--card-bg':             rgba(slate,  0.90),
    '--glow-sm':             `0 0 16px ${rgba(primary, 0.30)}`,
    '--glow':                `0 0 40px ${rgba(primary, 0.20)}`,
    '--glow-lg':             `0 0 48px ${rgba(primary, 0.35)}`,
    '--nav-bg':              rgba(bg,     0.92),
    '--canvas-wrap-bg':      rgba(bg,     0.60),
    '--canvas-controls-bg':  rgba(slate,  0.50),
    '--code-bg':             rgba(bg,     0.80),
    '--primary-a10':         rgba(primary, 0.10),
    '--primary-a12':         rgba(primary, 0.12),
    '--primary-a20':         rgba(primary, 0.20),
    '--primary-a25':         rgba(primary, 0.25),
    '--primary-a60':         rgba(primary, 0.60),
    '--accent-a08':          rgba(accent, 0.08),
    '--accent-a10':          rgba(accent, 0.10),
    '--accent-a12':          rgba(accent, 0.12),
    '--accent-a15':          rgba(accent, 0.15),
    '--accent-a20':          rgba(accent, 0.20),
    '--accent-a40':          rgba(accent, 0.40),
  }
}
