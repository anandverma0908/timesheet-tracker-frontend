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
import {
  Badge,
  IssueTypeBadge,
  StatusBadge,
  PODBadge,
} from "@/components/ui/Badge";
import styles from "@/components/ui/SideDrawer.module.css";

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

/* ── Same columns as TicketsPage ── */
const COLUMNS: Column<Ticket>[] = [
  {
    key: "key",
    label: "Key",
    width: 110,
    render: (t) => <span className="key-chip">{t.key}</span>,
  },
  {
    key: "summary",
    label: "Summary",
    width: 280,
    sortable: true,
    className: "summary",
    render: (t) => <span title={t.summary}>{t.summary}</span>,
  },
  {
    key: "updated",
    label: "Date",
    width: 80,
    sortable: true,
    className: "mono",
    render: (t) => formatDate(t.updated, "MMM d"),
  },
  {
    key: "pod",
    label: "POD",
    width: 90,
    render: (t) => <PODBadge pod={t.pod} />,
  },
  {
    key: "client",
    label: "Client",
    width: 120,
    className: "dim",
  },
  {
    key: "issue_type",
    label: "Type",
    width: 110,
    render: (t) => <IssueTypeBadge type={t.issue_type} />,
  },
  {
    key: "status",
    label: "Status",
    width: 160,
    render: (t) => <StatusBadge status={t.status} />,
  },
  {
    key: "hours_spent",
    label: "Hours",
    width: 70,
    sortable: true,
    className: "hours",
    render: (t) => formatHours(t.hours_spent),
  },
  {
    key: "url",
    label: "",
    width: 40,
    render: (t) =>
      t.url && t.url !== "#" ? (
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
            window.open(t.url, "_blank");
          }}
          title="Open in Jira"
        >
          ↗
        </button>
      ) : null,
  },
];

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
  const { data, isLoading } = useQuery({
    queryKey: ["engineer-tickets", engineer?.user, dateFrom, dateTo],
    queryFn: () => fetchTickets({ user: engineer!.user, dateFrom, dateTo }),
    enabled: !!engineer,
  });

  const tickets = data?.tickets ?? [];
  const totalHours = tickets.reduce((s, t) => s + t.hours_spent, 0);
  const color = engineer ? getColor(engineer.user) : "#4F7EFF";

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
          value: `${formatNumber(Math.round(totalHours * 4) / 4)}h`,
          color,
        },
        { label: "Tickets", value: String(tickets.length) },
        {
          label: "Active Days",
          value: String(
            new Set(tickets.map((t) => t.updated?.slice(0, 10))).size,
          ),
        },
        {
          label: "Clients",
          value: String(new Set(tickets.map((t) => t.client)).size),
        },
      ]}
      footer={
        <p className={styles.footerNote}>
          Showing {tickets.length} tickets for <strong>{engineer?.user}</strong>
          . Read-only — to log time use the Timesheet screen.
        </p>
      }
    >
      <DataTable<Ticket>
        columns={COLUMNS}
        rows={tickets}
        rowKey="key"
        isLoading={isLoading}
        virtualize={false}
        maxHeight={500}
        stickyHeader
        emptyIcon="📭"
        emptyTitle="No tickets found"
        emptyDesc="No tickets for this date range."
      />
    </SideDrawer>
  );
}
