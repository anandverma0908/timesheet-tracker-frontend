import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getPodColor } from '@/config/themes'
import type { SummaryByPod } from '@/types'
import Skeleton from '@/components/ui/Skeleton'
import styles from './PODBarChart.module.css'

interface PODBarChartProps {
  data:      SummaryByPod[]
  isLoading: boolean
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipPod}>{d.pod}</div>
      <div className={styles.tooltipHours}>{d.hours.toFixed(1)}h logged</div>
      <div className={styles.tooltipTickets}>{d.tickets} tickets</div>
    </div>
  )
}

export default function PODBarChart({ data, isLoading }: PODBarChartProps) {
  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <div className="card-title">Hours by POD</div>
            <div className="card-subtitle">Loading…</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '4px 0' }}>
          {[88, 66, 54, 43, 33, 25, 17, 10].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Skeleton width={62} height={12} />
              <Skeleton width={`${w}%`} height={8} radius="100px" />
              <Skeleton width={40} height={12} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.hours - a.hours)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className="card-title">Hours by POD</div>
          <div className="card-subtitle">{data.length} PODs this period</div>
        </div>
        <span className={styles.viewAll}>View all →</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
          barCategoryGap="25%"
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="pod"
            width={60}
            tick={{ fill: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
            {sorted.map((entry) => (
              <Cell key={entry.pod} fill={getPodColor(entry.pod)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
