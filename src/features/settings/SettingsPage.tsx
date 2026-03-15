import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore, useThemeStore } from "@/store";
import { THEMES } from "@/config/themes";
import { getAuthHeader } from "@/features/auth/useAuthStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface JiraConfig {
  jira_url: string;
  jira_email: string;
  jira_api_token: string;
  jira_project_key: string;
  jira_client_field: string;
  jira_pod_field: string;
}

async function fetchSettings(): Promise<JiraConfig> {
  const res = await fetch(`${API}/api/settings`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
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

async function testConnection(): Promise<void> {
  const res = await fetch(`${API}/health`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error("Backend returned an error");
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

  // ── Load current settings from DB ──────────────────────────────────────────
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
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

  // ── Save to DB ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configuration saved ✓");
    },
    onError: (err: any) => toast.error(err.message || "Save failed"),
  });

  function handleChange(key: keyof JiraConfig, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTest() {
    setIsTesting(true);
    try {
      await testConnection();
      toast.success("Backend is reachable ✓");
    } catch {
      toast.error("Cannot reach backend — is it running on :8000?");
    } finally {
      setIsTesting(false);
    }
  }

  function handleSave() {
    console.log({form})
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

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          Settings
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-2)" }}>
          Configure your Jira connection and app preferences
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ── Jira Connection ─────────────────────────────────────────────── */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                paddingBottom: 14,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 16 }}>🔌</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  Jira Connection
                </div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                  Credentials are stored in the database — not in .env
                </div>
              </div>
            </div>

            {isLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "var(--text-2)",
                  fontSize: 13,
                }}
              >
                Loading…
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
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
                    onChange={(e) => handleChange("jira_email", e.target.value)}
                  />
                </Field>

                <Field label="API Token *" style={{ gridColumn: "1 / -1" }}>
                  <input
                    className="input"
                    type="password"
                    placeholder="ATATT3x…"
                    value={form.jira_api_token}
                    onChange={(e) =>
                      handleChange("jira_api_token", e.target.value)
                    }
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
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

                <Field label="Default Project Key">
                  <input
                    className="input"
                    placeholder="DPAI (or leave blank for all)"
                    value={form.jira_project_key}
                    onChange={(e) =>
                      handleChange("jira_project_key", e.target.value)
                    }
                  />
                </Field>

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

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
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

          {/* ── Appearance ──────────────────────────────────────────────────── */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                paddingBottom: 14,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 16 }}>🎨</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Appearance</div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                  Accent color and light/dark mode
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                Accent Color
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      toast.success(`Theme: ${t.name}`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 12,
                      border: `1px solid ${themeId === t.id ? t.color : "var(--border)"}`,
                      background:
                        themeId === t.id ? `${t.color}18` : "transparent",
                      color: "var(--text)",
                      transition: "all .15s",
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
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

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                Color Mode
              </div>
              <div style={{ display: "flex", gap: 8 }}>
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
                    style={{
                      padding: "6px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 12,
                      border: `1px solid ${colorMode === m ? "var(--accent)" : "var(--border)"}`,
                      background:
                        colorMode === m ? "var(--accent-faint)" : "transparent",
                      color: "var(--text)",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Info sidebar ──────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 20 }}>
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
              <>Enter your Jira URL, email, and API token above</>,
              <>
                Click <strong>Test Connection</strong> to verify the backend is
                reachable
              </>,
              <>
                Click <strong>Save Configuration</strong> — stored securely in
                the database
              </>,
              <>
                Click <strong>Sync Jira Now</strong> to do an immediate sync of
                all tickets
              </>,
              <>
                After that, syncs run automatically every 30 minutes in the
                background
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
              Security Note
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.6,
              }}
            >
              Your API token is stored in the database — not in{" "}
              <code>.env</code> or the browser. Regenerate tokens at Atlassian
              if you suspect exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small helper component ─────────────────────────────────────────────────── */
function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
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
