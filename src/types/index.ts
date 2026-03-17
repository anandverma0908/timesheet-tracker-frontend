/* ── Ticket ── */
export interface Worklog {
  author:  string
  email:   string
  date:    string
  hours:   number
  comment: string
}

export interface Ticket {
  key:                      string
  project_key:              string
  project_name:             string
  summary:                  string
  assignee:                 string
  assignee_email:           string
  status:                   string
  client:                   string
  pod:                      string
  hours_spent:              number
  original_estimate_hours:  number
  remaining_estimate_hours: number
  created:                  string
  updated:                  string
  issue_type:               string
  priority:                 string
  url:                      string
  worklogs:                 Worklog[]
}

/* ── API Responses ── */
export interface TicketsResponse {
  tickets: Ticket[]
  count:   number
}

export interface SummaryByUser {
  user:    string
  hours:   number
  tickets: number
  clients: string[]
}

export interface SummaryByClient {
  client:  string
  hours:   number
  tickets: number
  users:   string[]
}

export interface SummaryByPod {
  pod:     string
  hours:   number
  tickets: number
  clients: string[]
}

export interface SummaryByIssueType {
  issue_type: string
  hours:      number
  tickets:    number
  pct:        number
}

export interface SummaryResponse {
  by_user:        SummaryByUser[]
  by_client:      SummaryByClient[]
  by_pod:         SummaryByPod[]
  by_issue_type:  SummaryByIssueType[]
  total_tickets: number
  total_hours:   number
}

export interface FiltersResponse {
  users:    string[]
  clients:  string[]
  pods:     string[]
  projects: string[]
}

/* ── Filter State ── */
export interface FilterState {
  dateFrom:    string | null
  dateTo:      string | null
  user:        string | null
  client:      string | null
  pod:         string | null
  project:     string | null
  search:      string
  issueType:   string | null
}

/* ── Theme ── */
export type ThemeId   = 'default' | 'emerald' | 'violet' | 'rose'
export type ColorMode = 'dark' | 'light'

export interface Theme {
  id:    ThemeId
  name:  string
  color: string   // preview swatch hex
}

/* ── Settings ── */
export interface JiraConfig {
  jiraUrl:    string
  email:      string
  apiToken:   string
  projectKey: string
}

export interface AppSettings {
  jiraConfig:  JiraConfig | null
  isConnected: boolean
}

/* ── Export ── */
export type ReportType = 'monthly' | 'fy'

export interface ExportConfig {
  reportType:  ReportType
  monthLabel:  string
  fyLabel:     string
  dateFrom:    string
  dateTo:      string
  pod:         string | null
  client:      string | null
  project:     string | null
  engineer:    string | null
  sheets: {
    rawData:    boolean
    podSummary: boolean
    breakdown:  boolean
    pivot:      boolean
  }
}