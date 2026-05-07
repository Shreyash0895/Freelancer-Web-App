import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { showToast } from "../utils/toast";
import "./auth.css";

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
    <div className="auth-page">
      {/* ── Left: background art ── */}
      <div className="auth-visual">
        <div className="auth-visual-overlay" />
        <img
          className="auth-bg-img"
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&q=85&auto=format"
          alt="Team working"
        />
        <div className="auth-visual-content">
          <div className="auth-badge">Trusted by 50 000+ professionals</div>
          <h2 className="auth-visual-headline">
            The marketplace<br />built for<br /><em>real work.</em>
          </h2>
          <p className="auth-visual-sub">
            Post projects, find elite freelancers, and close deals — all in one place.
          </p>
          <div className="auth-visual-stats">
            <div><strong>12K+</strong><span>Active projects</span></div>
            <div><strong>98%</strong><span>Client satisfaction</span></div>
            <div><strong>4.9★</strong><span>Average rating</span></div>
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-logo">Freelance<span>Hub</span></div>

          <h1 className="auth-form-title">Welcome back</h1>
          <p className="auth-form-sub">Sign in to your account to continue</p>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-pass-wrap">
                <input
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-eye" onClick={() => setShow(!show)}>
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <a href="/signup" onClick={e => { e.preventDefault(); navigate("/signup"); }}>
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}