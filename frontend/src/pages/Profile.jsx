import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Profile() {
  const email = localStorage.getItem("email") || "";
  const role  = localStorage.getItem("role")  || "";

  const [form, setForm] = useState({ name:"", phone:"", skills:"", experience:"", bio:"" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

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
      showToast("error", err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const initials  = (form.name || email || "U").slice(0, 2).toUpperCase();
  const skillList = form.skills.split(",").map(s => s.trim()).filter(Boolean);

  const avatarColors = [
    "linear-gradient(135deg, #6c63ff, #f472b6)",
    "linear-gradient(135deg, #22d3ee, #6c63ff)",
    "linear-gradient(135deg, #34d399, #22d3ee)",
    "linear-gradient(135deg, #f472b6, #fbbf24)",
  ];
  const avatarColor = avatarColors[(email.charCodeAt(0) || 0) % avatarColors.length];

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
            <div className="spinner" style={{ width:36, height:36, borderWidth:3 }} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">

          <div className="page-header">
            <h1>My Profile</h1>
            <p>Your information is saved securely to your account</p>
          </div>

          <div style={s.grid}>
            {/* ── Avatar card ── */}
            <div style={s.avatarCard}>
              <div style={{ ...s.avatar, background: avatarColor }}>{initials}</div>
              <h3 style={s.avatarName}>{form.name || "Your Name"}</h3>
              <p style={s.avatarEmail}>{email}</p>
              <span className={`badge ${role === "client" ? "badge-cyan" : "badge-purple"}`}
                style={{ marginTop: 4, textTransform: "capitalize" }}>
                {role}
              </span>

              {skillList.length > 0 && (
                <div style={s.skillsWrap}>
                  {skillList.map(sk => (
                    <span key={sk} style={s.skillTag}>{sk}</span>
                  ))}
                </div>
              )}

              {form.experience && (
                <div style={s.expBadge}>
                  🎯 {form.experience} experience
                </div>
              )}

              {form.bio && (
                <p style={s.bioPrev}>{form.bio}</p>
              )}

              {/* Stats row */}
              <div style={s.miniStats}>
                <div style={s.miniStat}>
                  <div style={s.miniStatNum}>{skillList.length}</div>
                  <div style={s.miniStatLabel}>Skills</div>
                </div>
                <div style={s.miniStatDivider} />
                <div style={s.miniStat}>
                  <div style={s.miniStatNum}>{role === "client" ? "C" : "F"}</div>
                  <div style={s.miniStatLabel}>Role</div>
                </div>
              </div>
            </div>

            {/* ── Edit form ── */}
            <div style={s.formCard}>
              <h2 style={s.formTitle}>Edit Information</h2>
              <form onSubmit={save}>
                <div style={s.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Full name</label>
                    <input
                      className="form-input"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email (cannot change)</label>
                    <input
                      className="form-input"
                      value={email}
                      disabled
                      style={{ opacity: 0.45, cursor: "not-allowed" }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience</label>
                    <input
                      className="form-input"
                      value={form.experience}
                      onChange={set("experience")}
                      placeholder="2 years"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">
                      Skills <span style={{ color:"var(--text3)", fontWeight:400 }}>(comma separated)</span>
                    </label>
                    <input
                      className="form-input"
                      value={form.skills}
                      onChange={set("skills")}
                      placeholder="React, Node.js, MongoDB"
                    />
                    {skillList.length > 0 && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                        {skillList.map(sk => (
                          <span key={sk} style={s.skillPreview}>{sk}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 4 }}>
                  <label className="form-label">Bio</label>
                  <textarea
                    className="form-input"
                    value={form.bio}
                    onChange={set("bio")}
                    placeholder="Tell clients a little about yourself..."
                    rows={4}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div style={s.formFooter}>
                  <p style={{ fontSize:12, color:"var(--text3)" }}>
                    ✦ Saved to your MongoDB account
                  </p>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ padding:"12px 28px" }}
                  >
                    {saving ? <span className="spinner" /> : "Save changes"}
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
  grid: { display:"grid", gridTemplateColumns:"260px 1fr", gap:24, alignItems:"start" },

  avatarCard: {
    background:"var(--bg2)", border:"1px solid var(--border)",
    borderRadius:18, padding:"32px 24px",
    textAlign:"center", display:"flex",
    flexDirection:"column", alignItems:"center", gap:10,
  },
  avatar: {
    width:80, height:80, borderRadius:"50%",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:28, fontWeight:800, color:"#fff",
    fontFamily:"'Syne', sans-serif", marginBottom:4,
    boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
  },
  avatarName:  { fontSize:18, fontWeight:700, color:"var(--text)", margin:0, fontFamily:"'Syne', sans-serif" },
  avatarEmail: { fontSize:12, color:"var(--text3)", margin:0, wordBreak:"break-all" },
  skillsWrap:  { display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center", marginTop:4 },
  skillTag:    { padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:"rgba(108,99,255,0.15)", color:"#a78bfa" },
  expBadge:    { fontSize:12, color:"var(--text2)", background:"var(--bg3)", padding:"6px 12px", borderRadius:20, border:"1px solid var(--border)" },
  bioPrev:     { fontSize:12, color:"var(--text3)", lineHeight:1.6, margin:"4px 0 0", textAlign:"left" },

  miniStats:       { display:"flex", alignItems:"center", gap:16, marginTop:4, padding:"12px 0 0", borderTop:"1px solid var(--border)", width:"100%" },
  miniStat:        { flex:1, textAlign:"center" },
  miniStatNum:     { fontSize:20, fontWeight:800, color:"var(--text)", fontFamily:"'Syne', sans-serif" },
  miniStatLabel:   { fontSize:11, color:"var(--text3)", marginTop:2 },
  miniStatDivider: { width:1, height:32, background:"var(--border)" },

  formCard:  { background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:18, padding:"32px 32px" },
  formTitle: { fontSize:20, fontWeight:700, color:"var(--text)", margin:"0 0 24px", fontFamily:"'Syne', sans-serif" },
  formGrid:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 },
  formFooter:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:24, flexWrap:"wrap", gap:12 },
  skillPreview: { padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:"rgba(108,99,255,0.12)", color:"#a78bfa", border:"1px solid rgba(108,99,255,0.2)" },
};