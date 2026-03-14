export interface ManualEntry {
  id:        string
  date:      string
  activity:  string
  hours:     number
  pod:       string | null
  client:    string | null
  type:      ManualEntryType
  notes:     string
  person:    string
  role:      PersonRole
  createdAt: string
}

export type ManualEntryType =
  | 'Meeting'
  | 'Planning'
  | 'Review'
  | '1:1'
  | 'Interview'
  | 'Reporting'
  | 'Training'
  | 'Other'

export type PersonRole =
  | 'Engineering Manager'
  | 'Scrum Master'
  | 'Tech Lead'
  | 'Director'
  | 'Other'

export interface ParsedEntry {
  date:      string
  activity:  string
  hours:     number
  pod:       string | null
  client:    string | null
  type:      ManualEntryType
  notes:     string
  confidence: 'high' | 'medium' | 'low'
}

export interface AIParseResponse {
  entries: ParsedEntry[]
  totalHours: number
  warnings:   string[]
}
