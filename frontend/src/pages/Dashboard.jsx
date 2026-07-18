import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  const email = localStorage.getItem("email") || "";
  const role  = localStorage.getItem("role")  || "";

  useEffect(() => {
    API.get("/projects?limit=20")
      .then(r => {
        setProjects(r.data.projects || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(() => showToast("error", "Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const myProjects   = projects.filter(p => p.createdBy === email);
  const openProjects = projects.filter(p => !p.assigned);
  const totalBudget  = myProjects.reduce((s, p) => s + (Number(p.budget) || 0), 0);

  const stats = role === "client"
    ? [
        { label: "My Projects",   value: myProjects.length,   color: "#818cf8", bg: "rgba(129,140,248,0.08)", icon: "◈" },
        { label: "Open Projects", value: openProjects.length, color: "#22d3ee", bg: "rgba(34,211,238,0.08)",  icon: "◎" },
        { label: "Total Budget",  value: `$${totalBudget}`,   color: "#f472b6", bg: "rgba(244,114,182,0.08)", icon: "◇" },
      ]
    : [
        { label: "Open Projects",  value: openProjects.length, color: "#818cf8", bg: "rgba(129,140,248,0.08)", icon: "◈" },
        { label: "Total Listings", value: total,               color: "#22d3ee", bg: "rgba(34,211,238,0.08)",  icon: "◎" },
        { label: "Avg Budget",     value: projects.length
            ? `$${Math.round(projects.reduce((s,p) => s + (Number(p.budget)||0), 0) / projects.length)}`
            : "$0",                                             color: "#34d399", bg: "rgba(52,211,153,0.08)",  icon: "◇" },
      ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">

          {/* ── Top bar ── */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.greeting}>
                {greeting}, <span style={s.name}>{email.split("@")[0]}</span> 👋
              </h1>
              <p style={s.greetingSub}>
                Here's what's happening on FreelanceHub today.
              </p>
            </div>
            {role === "client" && (
              <button
                className="btn btn-primary"
                style={{ padding: "13px 26px", fontSize: 15 }}
                onClick={() => navigate("/projects")}
              >
                + Post Project
              </button>
            )}
          </div>

          {/* ── Stats ── */}
          <div style={s.statsGrid}>
            {stats.map(stat => (
              <div
                key={stat.label}
                className="stat-card"
                style={{ background: stat.bg, borderColor: `${stat.color}22` }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ ...s.statNum, color: stat.color }}>{stat.value}</div>
                    <div style={s.statLabel}>{stat.label}</div>
                  </div>
                  <div style={{ ...s.statIcon, color: stat.color, background: `${stat.color}18` }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick actions ── */}
          <div style={s.quickActions}>
            {[
              { label: "Browse Projects", icon: "◈", path: "/projects", color: "#6c63ff" },
              { label: "Messages",        icon: "◎", path: "/chat",     color: "#22d3ee" },
              { label: "Analytics",       icon: "▦", path: "/analytics",color: "#f472b6" },
              { label: "Invoices",        icon: "◻", path: "/invoice",  color: "#34d399" },
            ].map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                style={{ ...s.quickBtn, borderColor: `${a.color}22` }}
              >
                <span style={{ ...s.quickIcon, color: a.color, background: `${a.color}15` }}>
                  {a.icon}
                </span>
                <span style={s.quickLabel}>{a.label}</span>
                <span style={{ color: "var(--text3)", fontSize: 12 }}>→</span>
              </button>
            ))}
          </div>

          {/* ── Recent Projects ── */}
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Recent Projects</h2>
            <button
              className="btn btn-ghost"
              style={{ padding: "9px 18px", fontSize: 13 }}
              onClick={() => navigate("/projects")}
            >
              View all {total > 0 ? `(${total})` : ""} →
            </button>
          </div>

          {loading ? (
            <div style={s.skeletonGrid}>
              {[1,2,3,4].map(i => (
                <div key={i} style={s.skeletonCard}>
                  <div className="skeleton skeleton-title" style={{ width: "60%", marginBottom: 12 }} />
                  <div className="skeleton skeleton-text" style={{ width: "90%", marginBottom: 8 }} />
                  <div className="skeleton skeleton-text" style={{ width: "70%", marginBottom: 20 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
                    <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◈</div>
              <h3>No projects yet</h3>
              <p>
                {role === "client"
                  ? "Post your first project to get started."
                  : "No projects available right now. Check back soon!"}
              </p>
              {role === "client" && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 20, padding: "12px 28px" }}
                  onClick={() => navigate("/projects")}
                >
                  + Post a project
                </button>
              )}
            </div>
          ) : (
            <div style={s.projectGrid}>
              {projects.slice(0, 4).map(p => (
                <div
                  key={p._id}
                  className="project-card"
                  onClick={() => navigate("/projects")}
                >
                  <div style={s.projectTop}>
                    <h3 style={s.projectTitle}>{p.title}</h3>
                    <span className={`badge ${p.assigned ? "badge-green" : "badge-purple"}`}>
                      {p.assigned ? "Assigned" : "Open"}
                    </span>
                  </div>
                  <p style={s.projectDesc}>
                    {p.description || "No description provided."}
                  </p>
                  <div style={s.projectFooter}>
                    <span style={s.projectBudget}>${p.budget}</span>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "8px 16px", fontSize: 13 }}
                      onClick={e => { e.stopPropagation(); navigate("/projects"); }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  topbar:      { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 16 },
  greeting:    { fontSize: 32, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.8px", fontFamily: "'Syne', sans-serif" },
  name:        { background: "linear-gradient(135deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  greetingSub: { fontSize: 15, color: "var(--text2)", margin: 0 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 },
  statNum:   { fontSize: 40, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 8, fontFamily: "'Syne', sans-serif" },
  statLabel: { fontSize: 14, color: "var(--text2)", fontWeight: 500 },
  statIcon:  { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },

  quickActions: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 40 },
  quickBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 16px", borderRadius: 12,
    background: "var(--bg2)", border: "1px solid",
    cursor: "pointer", transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  quickIcon:  { width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  quickLabel: { fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1 },

  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  sectionTitle:  { fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0, fontFamily: "'Syne', sans-serif" },

  skeletonGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 },
  skeletonCard: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 },

  projectGrid:   { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 },
  projectTop:    { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  projectTitle:  { fontSize: 17, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.3, fontFamily: "'Syne', sans-serif" },
  projectDesc:   { fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: "0 0 20px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  projectFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  projectBudget: { fontSize: 24, fontWeight: 800, color: "var(--green)", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" },
};