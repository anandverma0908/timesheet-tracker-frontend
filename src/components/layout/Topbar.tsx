import { useNavigate, useLocation } from "react-router-dom";
import { useThemeStore } from "@/store";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { getPresetDates, type DatePreset } from "@/config/queryKeys";
import { formatDate } from "@/utils/formatters";
import { ROLE_COLORS, ROLE_LABELS } from "@/features/auth/types";
import styles from "./Topbar.module.css";
import DateRangePicker from "../ui/DateRangePicker";

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Today", value: "today" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last Month", value: "lastMonth" },
  { label: "This FY", value: "thisFY" },
];

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleMode } = useThemeStore();
  const { user, logout, canAccessRoute } = useAuthStore();

  /* Build nav items filtered by role */
  const ALL_NAV = [
    { path: "/dashboard", label: "Dashboard", icon: "▦" },
    { path: "/tickets", label: "Tickets", icon: "≡" },
    { path: "/team", label: "Team", icon: "◎" },
    { path: "/manual-entry", label: "Manual Entry", icon: "✦" },
  ];

  const navItems = ALL_NAV.filter((item) => canAccessRoute(item.path));

  function handlePreset(preset: DatePreset) {
    const { from, to } = getPresetDates(preset);
    /* Could update filter store here — kept simple for now */
    console.log("preset", from, to);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const roleColor = user ? ROLE_COLORS[user.role] : undefined;
  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "?";

  return (
    <header className={styles.topbar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>T</div>
        <div>
          <div className={styles.logoName}>Trackly</div>
          <div className={styles.logoTag}>Work. Tracked.</div>
        </div>
      </div>

      <div className={styles.sep} />

      {/* Nav — only shows routes the user can access */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`${styles.navBtn} ${location.pathname === item.path ? styles.navBtnActive : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right */}
      <div className={styles.right}>
        <DateRangePicker />

        <div className={styles.sep} />

        {/* Mode toggle */}
        <button
          className={styles.iconBtn}
          onClick={toggleMode}
          title="Toggle light/dark"
        >
          {colorMode === "dark" ? "☀️" : "🌙"}
        </button>

        {/* Sync */}
        <div className={styles.syncPill}>
          <div className={styles.syncDot} />
          Synced
        </div>

        {/* Settings */}
        {/* {can("manage:settings") && (
          <button
            className={styles.iconBtn}
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            ⚙️
          </button>
        )} */}

        {/* User pill */}
        {user && (
          <div className={styles.userPill}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.name.split(" ")[0]}</div>
              <div
                className={styles.userRole}
                style={{ color: roleColor?.text, background: roleColor?.bg }}
              >
                {ROLE_LABELS[user.role]}
              </div>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Sign out"
            >
              ⎋
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
