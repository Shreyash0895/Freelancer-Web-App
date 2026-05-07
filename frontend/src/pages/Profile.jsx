import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { showToast } from "../utils/toast";

export default function Profile() {
  const email = localStorage.getItem("email") || "";
  const role  = localStorage.getItem("role")  || "";

  const [form, setForm] = useState({
    name:       localStorage.getItem("profile_name")       || email.split("@")[0] || "",
    phone:      localStorage.getItem("profile_phone")      || "",
    skills:     localStorage.getItem("profile_skills")     || "",
    experience: localStorage.getItem("profile_experience") || "",
    bio:        localStorage.getItem("profile_bio")        || "",
  });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("profile_name",       form.name);
      localStorage.setItem("profile_phone",      form.phone);
      localStorage.setItem("profile_skills",     form.skills);
      localStorage.setItem("profile_experience", form.experience);
      localStorage.setItem("profile_bio",        form.bio);
      showToast("success", "Profile saved!");
      setLoading(false);
    }, 600);
  };

  const initials = (form.name || email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, letterSpacing:"-0.8px" }}>
              My profile
            </h1>
            <p style={{ color:"var(--text2)", marginTop:4, fontSize:15 }}>
              Manage your account information
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:28, alignItems:"start" }}>
            {/* Avatar card */}
            <div className="card" style={{ textAlign:"center", padding:32 }}>
              <div className="prof-avatar">{initials}</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, marginBottom:4 }}>
                {form.name || "Your Name"}
              </h3>
              <p style={{ fontSize:13, color:"var(--text2)", marginBottom:12 }}>{email}</p>
              <span className={`badge ${role === "client" ? "badge-cyan" : "badge-purple"}`}
                    style={{ textTransform:"capitalize" }}>
                {role}
              </span>
              {form.bio && (
                <p style={{ fontSize:13, color:"var(--text2)", marginTop:16, lineHeight:1.6 }}>{form.bio}</p>
              )}
            </div>

            {/* Edit form */}
            <div className="card">
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:28 }}>
                Edit information
              </h2>
              <form onSubmit={save}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                  <div className="form-group">
                    <label className="form-label">Full name</label>
                    <input className="form-input" value={form.name} onChange={set("name")} placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={email} disabled style={{ opacity:0.5, cursor:"not-allowed" }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" value={role} disabled style={{ opacity:0.5, cursor:"not-allowed", textTransform:"capitalize" }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Skills</label>
                    <input className="form-input" value={form.skills} onChange={set("skills")} placeholder="React, Node.js, MongoDB" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience</label>
                    <input className="form-input" value={form.experience} onChange={set("experience")} placeholder="2 years" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom:28 }}>
                  <label className="form-label">Bio</label>
                  <textarea className="form-input" value={form.bio} onChange={set("bio")}
                    placeholder="Tell clients a little about yourself..." style={{ minHeight:90 }} />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" /> : "Save changes"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .prof-avatar {
          width:80px; height:80px;
          border-radius:50%;
          background:linear-gradient(135deg,var(--accent),var(--pink));
          display:flex; align-items:center; justify-content:center;
          font-family:'Syne',sans-serif;
          font-size:28px; font-weight:800;
          color:#fff;
          margin:0 auto 16px;
        }
        @media(max-width:760px){
          div[style*="grid-template-columns: 260px"] {
            grid-template-columns:1fr !important;
          }
        }
      `}</style>
    </div>
  );
}