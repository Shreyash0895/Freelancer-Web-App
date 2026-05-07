import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const email = localStorage.getItem("email") || "";
  const role  = localStorage.getItem("role")  || "";

  useEffect(() => {
    API.get("/projects")
      .then(r => setProjects(r.data))
      .catch(() => showToast("error", "Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const myProjects   = projects.filter(p => p.createdBy === email);
  const openProjects = projects.filter(p => !p.assigned);
  const totalBudget  = myProjects.reduce((s, p) => s + (Number(p.budget) || 0), 0);

  const stats = role === "client"
    ? [
        { label: "My projects",    value: myProjects.length,   color: "#6c63ff" },
        { label: "Open projects",  value: openProjects.length, color: "#22d3ee" },
        { label: "Total budget",   value: `$${totalBudget}`,   color: "#f472b6" },
      ]
    : [
        { label: "Open projects",  value: openProjects.length,  color: "#6c63ff" },
        { label: "Total listings", value: projects.length,       color: "#22d3ee" },
        { label: "Avg budget",     value: projects.length
            ? `$${Math.round(projects.reduce((s,p)=>s+(Number(p.budget)||0),0)/projects.length)}`
            : "$0",                                               color: "#34d399" },
      ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          {/* Header */}
          <div className="dash-topbar">
            <div>
              <h1 className="dash-greeting">
                Good {getGreeting()}, {email.split("@")[0]} 👋
              </h1>
              <p style={{ color: "var(--text2)", marginTop: 4, fontSize: 15 }}>
                Here's what's happening on FreelanceHub today.
              </p>
            </div>
            {role === "client" && (
              <button className="btn btn-primary" onClick={() => navigate("/projects")}>
                + Post project
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="dash-stats">
            {stats.map(s => (
              <div key={s.label} className="stat-card" style={{ "--accent-color": s.color }}>
                <div className="stat-card-num" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent projects */}
          <div className="dash-section-header">
            <h2>Recent projects</h2>
            <button className="btn btn-secondary" onClick={() => navigate("/projects")}>
              View all
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32 }} />
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◈</div>
              <h3>No projects yet</h3>
              <p>{role === "client" ? "Post your first project!" : "No projects available yet."}</p>
            </div>
          ) : (
            <div className="dash-project-grid">
              {projects.slice(0, 4).map(p => (
                <div key={p._id} className="dash-project-card">
                  <div className="dash-project-top">
                    <h3>{p.title}</h3>
                    <span className={`badge ${p.assigned ? "badge-green" : "badge-purple"}`}>
                      {p.assigned ? "Assigned" : "Open"}
                    </span>
                  </div>
                  <p className="dash-project-desc">{p.description}</p>
                  <div className="dash-project-footer">
                    <span className="dash-budget">${p.budget}</span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px", fontSize: 13 }}
                      onClick={() => navigate("/projects")}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style>{dashStyles}</style>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const dashStyles = `
.dash-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
  flex-wrap: wrap;
  gap: 16px;
}
.dash-greeting {
  font-family: 'Syne', sans-serif;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.8px;
}
.dash-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}
.stat-card {
  position: relative;
  overflow: hidden;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  transition: border-color 0.2s, transform 0.2s;
}
.stat-card:hover {
  border-color: var(--border2);
  transform: translateY(-2px);
}
.stat-card::after {
  content:'';
  position:absolute;
  top:-40px; right:-40px;
  width:130px; height:130px;
  border-radius:50%;
  background: var(--accent-color, var(--accent));
  opacity:0.06;
}
.stat-card-num {
  font-family:'Syne',sans-serif;
  font-size:42px;
  font-weight:800;
  letter-spacing:-2px;
  line-height:1;
  margin-bottom:8px;
}
.stat-card-label { font-size:13px; color:var(--text2); font-weight:500; }
.dash-section-header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:20px;
}
.dash-section-header h2 {
  font-family:'Syne',sans-serif;
  font-size:20px;
  font-weight:700;
}
.dash-project-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:20px;
}
.dash-project-card {
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:24px;
  transition:all 0.2s;
}
.dash-project-card:hover {
  border-color:var(--border2);
  transform:translateY(-2px);
}
.dash-project-top {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
}
.dash-project-top h3 {
  font-family:'Syne',sans-serif;
  font-size:16px;
  font-weight:700;
  line-height:1.3;
}
.dash-project-desc {
  font-size:13px;
  color:var(--text2);
  line-height:1.6;
  margin-bottom:18px;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.dash-project-footer {
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.dash-budget {
  font-family:'Syne',sans-serif;
  font-size:20px;
  font-weight:800;
  color:var(--green);
}
@media(max-width:700px){
  .dash-stats,.dash-project-grid { grid-template-columns:1fr; }
}
`;