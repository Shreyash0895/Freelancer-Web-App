import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Profile() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const role  = localStorage.getItem("role")  || "";

  const [form, setForm] = useState({
    name: "", phone: "", skills: "", experience: "", bio: "",
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // ── Fetch profile from MongoDB on mount ──
  useEffect(() => {
    API.get("/profile")
      .then(r => {
        const u = r.data;
        setForm({
          name:       u.name       || "",
          phone:      u.phone      || "",
          skills:     u.skills     || "",
          experience: u.experience || "",
          bio:        u.bio        || "",
        });
      })
      .catch(() => showToast("error", "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put("/profile", form);
      showToast("success", "Profile saved!");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.name || email || "U").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div style={s.layout}>
        <Sidebar />
        <main style={s.main}>
          <div style={s.center}>
            <div style={s.spinner} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.inner}>

          {/* Header */}
          <div style={s.pageHeader}>
            <h1 style={s.pageTitle}>My Profile</h1>
            <p style={s.pageSub}>Your information is saved securely to your account</p>
          </div>

          <div style={s.grid}>
            {/* ── Avatar card ── */}
            <div style={s.avatarCard}>
              <div style={s.avatar}>{initials}</div>
              <h3 style={s.avatarName}>{form.name || "Your Name"}</h3>
              <p style={s.avatarEmail}>{email}</p>
              <span style={role === "client" ? s.badgeCyan : s.badgePurple}>
                {role}
              </span>
              {form.skills && (
                <div style={s.skillsWrap}>
                  {form.skills.split(",").map(sk => sk.trim()).filter(Boolean).map(sk => (
                    <span key={sk} style={s.skillTag}>{sk}</span>
                  ))}
                </div>
              )}
              {form.bio && <p style={s.bioPrev}>{form.bio}</p>}
            </div>

            {/* ── Edit form ── */}
            <div style={s.formCard}>
              <h2 style={s.formTitle}>Edit information</h2>
              <form onSubmit={save}>
                <div style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Full name</label>
                    <input
                      style={s.input}
                      value={form.name}
                      onChange={set("name")}
                      placeholder="John Doe"
                      onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                      onBlur={e => Object.assign(e.target.style, s.input)}
                    />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Phone</label>
                    <input
                      style={s.input}
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+91 98765 43210"
                      onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                      onBlur={e => Object.assign(e.target.style, s.input)}
                    />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Email (cannot change)</label>
                    <input style={{ ...s.input, opacity: 0.45, cursor: "not-allowed" }} value={email} disabled />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Role</label>
                    <input style={{ ...s.input, opacity: 0.45, cursor: "not-allowed", textTransform: "capitalize" }} value={role} disabled />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Skills <span style={s.hint}>(comma separated)</span></label>
                    <input
                      style={s.input}
                      value={form.skills}
                      onChange={set("skills")}
                      placeholder="React, Node.js, MongoDB"
                      onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                      onBlur={e => Object.assign(e.target.style, s.input)}
                    />
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Experience</label>
                    <input
                      style={s.input}
                      value={form.experience}
                      onChange={set("experience")}
                      placeholder="2 years"
                      onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                      onBlur={e => Object.assign(e.target.style, s.input)}
                    />
                  </div>
                </div>

                <div style={{ ...s.field, marginTop: 4 }}>
                  <label style={s.label}>Bio</label>
                  <textarea
                    style={s.textarea}
                    value={form.bio}
                    onChange={set("bio")}
                    placeholder="Tell clients a little about yourself..."
                    onFocus={e => Object.assign(e.target.style, { ...s.inputFocus, minHeight: "100px" })}
                    onBlur={e => Object.assign(e.target.style, { ...s.textarea })}
                  />
                </div>

                <div style={s.formFooter}>
                  <p style={s.savedNote}>✦ Profile is saved to your MongoDB account</p>
                  <button type="submit" disabled={saving} style={saving ? { ...s.saveBtn, opacity: 0.6 } : s.saveBtn}>
                    {saving ? <span style={s.spinner} /> : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  layout:    { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f" },
  main:      { flex: 1, overflowY: "auto", background: "radial-gradient(ellipse at 10% 10%, rgba(108,99,255,0.06) 0%, transparent 55%), #07080f" },
  inner:     { padding: "44px 52px", maxWidth: 1100 },
  center:    { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" },
  pageHeader:{ marginBottom: 36 },
  pageTitle: { fontSize: 34, fontWeight: 800, color: "#f0f0ff", margin: "0 0 8px", letterSpacing: "-1px", fontFamily: "Georgia, serif" },
  pageSub:   { fontSize: 15, color: "#7a83aa", margin: 0 },

  grid: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 28,
    alignItems: "start",
  },

  // Avatar card
  avatarCard: {
    background: "#0d0f1e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: "32px 24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 80, height: 80,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6c63ff, #f472b6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28, fontWeight: 800, color: "#fff",
    fontFamily: "Georgia, serif",
    marginBottom: 6,
  },
  avatarName:  { fontSize: 18, fontWeight: 700, color: "#f0f0ff", margin: 0 },
  avatarEmail: { fontSize: 13, color: "#7a83aa", margin: 0, wordBreak: "break-all" },
  badgePurple: { padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(129,140,248,0.15)", color: "#818cf8", textTransform: "capitalize" },
  badgeCyan:   { padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(34,211,238,0.12)", color: "#22d3ee", textTransform: "capitalize" },
  skillsWrap:  { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 },
  skillTag:    { padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(108,99,255,0.15)", color: "#a78bfa" },
  bioPrev:     { fontSize: 13, color: "#7a83aa", lineHeight: 1.6, margin: "4px 0 0", textAlign: "left" },

  // Form card
  formCard:  { background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "36px 36px" },
  formTitle: { fontSize: 20, fontWeight: 700, color: "#f0f0ff", margin: "0 0 28px", fontFamily: "Georgia, serif" },
  formGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 },
  field:     { display: "flex", flexDirection: "column", gap: 8 },
  label:     { fontSize: 13, fontWeight: 500, color: "#7a83aa" },
  hint:      { fontSize: 11, color: "#4a5280", fontWeight: 400 },
  input: {
    background: "#13162a", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11,
    padding: "12px 16px", fontSize: 14, color: "#f0f0ff", width: "100%",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  inputFocus: {
    background: "#181c35", border: "1px solid #6c63ff", borderRadius: 11,
    padding: "12px 16px", fontSize: 14, color: "#f0f0ff", width: "100%",
    outline: "none", boxSizing: "border-box", boxShadow: "0 0 0 3px rgba(108,99,255,0.15)", fontFamily: "inherit",
  },
  textarea: {
    background: "#13162a", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11,
    padding: "12px 16px", fontSize: 14, color: "#f0f0ff", width: "100%",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    minHeight: 100, resize: "vertical", lineHeight: 1.6,
  },
  formFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28, flexWrap: "wrap", gap: 12 },
  savedNote:  { fontSize: 13, color: "#4a5280" },
  saveBtn: {
    padding: "13px 28px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(108,99,255,0.35)",
  },
  spinner: {
    display: "inline-block", width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
};