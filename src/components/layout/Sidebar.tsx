import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store";
import { fetchFilters } from "@/services/api";
import { QUERY_KEYS } from "@/config/queryKeys";
import { getPodColor } from "@/config/themes";
import styles from "./Sidebar.module.css";
import { useAuthStore } from "@/features/auth/useAuthStore";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { project, pod, setFilter } = useFilterStore();
  const { can } = useAuthStore();

  const { data: filters } = useQuery({
    queryKey: QUERY_KEYS.filters(),
    queryFn: fetchFilters,
    staleTime: 1000 * 60 * 10,
  });

  const projects = filters?.projects ?? [];
  const pods = filters?.pods ?? [];

  return (
    <aside className={styles.sidebar}>
      {/* Search */}
      <div className={styles.top}>
        <div className={styles.search}>
          <span className={styles.searchIcon}>🔍</span>
          <span className={styles.searchPlaceholder}>
            Search projects, tickets…
          </span>
        </div>
      </div>

      <div className={styles.body}>
        {/* Projects */}
        <div className={styles.section}>Projects</div>

        <SidebarItem
          label="All Projects"
          icon="◈"
          count={filters ? projects.length.toString() : "…"}
          active={!project && location.pathname !== "/settings"}
          onClick={() => {
            setFilter("project", null);
            navigate("/dashboard");
          }}
        />

        {projects.slice(0, 8).map((p) => (
          <SidebarItem
            key={p}
            label={p}
            icon="◈"
            active={project === p}
            onClick={() => {
              setFilter("project", p);
              navigate("/dashboard");
            }}
          />
        ))}

        {projects.length > 8 && (
          <div className={styles.more}>
            + {projects.length - 8} more projects…
          </div>
        )}

        <div className={styles.divider} />

        {/* PODs */}
        <div className={styles.section}>PODs</div>

        <SidebarItem
          label="All PODs"
          icon="▸"
          active={!pod}
          onClick={() => setFilter("pod", null)}
        />

        {pods.slice(0, 6).map((p) => (
          <SidebarItem
            key={p}
            label={p}
            icon="▸"
            dotColor={getPodColor(p)}
            active={pod === p}
            onClick={() => setFilter("pod", p)}
          />
        ))}

        <div className={styles.divider} />

        {/* Reports */}
        <div className={styles.section}>Reports</div>
        <SidebarItem
          label="Monthly Finance"
          icon="📊"
          onClick={() => navigate("/export")}
          active={false}
        />
        <SidebarItem
          label="Manual Entry"
          icon="✦"
          active={location.pathname === "/manual-entry"}
          onClick={() => navigate("/manual-entry")}
        />
        <SidebarItem
          label="Annual FY"
          icon="📋"
          onClick={() => navigate("/export")}
          active={false}
        />

        {/* Settings */}
        {can("manage:settings") && (
          <>
            <div className={styles.divider} />
            <SidebarItem
              label="Settings"
              icon="⚙️"
              active={location.pathname === "/settings"}
              onClick={() => navigate("/settings")}
            />
          </>
        )}
      </div>
    </aside>
  );
}

/* ── Sidebar item ── */
interface SidebarItemProps {
  label: string;
  icon: string;
  count?: string;
  active: boolean;
  dotColor?: string;
  onClick: () => void;
}

function SidebarItem({
  label,
  icon,
  count,
  active,
  dotColor,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      className={`${styles.item} ${active ? styles.itemActive : ""}`}
      onClick={onClick}
    >
      {dotColor ? (
        <span className={styles.dot} style={{ background: dotColor }} />
      ) : (
        <span className={styles.icon}>{icon}</span>
      )}
      <span className={styles.label}>{label}</span>
      {count && <span className={styles.count}>{count}</span>}
    </button>
  );
}
