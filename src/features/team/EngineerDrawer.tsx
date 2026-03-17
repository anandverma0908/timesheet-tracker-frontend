import { useQuery } from "@tanstack/react-query";
import { fetchTickets } from "@/services/api";
import {
  initials,
  formatNumber,
  formatDate,
  formatHours,
} from "@/utils/formatters";
import type { SummaryByUser, Ticket } from "@/types";
import SideDrawer from "@/components/ui/SideDrawer";
import DataTable, { Column } from "@/components/ui/DataTable";
import { IssueTypeBadge, StatusBadge, PODBadge } from "@/components/ui/Badge";
import styles from "@/components/ui/SideDrawer.module.css";
import { getAuthHeader } from "../auth/useAuthStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const COLORS = [
  "#4F7EFF",
  "#34D399",
  "#FBBF24",
  "#F87171",
  "#A78BFA",
  "#22D3EE",
  "#64748B",
];
function getColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

/* ── Unified row type for table — covers both Jira tickets and manual entries ── */
interface DrawerRow {
  id: string;
  source: "jira" | "manual";
  key: string;
  summary: string;
  updated: string;
  pod: string;
  client: string;
  issue_type: string;
  status: string;
  hours_spent: number;
  url: string;
}

const COLUMNS: Column<DrawerRow>[] = [
  {
    key: "source",
    label: "",
    width: 70,
    render: (r) => (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: 4,
          background:
            r.source === "jira"
              ? "rgba(79,126,255,0.12)"
              : "rgba(167,139,250,0.12)",
          color: r.source === "jira" ? "var(--accent)" : "#A78BFA",
        }}
      >
        {r.source === "jira" ? "⬡ Jira" : "✦ Manual"}
      </span>
    ),
  },
  {
    key: "key",
    label: "Key / Type",
    width: 120,
    render: (r) =>
      r.source === "jira" ? (
        <span className="key-chip">{r.key}</span>
      ) : (
        <span style={{ fontSize: 11, color: "var(--text-2)" }}>
          {r.issue_type || "Manual"}
        </span>
      ),
  },
  {
    key: "summary",
    label: "Activity / Summary",
    width: 260,
    sortable: true,
    className: "summary",
    render: (r) => <span title={r.summary}>{r.summary}</span>,
  },
  {
    key: "updated",
    label: "Date",
    width: 80,
    sortable: true,
    className: "mono",
    render: (r) => formatDate(r.updated, "MMM d"),
  },
  {
    key: "pod",
    label: "POD",
    width: 90,
    render: (r) => <PODBadge pod={r.pod} />,
  },
  {
    key: "client",
    label: "Client",
    width: 110,
    className: "dim",
  },
  {
    key: "status",
    label: "Status",
    width: 130,
    render: (r) =>
      r.source === "jira" ? (
        <StatusBadge status={r.status} />
      ) : (
        <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 600 }}>
          ✓ Logged
        </span>
      ),
  },
  {
    key: "hours_spent",
    label: "Hours",
    width: 70,
    sortable: true,
    className: "hours",
    render: (r) => formatHours(r.hours_spent),
  },
  {
    key: "url",
    label: "",
    width: 36,
    render: (r) =>
      r.url && r.url !== "#" ? (
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-3)",
            fontSize: 13,
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(r.url, "_blank");
          }}
          title="Open in Jira"
        >
          ↗
        </button>
      ) : null,
  },
];

interface EngineerStats {
  user: string;
  hours: number;
  jira_hours: number;
  manual_hours: number;
  tickets: number;
  manual_entries: number;
  active_days: number;
  clients: number;
}

interface Props {
  engineer: SummaryByUser | null;
  dateFrom: string | null;
  dateTo: string | null;
  onClose: () => void;
}

