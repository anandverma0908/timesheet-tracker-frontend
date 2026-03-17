import toast from "react-hot-toast";
import { useDashboard } from "./useDashboard";
import KPIStrip from "./KPIStrip";
import PODBarChart from "./PODBarChart";
import WorkTypeDonut from "./WorkTypeDonut";
import ClientBarChart from "./ClientBarChart";
import styles from "./DashboardPage.module.css";
import { useState } from "react";
import { IoMdSync } from "react-icons/io";

type ChartView = "pod" | "client";

export default function DashboardPage() {
  const [chartView, setChartView] = useState<ChartView>("pod");
  const { summary, isLoading, byPod, byClient, refetch } = useDashboard();

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={`${styles.header} fade-up`}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Track hours, tickets and team performance across your organisation.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              refetch();
              toast.success("Syncing from Jira…");
            }}
          >
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <IoMdSync fontSize={15} /> Sync Jira
            </span>
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="fade-up-1">
        <KPIStrip summary={summary} isLoading={isLoading} />
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", flexDirection: "row-reverse" }}>
        <div className="toggle-row" style={{ width: "10rem" }}>
          <div
            className={`toggle-option ${chartView === "pod" ? "active" : ""}`}
            onClick={() => setChartView("pod")}
          >
            POD
          </div>
          <div
            className={`toggle-option ${chartView === "client" ? "active" : ""}`}
            onClick={() => setChartView("client")}
          >
            Client
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className={`${styles.chartsRow} fade-up-2`}>
        {chartView === "pod" ? (
          <PODBarChart data={byPod} isLoading={isLoading} />
        ) : (
          <ClientBarChart data={byClient} isLoading={isLoading} />
        )}
        <WorkTypeDonut
          byClient={byClient}
          byIssueType={summary?.by_issue_type ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
