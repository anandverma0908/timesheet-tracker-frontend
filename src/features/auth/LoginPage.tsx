import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./useAuthStore";
import styles from "./LoginPage.module.css";
import EmailIcon from "@mui/icons-material/Email";

type Step = "email" | "otp";

export default function LoginPage() {
  const navigate = useNavigate();
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await requestOtp(email.trim().toLowerCase());
      if (res?.dev_otp) setDevOtp(res.dev_otp);
      setStep("otp");
    } catch (err: any) {
      setError("Failed to send code. Check your email address.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, code.trim());
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setCode("");
    setDevOtp(null);
    setLoading(true);
    try {
      const res = await requestOtp(email);
      if (res?.dev_otp) setDevOtp(res.dev_otp);
    } catch (err: any) {
      setError(err.message ?? "Failed to resend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className={styles.left}>
        <div className={styles.leftAccent} />
        <div className={styles.leftAccent2} />

        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>T</div>
          <div>
            <div className={styles.logoName}>Trackly</div>
            <div className={styles.logoTag}>Work. Tracked.</div>
          </div>
        </div>

        {/* Headline */}
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

          {/* Stats */}
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

        {/* Features */}
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

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className={styles.right}>
        <div className={styles.formWrap}>
          {step === "email" ? (
            <>
              <div className={styles.formTitle}>Sign in</div>
              <div className={styles.formSub}>
                Enter your work email and we'll send you a secure login code. No
                password needed.
              </div>

              <form
                className={styles.form}
                onSubmit={handleRequestOtp}
                noValidate
              >
                <div className={styles.field}>
                  <label className={styles.label}>Organisation email</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>
                      <EmailIcon fontSize="small"/>
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
                      <div className={styles.spinner} /> Sending code…
                    </>
                  ) : (
                    "Send login code →"
                  )}
                </button>
              </form>

              <div className={styles.secNote}>
                <div className={styles.secDot} />
                Access is managed by your organisation. Contact your admin if
                you need an account.
              </div>
            </>
          ) : (
            <>
              <button
                className={styles.backBtn}
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                  setDevOtp(null);
                }}
              >
                ← Back
              </button>

              <div className={styles.formTitle}>Check your inbox</div>
              <div className={styles.formSub}>
                We sent a 6-digit code to <strong>{email}</strong>. It expires
                in 10 minutes.
              </div>

              {/* Dev mode banner */}
              {devOtp && (
                <div className={styles.devOtpBanner}>
                  <span className={styles.devOtpLabel}>DEV</span>
                  <span>Your code:</span>
                  <span
                    className={styles.devOtpCode}
                    onClick={() => setCode(devOtp)}
                    title="Click to fill"
                  >
                    {devOtp}
                  </span>
                  <span className={styles.devOtpHint}>click to fill</span>
                </div>
              )}

              <form
                className={styles.form}
                onSubmit={handleVerifyOtp}
                noValidate
              >
                <div className={styles.field}>
                  <label className={styles.label}>6-digit code</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>🔑</span>
                    <input
                      className={`${styles.input} ${styles.otpInput} ${error ? styles.inputError : ""}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="• • • • • •"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                      }}
                      autoFocus
                      autoComplete="one-time-code"
                    />
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
                  disabled={loading || code.length !== 6}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} /> Verifying…
                    </>
                  ) : (
                    "Sign in →"
                  )}
                </button>
              </form>

              <div className={styles.secNote}>
                <div className={styles.secDot} />
                Didn't receive it?{" "}
                <button
                  className={styles.resendBtn}
                  onClick={handleResend}
                  disabled={loading}
                >
                  Resend code
                </button>{" "}
                or check your spam folder.
              </div>
            </>
          )}

          {/* Bottom branding */}
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
