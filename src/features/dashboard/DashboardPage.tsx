import toast from 'react-hot-toast'
import { useDashboard }      from './useDashboard'
import KPIStrip              from './KPIStrip'
import PODBarChart           from './PODBarChart'
import WorkTypeDonut         from './WorkTypeDonut'
import ActivityHeatmap       from './ActivityHeatmap'
import styles                from './DashboardPage.module.css'

export default function DashboardPage() {
  const { summary, isLoading, byPod, byClient, refetch } = useDashboard()

  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={`${styles.header} fade-up`}>
        <div>
          <h1 className={styles.title}>Overview</h1>
          <p className={styles.subtitle}>All Projects · All PODs · March 2026</p>
        </div>
        <div className={styles.actions}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { refetch(); toast.success('Syncing from Jira…') }}
          >
            ⟳ Sync Jira
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => window.location.href = '/export'}
          >
            ↓ Export Report
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="fade-up-1">
        <KPIStrip summary={summary} isLoading={isLoading} />
      </div>

      {/* Charts row */}
      <div className={`${styles.chartsRow} fade-up-2`}>
        <PODBarChart  data={byPod}    isLoading={isLoading} />
        <WorkTypeDonut byClient={byClient} isLoading={isLoading} />
      </div>

      {/* Heatmap */}
      <div className="fade-up-3">
        <ActivityHeatmap />
      </div>

    </div>
  )
}
