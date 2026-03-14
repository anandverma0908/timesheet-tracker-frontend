import type { Theme, ThemeId, ColorMode } from '@/types'

export const THEMES: Theme[] = [
  { id: 'default', name: 'Cobalt',  color: '#4F7EFF' },
  { id: 'emerald', name: 'Emerald', color: '#10B981' },
  { id: 'violet',  name: 'Violet',  color: '#8B5CF6' },
  { id: 'rose',    name: 'Rose',    color: '#F43F5E' },
]

export const DEFAULT_THEME: ThemeId   = 'default'
export const DEFAULT_MODE: ColorMode  = 'dark'

export function applyTheme(themeId: ThemeId, mode: ColorMode) {
  const html = document.documentElement
  html.setAttribute('data-theme', themeId)
  html.setAttribute('data-mode', mode)
}

/* ── POD colors — consistent across charts & cards ── */
export const POD_COLORS: Record<string, string> = {
  DPAI:    '#4F7EFF',
  DevOps:  '#34D399',
  EDM:     '#FBBF24',
  SNP:     '#A78BFA',
  Infosec: '#F87171',
  RiskAI:  '#22D3EE',
  DS:      '#94A3B8',
  TMS:     '#64748B',
}

export function getPodColor(pod: string): string {
  return POD_COLORS[pod] ?? '#8B8FA8'
}

/* ── Issue type badge variant ── */
export const ISSUE_TYPE_VARIANT: Record<string, string> = {
  Feature: 'badge-blue',
  Bug:     'badge-red',
  Meeting: 'badge-amber',
  Task:    'badge-purple',
  Story:   'badge-cyan',
}

export const STATUS_VARIANT: Record<string, string> = {
  Done:        'badge-green',
  Open:        'badge-gray',
  'In Progress': 'badge-amber',
  'QA In Progress': 'badge-amber',
  Closed:      'badge-green',
}

export function getIssueTypeBadge(type: string)   { return ISSUE_TYPE_VARIANT[type]  ?? 'badge-gray' }
export function getStatusBadge(status: string)     { return STATUS_VARIANT[status]    ?? 'badge-gray' }
