import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./useAuthStore";
import styles from "./LoginPage.module.css";
import { MdEmail } from "react-icons/md";
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import { FaLock } from "react-icons/fa";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      {/* ── Left panel ── */}
      <div className={styles.left}>
        <div className={styles.leftAccent} />
        <div className={styles.leftAccent2} />

        <div className={styles.logoRow}>
          <div className={styles.logoMark}>T</div>
          <div>
            <div className={styles.logoName}>Trackly</div>
            <div className={styles.logoTag}>Work. Tracked.</div>
          </div>
        </div>

        <div className={styles.brandContent}>
          <div className={styles.eyebrow}>Engineering Intelligence</div>
          <h1 className={styles.headline}>
            The smarter way to track
            <br />
            your team's work.
          </h1>
          <p className={styles.desc}>
            Trackly gives your team a single place to log, review, and report on
            work — connected to the tools you already use.
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

        <div className={styles.roleList}>
          {[
            {
              role: "Automatic Jira sync",
              desc: "Tickets and worklogs pulled every 30 minutes — always up to date",
            },
            {
              role: "AI time entry",
              desc: "Describe your day in plain text — AI structures it instantly",
            },
            {
              role: "Role-based access",
              desc: "Each person sees only what their role permits — nothing more",
            },
          ].map((r) => (
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

      {/* ── Right panel ── */}
      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.formTitle}>Welcome back</div>
          <div className={styles.formSub}>Sign in to your Trackly account.</div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label}>Organisation email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <MdEmail />
                </span>
                <input
                  className={`${styles.input} ${error ? styles.inputError : ""}`}
                  type="email"
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><FaLock /></span>
                <input
                  className={`${styles.input} ${styles.inputWithPad} ${error ? styles.inputError : ""}`}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <IoMdEyeOff fontSize={17} /> : <IoMdEye fontSize={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorMsg}>
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner} /> Signing in…
                </>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <div className={styles.secNote}>
            <div className={styles.secDot} />
            Access is managed by your organisation admin. Contact them if you
            need an account or to reset your password.
          </div>

          <div className={styles.bottomBrand}>
            <span className={styles.bottomLogoMark}>T</span>
            <span className={styles.bottomLogoName}>Trackly</span>
            <span className={styles.bottomDot}>|</span>
            <span>Work. Tracked.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
