import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, MOCK_USERS } from './useAuthStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate  = useNavigate()
  const login     = useAuthStore(s => s.login)
  const isMock    = import.meta.env.VITE_USE_MOCK === 'true'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function quickLogin(email: string, password: string) {
    setEmail(email)
    setPassword(password)
  }

  return (
    <div className={styles.root}>

      {/* Left panel */}
      <div className={styles.left}>
        <div className={styles.leftAccent} />
        <div className={styles.leftAccent2} />

        <div className={styles.logoRow}>
          <div className={styles.logoMark}>⚡</div>
          <div>
            <div className={styles.logoName}>Analytics</div>
            <div className={styles.logoTag}>Engineering Platform</div>
          </div>
        </div>

        <div className={styles.brandContent}>
          <div className={styles.eyebrow}>Engineering Intelligence</div>
          <h1 className={styles.headline}>
            Your Jira data,<br />
            <em>beautifully</em><br />
            visualised
          </h1>
          <p className={styles.desc}>
            Connect once. Track hours, tickets, and team performance
            across engineers, projects, and clients — all in real time.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statVal}>300+</div>
              <div className={styles.statLbl}>Engineers</div>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <div className={styles.statVal}>30</div>
              <div className={styles.statLbl}>Projects</div>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <div className={styles.statVal}>34</div>
              <div className={styles.statLbl}>Clients</div>
            </div>
          </div>
        </div>

        {/* Role previews */}
        <div className={styles.roleList}>
          {[
            { role: 'Admin',              desc: 'Full access to all screens and settings' },
            { role: 'Engineering Manager',desc: 'Dashboard, tickets, team, exports'        },
            { role: 'Tech Lead',          desc: 'Own POD view + AI time entry'             },
            { role: 'Finance Viewer',     desc: 'Reports and exports only'                 },
          ].map(r => (
            <div key={r.role} className={styles.roleItem}>
              <div className={styles.roleDot} />
              <div>
                <div className={styles.roleTitle}>{r.role}</div>
                <div className={styles.roleDesc}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className={styles.right}>
        <div className={styles.formWrap}>

          <div className={styles.formTitle}>Sign in</div>
          <div className={styles.formSub}>
            {isMock
              ? 'Demo mode — use any quick login below'
              : 'Enter your credentials to access the platform'}
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>✉</span>
                <input
                  className={`${styles.input} ${error ? styles.inputError : ''}`}
                  type="email"
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  className={`${styles.input} ${styles.inputWithPad} ${error ? styles.inputError : ''}`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorMsg}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <><div className={styles.spinner} /> Signing in…</>
              ) : (
                'Sign in →'
              )}
            </button>
          </form>

          {/* Security note */}
          <div className={styles.secNote}>
            <div className={styles.secDot} />
            Credentials are verified against your organisation's user list. Contact your admin to reset your password.
          </div>

          {/* Quick logins — mock mode only */}
          {isMock && (
            <div className={styles.quickSection}>
              <div className={styles.quickLabel}>Quick login — demo accounts</div>
              <div className={styles.quickList}>
                {MOCK_USERS.map(u => (
                  <button
                    key={u.id}
                    className={styles.quickBtn}
                    onClick={() => quickLogin(u.email, u.password)}
                    type="button"
                  >
                    <div className={styles.quickAvatar}>
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className={styles.quickName}>{u.name}</div>
                      <div className={styles.quickRole}>{u.role.replace(/_/g, ' ')}</div>
                    </div>
                    <span className={styles.quickArrow}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
