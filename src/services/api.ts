import axios from 'axios'
import type {
  TicketsResponse,
  SummaryResponse,
  FiltersResponse,
  FilterState,
  ExportConfig,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error'
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  }
)

/* ── Mock helper ── */
function mock() {
  return (window as any).__EAP_MOCK__ ?? null
}

/* ── Param builder ── */
function buildParams(filters: Partial<FilterState>): Record<string, string> {
  const p: Record<string, string> = {}
  if (filters.dateFrom)  p.date_from  = filters.dateFrom
  if (filters.dateTo)    p.date_to    = filters.dateTo
  if (filters.user)      p.user       = filters.user
  if (filters.client)    p.client     = filters.client
  if (filters.pod)       p.pod        = filters.pod
  if (filters.project)   p.project    = filters.project
  return p
}

/* ── Tickets ── */
export async function fetchTickets(filters: Partial<FilterState>): Promise<TicketsResponse> {
  if (mock()) return mock().fetchTickets(filters)
  const { data } = await api.get<TicketsResponse>('/tickets', { params: buildParams(filters) })
  return data
}

/* ── Summary ── */
export async function fetchSummary(filters: Partial<FilterState>): Promise<SummaryResponse> {
  if (mock()) return mock().fetchSummary(filters)
  const { data } = await api.get<SummaryResponse>('/summary', { params: buildParams(filters) })
  return data
}

/* ── Filters ── */
export async function fetchFilters(): Promise<FiltersResponse> {
  if (mock()) return mock().fetchFilters()
  const { data } = await api.get<FiltersResponse>('/filters')
  return data
}

/* ── Export ── */
export async function downloadMonthlyReport(config: ExportConfig): Promise<void> {
  const params: Record<string, string> = {
    date_from:   config.dateFrom,
    date_to:     config.dateTo,
    month_label: config.monthLabel,
    ...(config.pod      && { pod:     config.pod      }),
    ...(config.client   && { client:  config.client   }),
    ...(config.project  && { project: config.project  }),
    ...(config.engineer && { user:    config.engineer }),
  }
  const res = await api.get('/export/monthly', { params, responseType: 'blob' })
  triggerDownload(res.data, `timesheet_${config.monthLabel.replace(' ', '_')}.xlsx`)
}

export async function downloadFYReport(config: ExportConfig): Promise<void> {
  const params: Record<string, string> = {
    fy_label:  config.fyLabel,
    date_from: config.dateFrom,
    date_to:   config.dateTo,
    ...(config.pod      && { pod:     config.pod      }),
    ...(config.client   && { client:  config.client   }),
    ...(config.project  && { project: config.project  }),
    ...(config.engineer && { user:    config.engineer }),
  }
  const res = await api.get('/export/fy', { params, responseType: 'blob' })
  triggerDownload(res.data, `engineering_timesheet_FY_${config.fyLabel}.xlsx`)
}

function triggerDownload(blob: Blob, filename: string) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default api
