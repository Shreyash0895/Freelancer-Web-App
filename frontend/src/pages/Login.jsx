import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { showToast } from "../utils/toast";

export default function Login() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) { showToast("error", "Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5001/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role",  res.data.role);
      localStorage.setItem("email", email);
      showToast("success", "Welcome back!");
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ── LEFT: Background Image Panel ── */}
      <div style={s.visual}>
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&q=80&auto=format&fit=crop"
          alt="team"
          style={s.bgImg}
        />
        <div style={s.overlay} />
        <div style={s.visualContent}>
          <div style={s.badge}>✦ Trusted by 50,000+ professionals</div>
          <h2 style={s.headline}>
            The marketplace<br />built for{" "}
            <span style={s.headlineAccent}>real work.</span>
          </h2>
          <p style={s.sub}>
            Post projects, find elite freelancers,<br />and close deals — all in one place.
          </p>
          <div style={s.statsRow}>
            <div style={s.statItem}><strong style={s.statNum}>12K+</strong><span style={s.statLabel}>Active projects</span></div>
            <div style={s.statItem}><strong style={s.statNum}>98%</strong><span style={s.statLabel}>Satisfaction</span></div>
            <div style={s.statItem}><strong style={s.statNum}>4.9★</strong><span style={s.statLabel}>Avg rating</span></div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div style={s.formSide}>
        <div style={s.formCard}>
          <div style={s.logo}>Freelance<span style={s.logoPink}>Hub</span></div>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.subtitle}>Sign in to your account to continue</p>

          <form onSubmit={handleLogin} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={s.input}
                onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                onBlur={e => Object.assign(e.target.style, s.input)}
                autoComplete="email"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.passWrap}>
                <input
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...s.input, paddingRight: 48 }}
                  onFocus={e => Object.assign(e.target.style, { ...s.inputFocus, paddingRight: "48px" })}
                  onBlur={e => Object.assign(e.target.style, { ...s.input, paddingRight: "48px" })}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(!show)} style={s.eyeBtn}>
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={loading ? { ...s.submitBtn, opacity: 0.6 } : s.submitBtn}>
              {loading
                ? <span style={s.spinner} />
                : "Sign in →"
              }
            </button>
          </form>

          <p style={s.switchText}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              style={s.switchLink}
            >
              Create one
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: "#07080f",
  },
  visual: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    minHeight: "100vh",
  },
  bgImg: {
    position: "absolute",
    top: 0, left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(160deg, rgba(7,8,15,0.85) 0%, rgba(10,12,30,0.55) 40%, rgba(7,8,15,0.90) 100%)",
    zIndex: 1,
  },
  visualContent: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    zIndex: 2,
    padding: "60px 52px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(108,99,255,0.18)",
    border: "1px solid rgba(108,99,255,0.45)",
    borderRadius: 100,
    padding: "6px 18px",
    fontSize: 14,
    fontWeight: 600,
    color: "#a78bfa",
    marginBottom: 28,
    letterSpacing: "0.4px",
  },
  headline: {
    fontFamily: "Georgia, serif",
    fontSize: 46,
    fontWeight: 700,
    lineHeight: 1.15,
    color: "#ffffff",
    margin: "0 0 18px 0",
    letterSpacing: "-1px",
  },
  headlineAccent: {
    background: "linear-gradient(90deg, #6c63ff, #f472b6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontStyle: "italic",
  },
  sub: {
    fontSize: 17,
    lineHeight: 1.75,
    color: "rgba(255,255,255,0.55)",
    margin: "0 0 36px 0",
  },
  statsRow: {
    display: "flex",
    gap: 40,
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  statNum: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    fontFamily: "Georgia, serif",
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
  },
  formSide: {
    width: 460,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 44px",
    background: "#0d0f1e",
    borderLeft: "1px solid rgba(255,255,255,0.07)",
  },
  formCard: {
    width: "100%",
  },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 40,
    background: "linear-gradient(135deg, #a78bfa, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },
  logoPink: {
    WebkitTextFillColor: "#f472b6",
  },
  title: {
    fontSize: 30,
    fontWeight: 800,
    color: "#f0f0ff",
    margin: "0 0 8px 0",
    letterSpacing: "-0.8px",
    fontFamily: "Georgia, serif",
  },
  subtitle: {
    fontSize: 16,
    color: "#7a83aa",
    margin: "0 0 36px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 28,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 500,
    color: "#7a83aa",
  },
  input: {
    background: "#13162a",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 16,
    color: "#f0f0ff",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.2s",
    fontFamily: "inherit",
  },
  inputFocus: {
    background: "#181c35",
    border: "1px solid #6c63ff",
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 14,
    color: "#f0f0ff",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "0 0 0 3px rgba(108,99,255,0.15)",
    fontFamily: "inherit",
  },
  passWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    padding: 0,
    lineHeight: 1,
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)",
    color: "#fff",
    fontSize: 17,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    letterSpacing: "0.2px",
    fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(108,99,255,0.35)",
  },
  spinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.25)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  switchText: {
    textAlign: "center",
    fontSize: 16,
    color: "#7a83aa",
    margin: 0,
  },
  switchLink: {
    color: "#a78bfa",
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: 4,
  },
};