import toast from "react-hot-toast";
import { useDashboard } from "./useDashboard";
import KPIStrip from "./KPIStrip";
import PODBarChart from "./PODBarChart";
import WorkTypeDonut from "./WorkTypeDonut";
import ClientBarChart from "./ClientBarChart";
import ActivityHeatmap from "./ActivityHeatmap";
import styles from "./DashboardPage.module.css";
import { Box } from "@mui/material";
import { useState } from "react";
import { IoMdSync } from "react-icons/io";

type ChartView = "pod" | "client";

export default function DashboardPage() {
  const [chartView, setChartView] = useState<ChartView>("pod");
  const { summary, isLoading, byPod, byClient, refetch } = useDashboard();

  return (
    <Box className={styles.page}>
      {/* Page header */}
      <Box className={`${styles.header} fade-up`}>
        <Box>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Track hours, tickets and team performance across your organisation.
          </p>
        </Box>
        <Box className={styles.actions}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              refetch();
              toast.success("Syncing from Jira…");
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <IoMdSync fontSize={15} /> Sync Jira
            </Box>
          </button>
        </Box>
      </Box>

      {/* KPI strip */}
      <Box className="fade-up-1">
        <KPIStrip summary={summary} isLoading={isLoading} />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row-reverse",
        }}
      >
        <Box className="toggle-row" style={{ width: "10rem" }}>
          <Box
            className={`toggle-option ${chartView === "pod" ? "active" : ""}`}
            onClick={() => setChartView("pod")}
          >
            POD
          </Box>
          <Box
            className={`toggle-option ${chartView === "client" ? "active" : ""}`}
            onClick={() => setChartView("client")}
          >
            Client
          </Box>
        </Box>
      </Box>

      {/* Charts row */}
      <Box className={`${styles.chartsRow} fade-up-2`}>
        {chartView === "pod" ? (
          <PODBarChart data={byPod} isLoading={isLoading} />
        ) : (
          <ClientBarChart data={byClient} isLoading={isLoading} />
        )}
        <WorkTypeDonut byClient={byClient} isLoading={isLoading} />
      </Box>

      {/* Heatmap */}
      <Box className="fade-up-3">{/* <ActivityHeatmap /> */}</Box>
    </Box>
  );
}
