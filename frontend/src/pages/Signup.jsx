import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { showToast } from "../utils/toast";
import "./auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const [role,    setRole]    = useState("freelancer");
  const [show,    setShow]    = useState(false);
  const [show2,   setShow2]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirm: "" });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignup = async (e) => {
    e?.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showToast("error", "Please fill in all fields"); return;
    }
    if (form.password !== form.confirm) {
      showToast("error", "Passwords do not match"); return;
    }
    if (form.password.length < 6) {
      showToast("error", "Password must be at least 6 characters"); return;
    }
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
    <div className="auth-page auth-page--flip">
      {/* ── Left: form ── */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-logo">Freelance<span>Hub</span></div>

          <h1 className="auth-form-title">Create account</h1>
          <p className="auth-form-sub">Join thousands of clients and freelancers</p>

          {/* Role toggle */}
          <div className="auth-role-toggle">
            <button
              type="button"
              className={role === "freelancer" ? "active" : ""}
              onClick={() => setRole("freelancer")}
            >
              🎨 Freelancer
            </button>
            <button
              type="button"
              className={role === "client" ? "active" : ""}
              onClick={() => setRole("client")}
            >
              💼 Client
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-field">
              <label>Full name</label>
              <input placeholder="John Doe" onChange={set("name")} autoComplete="name" />
            </div>

            <div className="auth-field">
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" onChange={set("email")} autoComplete="email" />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-pass-wrap">
                <input
                  type={show ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  onChange={set("password")}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-eye" onClick={() => setShow(!show)}>
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirm password</label>
              <div className="auth-pass-wrap">
                <input
                  type={show2 ? "text" : "password"}
                  placeholder="Repeat password"
                  onChange={set("confirm")}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-eye" onClick={() => setShow2(!show2)}>
                  {show2 ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }}>
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* ── Right: background art ── */}
      <div className="auth-visual">
        <div className="auth-visual-overlay" />
        <img
          className="auth-bg-img"
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&q=85&auto=format"
          alt="Freelancer working"
        />
        <div className="auth-visual-content">
          <div className="auth-badge">No commission until you earn</div>
          <h2 className="auth-visual-headline">
            Your skills.<br />Your schedule.<br /><em>Your income.</em>
          </h2>
          <p className="auth-visual-sub">
            Whether you're hiring or looking for work — FreelanceHub connects the right people.
          </p>
          <div className="auth-steps">
            <div className="auth-step"><span>01</span><p>Create your profile</p></div>
            <div className="auth-step"><span>02</span><p>Post or browse projects</p></div>
            <div className="auth-step"><span>03</span><p>Get paid securely</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}