export default function EngineerDrawer({
  engineer,
  dateFrom,
  dateTo,
  onClose,
}: Props) {
  /* Jira tickets */
  const { data: ticketData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["engineer-tickets", engineer?.user, dateFrom, dateTo],
    queryFn: () => fetchTickets({ user: engineer!.user, dateFrom, dateTo }),
    enabled: !!engineer,
  });

  /* Manual entries */
  const { data: manualData, isLoading: manualLoading } = useQuery({
    queryKey: ["engineer-manual", engineer?.user, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ user: engineer!.user });
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      const res = await fetch(`${API}/api/manual-entries?${params}`, {
        headers: getAuthHeader(),
      });
      return res.json();
    },
    enabled: !!engineer,
  });

  /* Stats from dedicated endpoint */
  const { data: stats } = useQuery<EngineerStats>({
    queryKey: ["engineer-stats", engineer?.user, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ user: engineer!.user });
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      const res = await fetch(`${API}/api/engineer-stats?${params}`, {
        headers: getAuthHeader(),
      });
      return res.json();
    },
    enabled: !!engineer,
  });

  const color = engineer ? getColor(engineer.user) : "#4F7EFF";

  /* Merge Jira tickets + manual entries into unified rows */
  const jiraRows: DrawerRow[] = (ticketData?.tickets ?? []).map(
    (t: Ticket) => ({
      id: t.key,
      source: "jira",
      key: t.key,
      summary: t.summary,
      updated: t.updated,
      pod: t.pod,
      client: t.client,
      issue_type: t.issue_type,
      status: t.status,
      hours_spent: t.hours_spent,
      url: t.url,
    }),
  );

  const manualRows: DrawerRow[] = (
    Array.isArray(manualData) ? manualData : []
  ).map((m: any) => ({
    id: m.id,
    source: "manual",
    key: "",
    summary: m.activity,
    updated: m.entry_date,
    pod: m.pod ?? "",
    client: m.client ?? "",
    issue_type: m.entry_type ?? "Manual",
    status: "confirmed",
    hours_spent: m.hours,
    url: "",
  }));

  /* Sort combined rows by date desc */
  const allRows: DrawerRow[] = [...jiraRows, ...manualRows].sort((a, b) =>
    (b.updated ?? "").localeCompare(a.updated ?? ""),
  );

  const isLoading = ticketsLoading || manualLoading;

  return (
    <SideDrawer
      open={!!engineer}
      onClose={onClose}
      size="lg"
      title={engineer?.user ?? ""}
      subtitle={engineer?.clients.join(" · ") || "—"}
      avatar={
        <div
          className={styles.avatar}
          style={{ background: `linear-gradient(135deg,${color},${color}aa)` }}
        >
          {engineer ? initials(engineer.user) : ""}
        </div>
      }
      stats={[
        {
          label: "Total Hours",
          value: `${formatNumber(Math.round((stats?.hours ?? 0) * 4) / 4)}h`,
          color,
        },
        {
          label: "Jira",
          value: `${formatNumber(Math.round((stats?.jira_hours ?? 0) * 4) / 4)}h`,
        },
        {
          label: "Manual",
          value: `${formatNumber(Math.round((stats?.manual_hours ?? 0) * 4) / 4)}h`,
        },
        { label: "Active Days", value: String(stats?.active_days ?? 0) },
      ]}
      footer={
        <p className={styles.footerNote}>
          <strong>{engineer?.user}</strong> — {stats?.tickets ?? 0} Jira tickets
          · {stats?.manual_entries ?? 0} manual entries ·{" "}
          {formatNumber(Math.round((stats?.hours ?? 0) * 4) / 4)}h total.
          Read-only view.
        </p>
      }
    >
      <DataTable<DrawerRow>
        columns={COLUMNS}
        rows={allRows}
        rowKey="id"
        isLoading={isLoading}
        virtualize={false}
        maxHeight={520}
        stickyHeader
        emptyIcon="📭"
        emptyTitle="No activity found"
        emptyDesc="No Jira tickets or manual entries for this date range."
      />
    </SideDrawer>
  );
}
