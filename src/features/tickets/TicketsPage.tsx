import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import toast from 'react-hot-toast'
import { useFilterStore } from '@/store'
import { fetchTickets, fetchFilters } from '@/services/api'
import { QUERY_KEYS } from '@/config/queryKeys'
import { useDebounce } from '@/hooks'
import { parseNLQuery } from '@/utils/aiParser'
import { formatDate, formatHours } from '@/utils/formatters'
import { Badge, IssueTypeBadge, StatusBadge, PODBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import type { Ticket } from '@/types'
import styles from './TicketsPage.module.css'

const AI_SUGGESTIONS = [
  'Bugs from Colgate last month',
  'Top engineers by hours this FY',
  'All DPAI meetings this month',
  'DevOps tickets in progress',
  'Hours by client this quarter',
]

const COLUMNS = [
  { key: 'key',        label: 'Key',      width: 110 },
  { key: 'summary',    label: 'Summary',  width: 240 },
  { key: 'assignee',   label: 'Assignee', width: 140 },
  { key: 'pod',        label: 'POD',      width: 90  },
  { key: 'client',     label: 'Client',   width: 100 },
  { key: 'issue_type', label: 'Type',     width: 90  },
  { key: 'status',     label: 'Status',   width: 110 },
  { key: 'updated',    label: 'Updated',  width: 90  },
  { key: 'hours_spent',label: 'Hours',    width: 70  },
]

export default function TicketsPage() {
  const [aiQuery, setAiQuery]     = useState('')
  const [sortKey, setSortKey]     = useState<keyof Ticket>('updated')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc')
  const parentRef = useRef<HTMLDivElement>(null)

  const filters = useFilterStore()
  const debouncedSearch = useDebounce(filters.search, 300)

  /* ── Data ── */
  const { data: filtersData } = useQuery({
    queryKey: QUERY_KEYS.filters(),
    queryFn:  fetchFilters,
  })

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.tickets({
      dateFrom: filters.dateFrom,
      dateTo:   filters.dateTo,
      user:     filters.user,
      client:   filters.client,
      pod:      filters.pod,
      project:  filters.project,
    }),
    queryFn: () => fetchTickets({
      dateFrom:  filters.dateFrom,
      dateTo:    filters.dateTo,
      user:      filters.user,
      client:    filters.client,
      pod:       filters.pod,
      project:   filters.project,
    }),
  })

  /* ── Sort + client-side search filter ── */
  const tickets: Ticket[] = (data?.tickets ?? [])
    .filter(t => {
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return (
        t.key.toLowerCase().includes(q)      ||
        t.summary.toLowerCase().includes(q)  ||
        t.assignee.toLowerCase().includes(q) ||
        t.client.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })

  /* ── Virtualizer ── */
  const rowVirtualizer = useVirtualizer({
    count:         tickets.length,
    getScrollElement: () => parentRef.current,
    estimateSize:  () => 44,
    overscan:      10,
  })

  /* ── AI search ── */
  function handleAISearch(query: string) {
    setAiQuery(query)
    if (!query.trim()) return
    const parsed = parseNLQuery(query, {
      pods:     filtersData?.pods     ?? [],
      clients:  filtersData?.clients  ?? [],
      users:    filtersData?.users    ?? [],
      projects: filtersData?.projects ?? [],
    })
    Object.entries(parsed.filters).forEach(([k, v]) => {
      filters.setFilter(k as keyof typeof filters, v as string | null)
    })
    toast.success('Filters applied from AI search')
  }

  /* ── Sort ── */
  function handleSort(key: keyof Ticket) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  /* ── Active chips ── */
  const activeFilters = [
    filters.project   && { label: `Project: ${filters.project}`,  key: 'project'   },
    filters.pod       && { label: `POD: ${filters.pod}`,          key: 'pod'        },
    filters.client    && { label: `Client: ${filters.client}`,    key: 'client'     },
    filters.user      && { label: `Engineer: ${filters.user}`,    key: 'user'       },
    filters.issueType && { label: `Type: ${filters.issueType}`,   key: 'issueType'  },
  ].filter(Boolean) as { label: string; key: string }[]

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={`${styles.header} fade-up`}>
        <div>
          <h1 className={styles.title}>Tickets</h1>
          <p className={styles.subtitle}>
            {isLoading ? 'Loading…' : `${tickets.length.toLocaleString()} tickets · Virtualised`}
          </p>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-ghost btn-sm" onClick={() => toast('Column settings coming soon')}>
            ⚙ Columns
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => toast.success('CSV downloading…')}>
            ↓ CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => toast.success('Excel downloading…')}>
            ↓ Excel
          </button>
        </div>
      </div>

      {/* AI Search */}
      <div className={`${styles.aiWrap} fade-up-1`}>
        <div className={styles.aiInner}>
          <div className={styles.aiBadge}>
            <div className={styles.aiDot} />
            AI
          </div>
          <input
            className={styles.aiInput}
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAISearch(aiQuery)}
            placeholder='Ask in plain English: "show bug tickets from Colgate in DPAI last month"…'
          />
          {aiQuery && (
            <button className={styles.aiClear} onClick={() => setAiQuery('')}>✕</button>
          )}
          <div className={styles.aiKbd}>⌘K</div>
        </div>
        <div className={styles.aiSugs}>
          {AI_SUGGESTIONS.map(s => (
            <button key={s} className={styles.aiSug} onClick={() => handleAISearch(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className={`${styles.filterBar} fade-up-2`}>
        <span className={styles.filterLabel}>Filters</span>

        {/* Search input */}
        <input
          className={`input input-sm ${styles.searchInline}`}
          placeholder="Search tickets…"
          value={filters.search}
          onChange={e => filters.setFilter('search', e.target.value)}
          style={{ width: 160 }}
        />

        {activeFilters.map(f => (
          <button
            key={f.key}
            className="chip active"
            onClick={() => filters.setFilter(f.key as keyof typeof filters, null)}
          >
            {f.label} <span className="chip-close">✕</span>
          </button>
        ))}

        <button className="chip chip-add">＋ Add Filter</button>

        {activeFilters.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => filters.resetFilters()}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div className={`${styles.tableCard} fade-up-3`}>
        {/* Table head */}
        <div className={styles.tableHead}>
          {COLUMNS.map(col => (
            <div
              key={col.key}
              className={`${styles.th} ${sortKey === col.key ? styles.thSorted : ''}`}
              style={{ width: col.width, minWidth: col.width }}
              onClick={() => handleSort(col.key as keyof Ticket)}
            >
              {col.label}
              <span className={styles.thArr}>
                {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
              </span>
            </div>
          ))}
        </div>

        {/* Virtualised rows */}
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No tickets found"
            desc="Try adjusting your filters or date range."
          />
        ) : (
          <div
            ref={parentRef}
            className={styles.tableBody}
            style={{ height: Math.min(tickets.length * 44, 480) }}
          >
            <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(vRow => {
                const t = tickets[vRow.index]
                return (
                  <div
                    key={t.key}
                    className={styles.row}
                    style={{
                      position:  'absolute',
                      top:       vRow.start,
                      left:      0,
                      right:     0,
                      height:    vRow.size,
                    }}
                    onClick={() => window.open(t.url, '_blank')}
                  >
                    <div className={styles.td} style={{ width: 110, minWidth: 110 }}>
                      <span className={styles.key}>{t.key}</span>
                    </div>
                    <div className={styles.td} style={{ width: 240, minWidth: 240 }}>
                      <span className={`${styles.summary} truncate`}>{t.summary}</span>
                    </div>
                    <div className={`${styles.td} ${styles.dim}`} style={{ width: 140, minWidth: 140 }}>
                      {t.assignee}
                    </div>
                    <div className={styles.td} style={{ width: 90, minWidth: 90 }}>
                      <PODBadge pod={t.pod} />
                    </div>
                    <div className={`${styles.td} ${styles.dim}`} style={{ width: 100, minWidth: 100 }}>
                      {t.client}
                    </div>
                    <div className={styles.td} style={{ width: 90, minWidth: 90 }}>
                      <IssueTypeBadge type={t.issue_type} />
                    </div>
                    <div className={styles.td} style={{ width: 110, minWidth: 110 }}>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className={`${styles.td} ${styles.dim}`} style={{ width: 90, minWidth: 90 }}>
                      {formatDate(t.updated)}
                    </div>
                    <div className={styles.td} style={{ width: 70, minWidth: 70 }}>
                      <span className={styles.hours}>{formatHours(t.hours_spent)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {!isLoading && tickets.length > 0 && (
          <div className={styles.footer}>
            <span className={styles.footerInfo}>
              Showing {Math.min(tickets.length, 1847).toLocaleString()} of {(data?.count ?? 0).toLocaleString()} tickets
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
