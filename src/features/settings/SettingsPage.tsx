import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSettingsStore, useThemeStore } from '@/store'
import { THEMES } from '@/config/themes'
import type { JiraConfig } from '@/types'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { jiraConfig, isConnected, setJiraConfig, clearConfig } = useSettingsStore()
  const { themeId, colorMode, setTheme, toggleMode } = useThemeStore()

  const [form, setForm] = useState<JiraConfig>({
    jiraUrl:    jiraConfig?.jiraUrl    ?? '',
    email:      jiraConfig?.email      ?? '',
    apiToken:   jiraConfig?.apiToken   ?? '',
    projectKey: jiraConfig?.projectKey ?? '',
  })

  const [isTesting, setIsTesting] = useState(false)

  function handleChange(key: keyof JiraConfig, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleTest() {
    setIsTesting(true)
    try {
      const res = await fetch('/api/health')
      if (res.ok) toast.success('Backend is reachable ✓')
      else        toast.error('Backend returned an error')
    } catch {
      toast.error('Cannot reach backend — is it running on :8000?')
    } finally {
      setIsTesting(false)
    }
  }

  function handleSave() {
    if (!form.jiraUrl || !form.email || !form.apiToken) {
      toast.error('Please fill in all required fields')
      return
    }
    setJiraConfig(form)
    toast.success('Configuration saved ✓')
  }

  return (
    <div className={styles.page}>

      <div className={`${styles.header} fade-up`}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure your Jira connection and app preferences</p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.left}>

          {/* Jira config */}
          <div className={`${styles.block} fade-up-1`}>
            <div className={styles.blockHeader}>
              <span className={styles.blockIcon}>🔌</span>
              <div>
                <div className={styles.blockTitle}>Jira Connection</div>
                <div className={styles.blockSub}>Your credentials are stored locally in the browser</div>
              </div>
              {isConnected && <div className={styles.connectedBadge}>● Connected</div>}
            </div>
            <div className={styles.blockBody}>
              <div className={styles.formGrid}>
                <div className={styles.fg}>
                  <label className={styles.fl}>Jira URL *</label>
                  <input
                    className="input"
                    placeholder="https://yourcompany.atlassian.net"
                    value={form.jiraUrl}
                    onChange={e => handleChange('jiraUrl', e.target.value)}
                  />
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Email *</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </div>
                <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.fl}>API Token *</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="ATATT3x…"
                    value={form.apiToken}
                    onChange={e => handleChange('apiToken', e.target.value)}
                  />
                  <span className={styles.hint}>
                    Generate at{' '}
                    <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer" className={styles.link}>
                      id.atlassian.com/manage-profile/security/api-tokens
                    </a>
                  </span>
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Default Project Key</label>
                  <input
                    className="input"
                    placeholder="DPAI (or leave blank for all)"
                    value={form.projectKey}
                    onChange={e => handleChange('projectKey', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button className="btn btn-ghost btn-sm" onClick={handleTest} disabled={isTesting}>
                  {isTesting ? '⏳ Testing…' : '⟳ Test Connection'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                  Save Configuration
                </button>
                {isConnected && (
                  <button className="btn btn-danger btn-sm" onClick={() => { clearConfig(); toast('Config cleared') }}>
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className={`${styles.block} fade-up-2`}>
            <div className={styles.blockHeader}>
              <span className={styles.blockIcon}>🎨</span>
              <div>
                <div className={styles.blockTitle}>Appearance</div>
                <div className={styles.blockSub}>Customise accent color and light/dark mode</div>
              </div>
            </div>
            <div className={styles.blockBody}>
              {/* Color themes */}
              <div>
                <div className={styles.fl} style={{ marginBottom: 10 }}>Accent Color</div>
                <div className={styles.themes}>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`${styles.themeBtn} ${themeId === t.id ? styles.themeBtnActive : ''}`}
                      onClick={() => { setTheme(t.id); toast.success(`Theme: ${t.name}`) }}
                    >
                      <div className={styles.themeSwatch} style={{ background: t.color }} />
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode */}
              <div>
                <div className={styles.fl} style={{ marginBottom: 10 }}>Color Mode</div>
                <div className={styles.modeRow}>
                  <button
                    className={`${styles.modeBtn} ${colorMode === 'dark' ? styles.modeBtnActive : ''}`}
                    onClick={() => { if (colorMode !== 'dark') toggleMode() }}
                  >
                    🌙 Dark
                  </button>
                  <button
                    className={`${styles.modeBtn} ${colorMode === 'light' ? styles.modeBtnActive : ''}`}
                    onClick={() => { if (colorMode !== 'light') toggleMode() }}
                  >
                    ☀️ Light
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Info card */}
        <div className={`${styles.info} fade-up-2`}>
          <div className={styles.infoTitle}>Quick Start</div>
          <ol className={styles.infoList}>
            <li>Start the backend: <code className={styles.code}>python3 -m uvicorn main:app --reload --port 8000</code></li>
            <li>Enter your Jira URL, email, and API token above</li>
            <li>Click <strong>Test Connection</strong> to verify</li>
            <li>Click <strong>Save</strong> — credentials stay in your browser</li>
            <li>Go to Dashboard — your real Jira data loads automatically</li>
          </ol>

          <div className={styles.infoTitle} style={{ marginTop: 24 }}>Security Note</div>
          <p className={styles.infoText}>
            Your API token is stored only in <code className={styles.code}>localStorage</code> on your machine.
            It is never sent to any third-party service. Regenerate tokens at Atlassian if you suspect exposure.
          </p>
        </div>
      </div>

    </div>
  )
}
