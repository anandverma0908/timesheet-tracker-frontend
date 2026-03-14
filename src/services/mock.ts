import { DUMMY_SUMMARY, DUMMY_TICKETS, DUMMY_FILTERS } from '@/utils/dummyData'
import type { FilterState } from '@/types'

const delay = (ms = 450) => new Promise(r => setTimeout(r, ms))

export function enableMocks() {
  ;(window as any).__EAP_MOCK__ = {
    fetchSummary: async (_f: Partial<FilterState>) => { await delay(); return DUMMY_SUMMARY },
    fetchTickets: async (_f: Partial<FilterState>) => { await delay(); return DUMMY_TICKETS },
    fetchFilters: async ()                         => { await delay(200); return DUMMY_FILTERS },
  }
  console.info('[EAP] Mock API enabled — using dummy data')
}
