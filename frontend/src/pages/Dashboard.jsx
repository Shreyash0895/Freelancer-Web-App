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
    // Fetch first page — dashboard only needs recent projects
    API.get("/projects?limit=20")
      .then(r => {
        setProjects(r.data.projects);
        setTotal(r.data.pagination.total);
      })
      .catch(() => showToast("error", "Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const myProjects   = projects.filter(p => p.createdBy === email);
  const openProjects = projects.filter(p => !p.assigned);
  const totalBudget  = myProjects.reduce((s, p) => s + (Number(p.budget) || 0), 0);

  const stats = role === "client"
    ? [
        { label: "My Projects",   value: myProjects.length,   color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
        { label: "Open Projects", value: openProjects.length, color: "#22d3ee", bg: "rgba(34,211,238,0.1)"  },
        { label: "Total Budget",  value: `$${totalBudget}`,   color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
      ]
    : [
        { label: "Open Projects",  value: openProjects.length, color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
        { label: "Total Listings", value: total,               color: "#22d3ee", bg: "rgba(34,211,238,0.1)"  },
        { label: "Avg Budget",     value: projects.length
            ? `$${Math.round(projects.reduce((s,p)=>s+(Number(p.budget)||0),0)/projects.length)}`
            : "$0",                                             color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
      ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.inner}>

          {/* ── Top bar ── */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.greeting}>
                {greeting}, {email.split("@")[0]} 👋
              </h1>
              <p style={s.greetingSub}>
                Here's what's happening on FreelanceHub today.
              </p>
            </div>
            {role === "client" && (
              <button style={s.postBtn} onClick={() => navigate("/projects")}>
                + Post Project
              </button>
            )}
          </div>

          {/* ── Stats ── */}
          <div style={s.statsGrid}>
            {stats.map(stat => (
              <div key={stat.label} style={{ ...s.statCard, background: stat.bg, border: `1px solid ${stat.color}22` }}>
                <div style={{ ...s.statNum, color: stat.color }}>{stat.value}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Recent Projects ── */}
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Recent Projects</h2>
            <button style={s.viewAllBtn} onClick={() => navigate("/projects")}>
              View all {total > 0 ? `(${total})` : ""} →
            </button>
          </div>

          {loading ? (
            <div style={s.center}><div style={s.spinner} /></div>
          ) : projects.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>◈</div>
              <h3 style={s.emptyTitle}>No projects yet</h3>
              <p style={s.emptySub}>
                {role === "client" ? "Post your first project to get started." : "No projects available right now."}
              </p>
              {role === "client" && (
                <button style={s.postBtn} onClick={() => navigate("/projects")}>
                  + Post a project
                </button>
              )}
            </div>
          ) : (
            <div style={s.projectGrid}>
              {projects.slice(0, 4).map(p => (
                <div
                  key={p._id}
                  style={s.projectCard}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(129,140,248,0.4)";
                    e.currentTarget.style.transform   = "translateY(-3px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.transform   = "none";
                  }}
                >
                  <div style={s.projectTop}>
                    <h3 style={s.projectTitle}>{p.title}</h3>
                    <span style={p.assigned ? s.badgeGreen : s.badgePurple}>
                      {p.assigned ? "Assigned" : "Open"}
                    </span>
                  </div>
                  <p style={s.projectDesc}>{p.description || "No description."}</p>
                  <div style={s.projectFooter}>
                    <span style={s.projectBudget}>${p.budget}</span>
                    <button style={s.viewBtn} onClick={() => navigate("/projects")}>
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
  layout:      { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f" },
  main:        { flex: 1, overflowY: "auto", background: "radial-gradient(ellipse at 10% 10%, rgba(108,99,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%), #07080f" },
  inner:       { padding: "44px 52px", maxWidth: 1100 },
  topbar:      { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 44, flexWrap: "wrap", gap: 16 },
  greeting:    { fontSize: 38, fontWeight: 800, color: "#f0f0ff", margin: "0 0 10px", letterSpacing: "-1px", fontFamily: "Georgia, serif" },
  greetingSub: { fontSize: 17, color: "#7a83aa", margin: 0 },
  postBtn:     { padding: "13px 26px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(108,99,255,0.35)", fontFamily: "inherit" },
  statsGrid:   { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 50 },
  statCard:    { borderRadius: 18, padding: "32px 32px", transition: "transform 0.2s" },
  statNum:     { fontSize: 52, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, marginBottom: 10, fontFamily: "Georgia, serif" },
  statLabel:   { fontSize: 16, color: "#9098c0", fontWeight: 500 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  sectionTitle:  { fontSize: 26, fontWeight: 700, color: "#f0f0ff", margin: 0, fontFamily: "Georgia, serif" },
  viewAllBtn:    { padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#9098c0", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  projectGrid:   { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 22 },
  projectCard:   { background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px", transition: "border-color 0.2s, transform 0.2s" },
  projectTop:    { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  projectTitle:  { fontSize: 19, fontWeight: 700, color: "#f0f0ff", margin: 0, lineHeight: 1.3, fontFamily: "Georgia, serif" },
  badgePurple:   { padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(129,140,248,0.15)", color: "#818cf8", flexShrink: 0 },
  badgeGreen:    { padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(52,211,153,0.15)", color: "#34d399", flexShrink: 0 },
  projectDesc:   { fontSize: 14, color: "#7a83aa", lineHeight: 1.65, margin: "0 0 22px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  projectFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  projectBudget: { fontSize: 26, fontWeight: 800, color: "#34d399", fontFamily: "Georgia, serif", letterSpacing: "-0.5px" },
  viewBtn:       { padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.08)", color: "#818cf8", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  center:        { display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" },
  spinner:       { width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  emptyState:    { textAlign: "center", padding: "70px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  emptyIcon:     { fontSize: 56, color: "#3a3f6a" },
  emptyTitle:    { fontSize: 22, fontWeight: 700, color: "#7a83aa", margin: 0 },
  emptySub:      { fontSize: 16, color: "#4a5280", margin: 0 },
};