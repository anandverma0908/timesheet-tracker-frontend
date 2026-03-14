import { formatNumber } from '@/utils/formatters'
import { KPISkeleton } from '@/components/ui/Skeleton'
import type { SummaryResponse } from '@/types'
import styles from './KPIStrip.module.css'

interface KPIStripProps {
  summary:   SummaryResponse | undefined
  isLoading: boolean
}

export default function KPIStrip({ summary, isLoading }: KPIStripProps) {
  if (isLoading) return <KPISkeleton />

  const pods     = [...new Set(summary?.by_pod.map(p => p.pod)    ?? [])].length
  const clients  = [...new Set(summary?.by_client.map(c => c.client) ?? [])].length
  const engineers= [...new Set(summary?.by_user.map(u => u.user)  ?? [])].length

  const kpis = [
    {
      icon:    '⏱',
      label:   'Total Hours',
      value:   formatNumber(Math.round(summary?.total_hours ?? 0)),
      trend:   '+11.2%',
      trendUp: true,
      color:   'var(--accent)',
      glow:    'var(--accent-glow)',
    },
    {
      icon:    '🎫',
      label:   'Tickets',
      value:   formatNumber(summary?.total_tickets ?? 0),
      trend:   '+7.4%',
      trendUp: true,
      color:   'var(--green)',
      glow:    'var(--green-glow)',
    },
    {
      icon:    '👥',
      label:   'Engineers',
      value:   formatNumber(engineers),
      trend:   'Full team',
      trendUp: null,
      color:   'var(--amber)',
      glow:    'var(--amber-glow)',
    },
    {
      icon:    '📁',
      label:   'PODs',
      value:   String(pods),
      trend:   'Active',
      trendUp: null,
      color:   'var(--purple)',
      glow:    'var(--purple-glow)',
    },
    {
      icon:    '🏢',
      label:   'Clients',
      value:   String(clients),
      trend:   '+3 this FY',
      trendUp: true,
      color:   'var(--cyan)',
      glow:    'var(--cyan-glow)',
    },
  ]

  return (
    <div className={styles.grid}>
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className={`${styles.card} fade-up-${i + 2}`}
          style={{ '--kc': kpi.color, '--kg': kpi.glow } as React.CSSProperties}
        >
          <div className={styles.glowOrb} />
          <span className={styles.icon}>{kpi.icon}</span>
          <div className={styles.label}>{kpi.label}</div>
          <div className={styles.value} style={{ color: kpi.color }}>{kpi.value}</div>
          <div
            className={`${styles.trend} ${
              kpi.trendUp === true  ? styles.trendUp   :
              kpi.trendUp === false ? styles.trendDown : styles.trendNeutral
            }`}
          >
            {kpi.trendUp === true  && '↑ '}
            {kpi.trendUp === false && '↓ '}
            {kpi.trendUp === null  && '↔ '}
            {kpi.trend}
          </div>
        </div>
      ))}
    </div>
  )
}
