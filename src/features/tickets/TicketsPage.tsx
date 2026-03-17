import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useFilterStore } from "@/store";
import { fetchTickets, fetchFilters } from "@/services/api";
import { QUERY_KEYS } from "@/config/queryKeys";
import { useDebounce } from "@/hooks";
import { parseNLQuery } from "@/utils/aiParser";
import { formatDate, formatHours } from "@/utils/formatters";
import { IssueTypeBadge, StatusBadge, PODBadge } from "@/components/ui/Badge";
import DataTable, { Column } from "@/components/ui/DataTable";
import type { Ticket } from "@/types";
import styles from "./TicketsPage.module.css";

const AI_SUGGESTIONS = [
  "Bugs from Colgate last month",
  "Top engineers by hours this FY",
  "All DPAI meetings this month",
  "DevOps tickets in progress",
  "Hours by client this quarter",
];

const COLUMNS: Column<Ticket>[] = [
  {
    key: "key",
    label: "Key",
    width: 110,
    render: (t) => <span className={styles.key}>{t.key}</span>,
  },
  {
    key: "summary",
    label: "Summary",
    width: 280,
    sortable: true,
    render: (t) => (
      <span className={`${styles.summary} truncate`}>{t.summary}</span>
    ),
  },
  {
    key: "assignee",
    label: "Assignee",
    width: 150,
    sortable: true,
    className: "dim",
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
    width: 140,
    className: "dim",
  },
  {
    key: "issue_type",
    label: "Type",
    width: 90,
    render: (t) => <IssueTypeBadge type={t.issue_type} />,
  },
  {
    key: "status",
    label: "Status",
    width: 140,
    render: (t) => <StatusBadge status={t.status} />,
  },
  {
    key: "updated",
    label: "Updated",
    width: 90,
    sortable: true,
    className: "dim",
    render: (t) => formatDate(t.updated),
  },
  {
    key: "hours_spent",
    label: "Hours",
    width: 70,
    sortable: true,
    render: (t) => (
      <span className={styles.hours}>{formatHours(t.hours_spent)}</span>
    ),
  },
];

export default function TicketsPage() {
  const [aiQuery, setAiQuery] = useState("");

  const filters = useFilterStore();
  const { pods, clients, togglePod, toggleClient, clearPods, clearClients } =
    useFilterStore();
  const debouncedSearch = useDebounce(filters.search, 300);

  const { data: filtersData } = useQuery({
    queryKey: QUERY_KEYS.filters(),
    queryFn: fetchFilters,
  });

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.tickets({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      user: filters.user,
      pods,
      clients,
    }),
    queryFn: () =>
      fetchTickets({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        user: filters.user,
        pods,
        clients,
      }),
  });

  const tickets: Ticket[] = (data?.tickets ?? []).filter((t) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      t.key.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.assignee.toLowerCase().includes(q) ||
      t.client.toLowerCase().includes(q)
    );
  });

  function handleAISearch(query: string) {
    setAiQuery(query);
    if (!query.trim()) return;
    const parsed = parseNLQuery(query, {
      pods: filtersData?.pods ?? [],
      clients: filtersData?.clients ?? [],
      users: filtersData?.users ?? [],
      projects: filtersData?.projects ?? [],
    });
    Object.entries(parsed.filters).forEach(([k, v]) =>
      filters.setFilter(k as keyof typeof filters, v as string | null),
    );
    toast.success("Filters applied from AI search");
  }

  const activeFilters = [
    filters.project && {
      label: `Project: ${filters.project}`,
      onRemove: () => filters.setFilter("project", null),
    },
    filters.user && {
      label: `Engineer: ${filters.user}`,
      onRemove: () => filters.setFilter("user", null),
    },
    ...pods.map((p) => ({ label: `POD: ${p}`, onRemove: () => togglePod(p) })),
    ...clients.map((c) => ({
      label: `Client: ${c}`,
      onRemove: () => toggleClient(c),
    })),
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={`${styles.header} fade-up`}>
        <div>
          <h1 className={styles.title}>Tickets</h1>
          <p className={styles.subtitle}>
            {isLoading
              ? "Loading…"
              : `${(data?.count ?? tickets.length).toLocaleString()} tickets synced from Jira — filtered to ${tickets.length.toLocaleString()} results.`}
          </p>
        </div>
      </div>

      {/* AI Search */}
      {/* <div className={`${styles.aiWrap} fade-up-1`}>
        <div className={styles.aiInner}>
          <div className={styles.aiBadge}>
            <div className={styles.aiDot} />
            AI
          </div>
          <input
            className={styles.aiInput}
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAISearch(aiQuery)}
            placeholder='Ask in plain English: "show bug tickets from Colgate in DPAI last month"…'
          />
          {aiQuery && (
            <button className={styles.aiClear} onClick={() => setAiQuery("")}>
              ✕
            </button>
          )}
          <div className={styles.aiKbd}>⌘K</div>
        </div>
        <div className={styles.aiSugs}>
          {AI_SUGGESTIONS.map((s) => (
            <button
              key={s}
              className={styles.aiSug}
              onClick={() => handleAISearch(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div> */}

      {/* Filter bar */}
      <div className={`${styles.filterBar} fade-up-2`}>
        <span className={styles.filterLabel}>Filters: </span>
        <input
          className={`input input-sm ${styles.searchInline}`}
          placeholder="Search tickets…"
          value={filters.search}
          onChange={(e) => filters.setFilter("search", e.target.value)}
          style={{ width: 160 }}
        />
        {activeFilters.map((f) => (
          <button key={f.label} className="chip active" onClick={f.onRemove}>
            {f.label} <span className="chip-close">✕</span>
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              filters.resetFilters();
              clearPods();
              clearClients();
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="fade-up-3">
        <DataTable<Ticket>
          columns={COLUMNS}
          rows={tickets}
          rowKey="key"
          isLoading={isLoading}
          onRowClick={(t) => t.url && window.open(t.url, "_blank")}
          emptyIcon="📭"
          emptyTitle="No tickets found"
          emptyDesc="Try adjusting your filters or date range."
          footerLeft={
            !isLoading && tickets.length > 0
              ? `Showing ${Math.min(tickets.length, data?.count ?? 0).toLocaleString()} of ${(data?.count ?? 0).toLocaleString()} tickets`
              : undefined
          }
        />
      </div>
    </div>
  );
}
