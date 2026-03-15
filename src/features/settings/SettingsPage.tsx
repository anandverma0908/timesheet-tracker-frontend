import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeStore } from "@/store";
import { THEMES } from "@/config/themes";
import { getAuthHeader, useAuthStore } from "@/features/auth/useAuthStore";
import styles from "./SettingsPage.module.css";
import MultiSelect from "@/components/ui/MultiSelect";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface JiraConfig {
  jira_url: string;
  jira_email: string;
  jira_api_token: string;
  jira_project_key: string; // comma-separated active projects
  jira_client_field: string;
  jira_pod_field: string;
}

async function fetchSettings(): Promise<JiraConfig> {
  const res = await fetch(`${API}/api/settings`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

async function fetchAllProjects(): Promise<string[]> {
  const res = await fetch(`${API}/api/filters`, { headers: getAuthHeader() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.projects ?? [];
}

async function saveSettings(data: Partial<JiraConfig>): Promise<JiraConfig> {
  const res = await fetch(`${API}/api/settings/jira`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to save settings");
  }
  return res.json();
}

async function triggerSync(): Promise<void> {
  const res = await fetch(`${API}/api/sync`, {
    method: "POST",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Sync failed");
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { themeId, colorMode, setTheme, toggleMode } = useThemeStore();
  const { can, user } = useAuthStore();

  const [form, setForm] = useState<JiraConfig>({
    jira_url: "",
    jira_email: "",
    jira_api_token: "",
    jira_project_key: "",
    jira_client_field: "customfield_10233",
    jira_pod_field: "customfield_10193",
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  // Active projects — parsed from the comma-separated jira_project_key
  const activeProjects = form.jira_project_key
    ? form.jira_project_key
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // Load settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  // Load all available projects from DB (synced from Jira)
  const { data: allProjects = [] } = useQuery({
    queryKey: ["all-projects"],
    queryFn: fetchAllProjects,
  });

  useEffect(() => {
    if (!settingsData) return;
    setForm({
      jira_url: settingsData.jira_url || "",
      jira_email: settingsData.jira_email || "",
      jira_api_token: settingsData.jira_api_token || "",
      jira_project_key: settingsData.jira_project_key || "",
      jira_client_field: settingsData.jira_client_field || "customfield_10233",
      jira_pod_field: settingsData.jira_pod_field || "customfield_10193",
    });
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["filters"] });
      toast.success("Configuration saved ✓");
    },
    onError: (err: any) => toast.error(err.message || "Save failed"),
  });

  function handleChange(key: keyof JiraConfig, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Toggle a project in/out of the active list
  function toggleProject(project: string) {
    const current = activeProjects;
    const next = current.includes(project)
      ? current.filter((p) => p !== project)
      : [...current, project];
    setForm((prev) => ({ ...prev, jira_project_key: next.join(",") }));
  }

  function selectAllProjects() {
    setForm((prev) => ({ ...prev, jira_project_key: allProjects.join(",") }));
  }

  function clearAllProjects() {
    setForm((prev) => ({ ...prev, jira_project_key: "" }));
  }

  async function handleTest() {
    setIsTesting(true);
    try {
      const res = await fetch(`${API}/health`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error();
      toast.success("Backend is reachable ✓");
    } catch {
      toast.error("Cannot reach backend — is it running on :8000?");
    } finally {
      setIsTesting(false);
    }
  }
  console.log({ form });
  function handleSave() {
    if (!form.jira_url || !form.jira_email || !form.jira_api_token) {
      toast.error("Please fill in Jira URL, email, and API token");
      return;
    }
    saveMutation.mutate(form);
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      await triggerSync();
      toast.success("Jira sync started in background ✓");
    } catch {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  const filteredProjects = allProjects.filter((p) =>
    p.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Configure your Jira connection and app preferences
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* ── Jira Connection ── */}
          {can("manage:jira_config") && (
            <div className="card">
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>🔌</span>
                <div>
                  <div className={styles.cardTitle}>Jira Connection</div>
                  <div className={styles.cardSubtitle}>
                    Credentials are stored in the database — not in .env
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className={styles.loading}>Loading…</div>
              ) : (
                <div className={styles.formGrid}>
                  <Field label="Jira URL *">
                    <input
                      className="input"
                      placeholder="https://yourcompany.atlassian.net"
                      value={form.jira_url}
                      onChange={(e) => handleChange("jira_url", e.target.value)}
                    />
                  </Field>

                  <Field label="Email *">
                    <input
                      className="input"
                      type="email"
                      placeholder="you@company.com"
                      value={form.jira_email}
                      onChange={(e) =>
                        handleChange("jira_email", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="API Token *">
                    <input
                      className="input"
                      type="password"
                      placeholder="ATATT3x…"
                      value={form.jira_api_token}
                      onChange={(e) =>
                        handleChange("jira_api_token", e.target.value)
                      }
                    />
                    <span className={styles.fieldHint}>
                      Generate at{" "}
                      <a
                        href="https://id.atlassian.com/manage-profile/security/api-tokens"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--accent)" }}
                      >
                        id.atlassian.com
                      </a>
                    </span>
                  </Field>
                  <>
                    {allProjects.length > 0 && (
                      <div>
                        <Field label="Active Projects">
                          <MultiSelect
                            options={allProjects}
                            selected={activeProjects}
                            onChange={(selected) =>
                              setForm((prev) => ({
                                ...prev,
                                jira_project_key: selected.join(","),
                              }))
                            }
                            placeholder="Leave empty to show all projects"
                          />
                          <span className={styles.fieldHint}>
                            {activeProjects.length === 0
                              ? "No filter — all projects visible to everyone"
                              : `${activeProjects.length} of ${allProjects.length} projects selected`}
                          </span>
                        </Field>
                      </div>
                    )}
                  </>

                  <Field label="Client Custom Field">
                    <input
                      className="input"
                      placeholder="customfield_10233"
                      value={form.jira_client_field}
                      onChange={(e) =>
                        handleChange("jira_client_field", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="POD Custom Field">
                    <input
                      className="input"
                      placeholder="customfield_10193"
                      value={form.jira_pod_field}
                      onChange={(e) =>
                        handleChange("jira_pod_field", e.target.value)
                      }
                    />
                  </Field>
                </div>
              )}

              {/* Active Projects — inline with Jira config */}
              <div className={styles.cardActions}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleTest}
                  disabled={isTesting}
                >
                  {isTesting ? "⏳ Testing…" : "⟳ Test Connection"}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "⏳ Saving…" : "Save Configuration"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  style={{ marginLeft: "auto" }}
                >
                  {isSyncing ? "⏳ Syncing…" : "⟳ Sync Jira Now"}
                </button>
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          <div className="card">
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🎨</span>
              <div>
                <div className={styles.cardTitle}>Appearance</div>
                <div className={styles.cardSubtitle}>
                  Accent color and light/dark mode
                </div>
              </div>
            </div>

            <div className={styles.appearanceSection}>
              <div className={styles.appearanceLabel}>Accent Color</div>
              <div className={styles.themeRow}>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      toast.success(`Theme: ${t.name}`);
                    }}
                    className={`${styles.themePill} ${themeId === t.id ? styles.themePillActive : ""}`}
                    style={
                      themeId === t.id
                        ? { borderColor: t.color, background: `${t.color}18` }
                        : {}
                    }
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: t.color,
                        flexShrink: 0,
                        display: "block",
                      }}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.appearanceSection}>
              <div className={styles.appearanceLabel}>Color Mode</div>
              <div className={styles.themeRow}>
                {(
                  [
                    ["dark", "🌙 Dark"],
                    ["light", "☀️ Light"],
                  ] as const
                ).map(([m, l]) => (
                  <button
                    key={m}
                    onClick={() => {
                      if (colorMode !== m) toggleMode();
                    }}
                    className={`${styles.themePill} ${colorMode === m ? styles.themePillActive : ""}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        {/* ── Sidebar ── */}
        <div className="card" style={{ padding: 20, alignSelf: "start" }}>
          {/* Quick Start — admin only */}
          {user?.role === "admin" && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                Quick Start
              </div>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  <>Enter your Jira URL, email, and API token</>,
                  <>
                    <strong>Test Connection</strong> to verify the backend is
                    reachable
                  </>,
                  <>
                    <strong>Save Configuration</strong> — stored securely in the
                    database
                  </>,
                  <>
                    <strong>Sync Jira Now</strong> to pull all tickets
                    immediately
                  </>,
                  <>
                    Go to <strong>Active Projects</strong> and select which
                    projects to show
                  </>,
                  <>
                    Save Projects — only those tickets will appear across the
                    app
                  </>,
                ].map((s, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 12,
                      color: "var(--text-2)",
                      lineHeight: 1.6,
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ol>

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  marginTop: 20,
                  paddingTop: 16,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  How project filter works
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--text-2)",
                    lineHeight: 1.6,
                  }}
                >
                  All Jira data is synced to the database. When you select
                  active projects here, the backend filters all queries —
                  tickets, dashboard, team — to only those projects. Deselect
                  all to show everything.
                </p>
              </div>
            </>
          )}

          {/* Appearance info — visible to all */}
          {user?.role !== "admin" && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                Appearance
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                }}
              >
                Customise your accent colour and switch between light and dark
                mode. These preferences are saved locally to your browser.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-2)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
