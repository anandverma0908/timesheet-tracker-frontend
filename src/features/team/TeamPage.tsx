import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useFilterStore } from "@/store";
import { fetchSummary } from "@/services/api";
import { QUERY_KEYS } from "@/config/queryKeys";
import { useDebounce } from "@/hooks";
import { getPodColor } from "@/config/themes";
import { initials, formatNumber } from "@/utils/formatters";
import EmptyState from "@/components/ui/EmptyState";
import styles from "./TeamPage.module.css";
import EngineerDrawer from "./EngineerDrawer";
import { SummaryByUser } from "@/types";

export default function TeamPage() {
  const [selectedPod, setSelectedPod] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedEngineer, setSelectedEngineer] =
    useState<SummaryByUser | null>(null);
  const debouncedSearch = useDebounce(search, 250);
  const filters = useFilterStore();

  console.log({ selectedEngineer });

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.summary({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      pod: selectedPod,
    }),
    queryFn: () =>
      fetchSummary({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        pod: selectedPod,
      }),
  });

  const allPods = [...new Set(data?.by_pod.map((p) => p.pod) ?? [])];
  const maxHours = Math.max(...(data?.by_user.map((u) => u.hours) ?? [1]));

  const engineers = (data?.by_user ?? [])
    .filter((u) => {
      if (!debouncedSearch) return true;
      return u.user.toLowerCase().includes(debouncedSearch.toLowerCase());
    })
    .sort((a, b) => b.hours - a.hours);

  const avatarColors = [
    "linear-gradient(135deg,#4F7EFF,#818CF8)",
    "linear-gradient(135deg,#34D399,#10B981)",
    "linear-gradient(135deg,#FBBF24,#F59E0B)",
    "linear-gradient(135deg,#F87171,#FCA5A5)",
    "linear-gradient(135deg,#A78BFA,#C4B5FD)",
    "linear-gradient(135deg,#22D3EE,#67E8F9)",
    "linear-gradient(135deg,#64748B,#94A3B8)",
  ];

  function getAvatarColor(name: string) {
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={`${styles.header} fade-up`}>
        <div>
          <h1 className={styles.title}>Team</h1>
          <p className={styles.subtitle}>
            {isLoading
              ? "Loading…"
              : `${engineers.length} engineers · ${allPods.length} PODs`}
          </p>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-ghost btn-sm">Sort: Hours ↓</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => toast.success("Team report downloading…")}
          >
            ↓ Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className={`${styles.controls} fade-up-1`}>
        <span className={styles.podLabel}>POD:</span>

        <button
          className={`${styles.podPill} ${!selectedPod ? styles.podPillActive : ""}`}
          onClick={() => setSelectedPod(null)}
        >
          All
        </button>

        {allPods.map((pod) => (
          <button
            key={pod}
            className={`${styles.podPill} ${selectedPod === pod ? styles.podPillActive : ""}`}
            style={
              selectedPod === pod
                ? {
                    background: getPodColor(pod),
                    borderColor: getPodColor(pod),
                  }
                : {}
            }
            onClick={() => setSelectedPod(pod === selectedPod ? null : pod)}
          >
            {pod}
          </button>
        ))}

        <div style={{ marginLeft: "auto" }}>
          <input
            className="input input-sm"
            style={{ width: 190, borderRadius: "100px" }}
            placeholder="🔍  Search engineer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={styles.cardSkeleton} />
          ))}
        </div>
      ) : engineers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No engineers found"
          desc="Try a different POD or search term."
        />
      ) : (
        <div className={`${styles.grid} fade-up-2`}>
          {engineers.map((eng, i) => (
            <div
              key={eng.user}
              className={styles.card}
              style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
              onClick={() => setSelectedEngineer(eng)}
            >
              {/* Top accent line on hover handled by CSS */}
              <div
                className={styles.avatar}
                style={{ background: getAvatarColor(eng.user) }}
              >
                {initials(eng.user)}
              </div>

              <div className={styles.name}>{eng.user}</div>
              <div className={styles.pod}>{eng.clients[0] ?? "—"}</div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div
                    className={styles.statVal}
                    style={{
                      color: getAvatarColor(eng.user).includes("4F7EFF")
                        ? "var(--accent)"
                        : undefined,
                    }}
                  >
                    {formatNumber(Math.round(eng.hours))}h
                  </div>
                  <div className={styles.statLabel}>Hours</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statVal}>{eng.tickets}</div>
                  <div className={styles.statLabel}>Tickets</div>
                </div>
              </div>

              <div className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${(eng.hours / maxHours) * 100}%`,
                    background: getAvatarColor(eng.user),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <EngineerDrawer
        engineer={selectedEngineer}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onClose={() => setSelectedEngineer(null)}
      />
    </div>
  );
}
