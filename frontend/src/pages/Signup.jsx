import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { showToast } from "../utils/toast";

export default function Signup() {
  const navigate = useNavigate();
  const [role,    setRole]    = useState("freelancer");
  const [show,    setShow]    = useState(false);
  const [show2,   setShow2]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirm: "" });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignup = async (e) => {
    e?.preventDefault();
    if (!form.name || !form.email || !form.password) { showToast("error", "Please fill in all fields"); return; }
    if (form.password !== form.confirm)               { showToast("error", "Passwords do not match");   return; }
    if (form.password.length < 6)                     { showToast("error", "Password min 6 characters"); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:5001/signup", {
        name: form.name, email: form.email, password: form.password, role,
      });
      showToast("success", "Account created! Please sign in.");
      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ── LEFT: Form Panel ── */}
      <div style={s.formSide}>
        <div style={s.formCard}>
          <div style={s.logo}>Freelance<span style={s.logoPink}>Hub</span></div>
          <h1 style={s.title}>Create account</h1>
          <p style={s.subtitle}>Join thousands of clients and freelancers</p>

          {/* Role toggle */}
          <div style={s.roleToggle}>
            <button
              type="button"
              onClick={() => setRole("freelancer")}
              style={role === "freelancer" ? s.roleActive : s.roleBtn}
            >
              🎨 Freelancer
            </button>
            <button
              type="button"
              onClick={() => setRole("client")}
              style={role === "client" ? s.roleActive : s.roleBtn}
            >
              💼 Client
            </button>
          </div>

          <form onSubmit={handleSignup} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Full name</label>
              <input
                placeholder="John Doe"
                onChange={set("name")}
                style={s.input}
                onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                onBlur={e => Object.assign(e.target.style, s.input)}
                autoComplete="name"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                onChange={set("email")}
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
                  placeholder="Min. 6 characters"
                  onChange={set("password")}
                  style={{ ...s.input, paddingRight: 48 }}
                  onFocus={e => Object.assign(e.target.style, { ...s.inputFocus, paddingRight: "48px" })}
                  onBlur={e => Object.assign(e.target.style, { ...s.input, paddingRight: "48px" })}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShow(!show)} style={s.eyeBtn}>{show ? "🙈" : "👁️"}</button>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Confirm password</label>
              <div style={s.passWrap}>
                <input
                  type={show2 ? "text" : "password"}
                  placeholder="Repeat password"
                  onChange={set("confirm")}
                  style={{ ...s.input, paddingRight: 48 }}
                  onFocus={e => Object.assign(e.target.style, { ...s.inputFocus, paddingRight: "48px" })}
                  onBlur={e => Object.assign(e.target.style, { ...s.input, paddingRight: "48px" })}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShow2(!show2)} style={s.eyeBtn}>{show2 ? "🙈" : "👁️"}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={loading ? { ...s.submitBtn, opacity: 0.6 } : s.submitBtn}>
              {loading ? <span style={s.spinner} /> : "Create account →"}
            </button>
          </form>

          <p style={s.switchText}>
            Already have an account?{" "}
            <span onClick={() => navigate("/")} style={s.switchLink}>Sign in</span>
          </p>
        </div>
      </div>

      {/* ── RIGHT: Background Image Panel ── */}
      <div style={s.visual}>
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&q=80&auto=format&fit=crop"
          alt="freelancer"
          style={s.bgImg}
        />
        <div style={s.overlay} />
        <div style={s.visualContent}>
          <div style={s.badge}>✦ No commission until you earn</div>
          <h2 style={s.headline}>
            Your skills.<br />Your schedule.<br />
            <span style={s.headlineAccent}>Your income.</span>
          </h2>
          <p style={s.sub}>
            Whether you're hiring or looking for work —<br />
            FreelanceHub connects the right people.
          </p>
          <div style={s.steps}>
            {["Create your profile", "Post or browse projects", "Get paid securely"].map((txt, i) => (
              <div key={i} style={s.step}>
                <div style={s.stepNum}>0{i + 1}</div>
                <p style={s.stepText}>{txt}</p>
              </div>
            ))}
          </div>
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
  formSide: {
    width: 480,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 44px",
    background: "#0d0f1e",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    overflowY: "auto",
  },
  formCard: { width: "100%" },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 32,
    background: "linear-gradient(135deg, #a78bfa, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  logoPink: { WebkitTextFillColor: "#f472b6" },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#f0f0ff",
    margin: "0 0 8px 0",
    letterSpacing: "-0.8px",
    fontFamily: "Georgia, serif",
  },
  subtitle: { fontSize: 14, color: "#7a83aa", margin: "0 0 24px 0" },
  roleToggle: {
    display: "flex",
    gap: 8,
    background: "#13162a",
    borderRadius: 12,
    padding: 5,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    padding: "9px 16px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    color: "#7a83aa",
    background: "transparent",
    fontFamily: "inherit",
  },
  roleActive: {
    flex: 1,
    padding: "9px 16px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    color: "#fff",
    background: "#6c63ff",
    fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(108,99,255,0.4)",
  },
  form: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 13, fontWeight: 500, color: "#7a83aa" },
  input: {
    background: "#13162a",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    color: "#f0f0ff",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputFocus: {
    background: "#181c35",
    border: "1px solid #6c63ff",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    color: "#f0f0ff",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "0 0 0 3px rgba(108,99,255,0.15)",
    fontFamily: "inherit",
  },
  passWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    padding: 0,
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(108,99,255,0.35)",
  },
  spinner: {
    display: "inline-block",
    width: 18, height: 18,
    border: "2px solid rgba(255,255,255,0.25)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  switchText: { textAlign: "center", fontSize: 13, color: "#7a83aa", margin: 0 },
  switchLink: { color: "#a78bfa", fontWeight: 600, cursor: "pointer", marginLeft: 4 },

  // Visual side
  visual: { flex: 1, position: "relative", overflow: "hidden", minHeight: "100vh" },
  bgImg: {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: "100%",
    objectFit: "cover", objectPosition: "center",
  },
  overlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(160deg, rgba(7,8,15,0.88) 0%, rgba(10,12,30,0.5) 40%, rgba(7,8,15,0.92) 100%)",
    zIndex: 1,
  },
  visualContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    zIndex: 2, padding: "60px 52px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(108,99,255,0.18)",
    border: "1px solid rgba(108,99,255,0.45)",
    borderRadius: 100,
    padding: "6px 18px",
    fontSize: 12, fontWeight: 600,
    color: "#a78bfa", marginBottom: 28,
  },
  headline: {
    fontFamily: "Georgia, serif",
    fontSize: 44, fontWeight: 700,
    lineHeight: 1.15, color: "#fff",
    margin: "0 0 18px 0", letterSpacing: "-1px",
  },
  headlineAccent: {
    background: "linear-gradient(90deg, #6c63ff, #f472b6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontStyle: "italic",
  },
  sub: { fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,0.55)", margin: "0 0 36px 0" },
  steps: { display: "flex", flexDirection: "column", gap: 14 },
  step: { display: "flex", alignItems: "center", gap: 16 },
  stepNum: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: "rgba(108,99,255,0.15)",
    border: "1px solid rgba(108,99,255,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 800, color: "#6c63ff",
  },
  stepText: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500, margin: 0 },
};