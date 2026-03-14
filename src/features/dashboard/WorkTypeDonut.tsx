import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { SummaryByClient } from '@/types'
import { formatNumber } from '@/utils/formatters'
import Skeleton from '@/components/ui/Skeleton'
import styles from './WorkTypeDonut.module.css'

interface WorkTypeDonutProps {
  byClient:  SummaryByClient[]
  isLoading: boolean
}

const WORK_TYPES = [
  { name: 'Feature', value: 60, color: 'var(--accent)' },
  { name: 'Bug',     value: 30, color: 'var(--green)'  },
  { name: 'Meeting', value: 10, color: 'var(--amber)'  },
]

export default function WorkTypeDonut({ byClient, isLoading }: WorkTypeDonutProps) {
  if (isLoading) {
    return (
      <div className={styles.card}>
        <Skeleton height={180} radius="var(--r-sm)" />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} height={28} />)}
        </div>
      </div>
    )
  }

  const top5 = [...byClient].sort((a, b) => b.hours - a.hours).slice(0, 5)
  const maxHours = top5[0]?.hours ?? 1

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className="card-title">Work Type Split</div>
          <div className="card-subtitle">Bug / Feature / Meeting</div>
        </div>
      </div>

      {/* Donut */}
      <div className={styles.donutWrap}>
        <div className={styles.donutContainer}>
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={WORK_TYPES}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {WORK_TYPES.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${v}%`, '']}
                contentStyle={{
                  background: 'var(--surface-2)',
                  border:     '1px solid var(--border-2)',
                  borderRadius: '8px',
                  fontSize:   '12px',
                  color:      'var(--text)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.donutCenter}>
            <div className={styles.donutPct}>60%</div>
            <div className={styles.donutLabel}>Feature</div>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          {WORK_TYPES.map((t) => (
            <div key={t.name} className={styles.legendRow}>
              <div className={styles.legendDot} style={{ background: t.color }} />
              <div className={styles.legendName}>{t.name}</div>
              <div className={styles.legendVal}>{t.value}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Top Clients */}
      <div className={styles.clientsHeader}>Top Clients</div>
      <div className={styles.clients}>
        {top5.map((c, i) => (
          <div key={c.client} className={styles.clientRow}>
            <div className={styles.clientRank}>{String(i + 1).padStart(2, '0')}</div>
            <div className={styles.clientName}>{c.client}</div>
            <div className={styles.clientBar}>
              <div
                className={styles.clientBarFill}
                style={{ width: `${(c.hours / maxHours) * 100}%` }}
              />
            </div>
            <div className={styles.clientVal}>{formatNumber(Math.round(c.hours))}h</div>
          </div>
        ))}
      </div>
    </div>
  )
}
