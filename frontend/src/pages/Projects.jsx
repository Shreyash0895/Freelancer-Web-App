import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

const CATEGORIES = ["All", "Web Dev", "Mobile", "Design", "Writing", "Marketing", "Data", "Other"];

export default function Projects() {
  const [projects,     setProjects]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [filter,       setFilter]       = useState("all");   // all | open | assigned
  const [category,     setCategory]     = useState("All");
  const [showPost,     setShowPost]     = useState(false);
  const [showBid,      setShowBid]      = useState(false);
  const [showBids,     setShowBids]     = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bids,         setBids]         = useState([]);
  const [bidsLoading,  setBidsLoading]  = useState(false);

  const role  = localStorage.getItem("role")  || "";
  const email = localStorage.getItem("email") || "";

  // ── Debounced search ──
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Load projects ──
  const loadProjects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12 });
    if (search) params.set("search", search);
    if (filter === "open")     params.set("assigned", "false");
    if (filter === "assigned") params.set("assigned", "true");
    if (category !== "All")   params.set("category", category);

    API.get(`/projects?${params}`)
      .then(r => {
        setProjects(r.data.projects || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(() => showToast("error", "Failed to load projects"))
      .finally(() => setLoading(false));
  }, [page, search, filter, category]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const openBids = async (project) => {
    setSelectedProject(project);
    setShowBids(true);
    setBidsLoading(true);
    try {
      const res = await API.get(`/bids/${project._id}`);
      setBids(res.data || []);
    } catch { showToast("error", "Failed to load bids"); }
    finally   { setBidsLoading(false); }
  };

  const acceptBid = async (projectId, freelancerEmail) => {
    try {
      await API.post("/accept-bid", { projectId, freelancerEmail });
      showToast("success", "Bid accepted! Private chat is now open.");
      setShowBids(false);
      loadProjects();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to accept bid");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">

          {/* ── Header ── */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.pageTitle}>Projects</h1>
              <p style={s.pageSub}>{total} project{total !== 1 ? "s" : ""} available</p>
            </div>
            {role === "client" && (
              <button className="btn btn-primary" style={{ padding:"12px 24px" }}
                onClick={() => setShowPost(true)}>
                + Post Project
              </button>
            )}
          </div>

          {/* ── Filters ── */}
          <div style={s.filtersRow}>
            <input
              className="form-input"
              style={{ maxWidth: 280, height: 40 }}
              placeholder="🔍 Search projects..."
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setPage(1); }}
            />
            <div style={s.filterBtns}>
              {["all","open","assigned"].map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding:"8px 16px", fontSize:13, textTransform:"capitalize" }}>
                  {f === "all" ? "All" : f === "open" ? "Open" : "Assigned"}
                </button>
              ))}
            </div>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              style={{ ...s.select }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Project Grid ── */}
          {loading ? (
            <div style={s.grid}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={s.skeletonCard}>
                  <div className="skeleton" style={{ height:20, width:"70%", marginBottom:10, borderRadius:6 }} />
                  <div className="skeleton" style={{ height:14, width:"90%", marginBottom:6, borderRadius:4 }} />
                  <div className="skeleton" style={{ height:14, width:"60%", marginBottom:20, borderRadius:4 }} />
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div className="skeleton" style={{ height:28, width:70, borderRadius:6 }} />
                    <div className="skeleton" style={{ height:36, width:90, borderRadius:8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◈</div>
              <h3>No projects found</h3>
              <p>Try changing your search or filters.</p>
              {role === "client" && (
                <button className="btn btn-primary" style={{ marginTop:20 }}
                  onClick={() => setShowPost(true)}>
                  Post a project
                </button>
              )}
            </div>
          ) : (
            <div style={s.grid}>
              {projects.map(p => (
                <ProjectCard
                  key={p._id}
                  project={p}
                  role={role}
                  email={email}
                  onBid={() => { setSelectedProject(p); setShowBid(true); }}
                  onViewBids={() => openBids(p)}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {total > 12 && (
            <div style={s.pagination}>
              <button className="btn btn-ghost" style={{ padding:"8px 18px" }}
                disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ← Prev
              </button>
              <span style={{ color:"var(--text2)", fontSize:14 }}>
                Page {page} of {Math.ceil(total / 12)}
              </span>
              <button className="btn btn-ghost" style={{ padding:"8px 18px" }}
                disabled={page * 12 >= total} onClick={() => setPage(p => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {showPost && (
        <PostModal
          onClose={() => setShowPost(false)}
          onSuccess={() => { setShowPost(false); loadProjects(); }}
        />
      )}
      {showBid && selectedProject && (
        <BidModal
          project={selectedProject}
          onClose={() => setShowBid(false)}
          onSuccess={() => { setShowBid(false); loadProjects(); }}
        />
      )}
      {showBids && selectedProject && (
        <BidsModal
          project={selectedProject}
          bids={bids}
          loading={bidsLoading}
          email={email}
          onClose={() => setShowBids(false)}
          onAccept={acceptBid}
        />
      )}
    </div>
  );
}

// ── Project Card ──
function ProjectCard({ project: p, role, email, onBid, onViewBids }) {
  const isOwner      = p.createdBy === email;
  const isFreelancer = role === "freelancer";

  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <span className={`badge ${p.assigned ? "badge-green" : "badge-purple"}`}>
          {p.assigned ? "Assigned" : "Open"}
        </span>
        {p.category && p.category !== "General" && (
          <span className="badge badge-cyan" style={{ fontSize:11 }}>{p.category}</span>
        )}
      </div>

      <h3 style={s.cardTitle}>{p.title}</h3>
      <p style={s.cardDesc}>
        {p.description?.length > 100 ? p.description.slice(0, 100) + "..." : p.description}
      </p>

      <div style={s.cardMeta}>
        <span style={s.cardMetaItem}>👤 {p.createdBy?.split("@")[0]}</span>
        <span style={s.cardMetaItem}>📅 {new Date(p.createdAt).toLocaleDateString()}</span>
      </div>

      <div style={s.cardFooter}>
        <span style={s.cardBudget}>${p.budget}</span>
        <div style={{ display:"flex", gap:8 }}>
          {isOwner && (
            <button className="btn btn-secondary" style={{ padding:"8px 14px", fontSize:13 }}
              onClick={onViewBids}>
              View Bids
            </button>
          )}
          {isFreelancer && !p.assigned && !isOwner && (
            <button className="btn btn-primary" style={{ padding:"8px 14px", fontSize:13 }}
              onClick={onBid}>
              Bid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post Project Modal ──
function PostModal({ onClose, onSuccess }) {
  const [form,       setForm]       = useState({ title:"", description:"", budget:"", category:"Web Dev" });
  const [saving,     setSaving]     = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimate,   setEstimate]   = useState(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const getEstimate = async () => {
    if (!form.title || !form.description) {
      showToast("error", "Fill in title and description first");
      return;
    }
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await API.post("/ai/estimate-project", {
        title: form.title,
        description: form.description,
      });
      setEstimate(res.data);
    } catch (err) {
      showToast("error", err.response?.data?.message || "AI estimation failed. Check ANTHROPIC_API_KEY.");
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget) {
      showToast("error", "Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await API.post("/projects", form);
      showToast("success", "Project posted! Freelancers can now bid.");
      onSuccess();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to post project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={m.overlay}>
      <div style={{ ...m.modal, maxWidth:560 }}>
        <div style={m.header}>
          <h2 style={m.title}>Post a Project</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input className="form-input" value={form.title} onChange={set("title")}
                placeholder="e.g. Build a React dashboard" required />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-input" value={form.description} onChange={set("description")}
                placeholder="Describe what you need in detail..." rows={4} required
                style={{ resize:"vertical" }} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div className="form-group">
                <label className="form-label">Budget ($) *</label>
                <input className="form-input" type="number" value={form.budget} onChange={set("budget")}
                  placeholder="500" min="1" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={set("category")}
                  style={{ cursor:"pointer" }}>
                  {CATEGORIES.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Estimate Button */}
            <button
              type="button"
              onClick={getEstimate}
              disabled={estimating}
              style={s.aiBtn}
            >
              {estimating
                ? <><span className="spinner" style={{ width:14, height:14 }} /> Estimating...</>
                : "✨ Estimate with AI"
              }
            </button>

            {/* Estimate result */}
            {estimate && (
              <div style={s.estimateBox}>
                <p style={s.estimateTitle}>🤖 AI Estimation</p>
                <div style={s.estimateGrid}>
                  <div style={s.estimateItem}>
                    <span style={s.estimateLabel}>Timeline</span>
                    <span style={s.estimateValue}>{estimate.timeline}</span>
                  </div>
                  <div style={s.estimateItem}>
                    <span style={s.estimateLabel}>Budget Range</span>
                    <span style={s.estimateValue}>${estimate.budgetMin}–${estimate.budgetMax}</span>
                  </div>
                  <div style={s.estimateItem}>
                    <span style={s.estimateLabel}>Complexity</span>
                    <span style={{
                      ...s.estimateValue,
                      color: estimate.complexity === "Low" ? "var(--green)" : estimate.complexity === "High" ? "var(--red)" : "var(--amber)"
                    }}>{estimate.complexity}</span>
                  </div>
                </div>
                {estimate.tips && (
                  <ul style={{ margin:"10px 0 0", paddingLeft:18 }}>
                    {estimate.tips.map((t, i) => (
                      <li key={i} style={{ fontSize:13, color:"var(--text2)", marginBottom:4 }}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div style={{ display:"flex", gap:12, marginTop:24 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex:1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex:2 }}>
              {saving ? <span className="spinner" /> : "Post Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bid Modal ──
function BidModal({ project, onClose, onSuccess }) {
  const [amount,     setAmount]     = useState("");
  const [message,    setMessage]    = useState("");
  const [saving,     setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);  // ✅ properly declared

  const generateProposal = async () => {
    if (!amount) { showToast("error", "Enter your bid amount first"); return; }
    setGenerating(true);
    try {
      const skills = localStorage.getItem("skills") || "web development, software engineering";
      const res = await API.post("/ai/generate-proposal", {
        projectTitle:       project.title,
        projectDescription: project.description,
        budget:             project.budget,
        freelancerSkills:   skills,
      });
      setMessage(res.data.proposal);
      showToast("success", "Proposal generated! ✨");
    } catch (err) {
      showToast("error", err.response?.data?.message || "AI generation failed. Check ANTHROPIC_API_KEY.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) { showToast("error", "Enter your bid amount"); return; }
    setSaving(true);
    try {
      await API.post("/bid", { projectId: project._id, amount: Number(amount), message });
      showToast("success", "Bid submitted! The client will be notified.");
      onSuccess();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to submit bid");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={m.overlay}>
      <div style={m.modal}>
        <div style={m.header}>
          <h2 style={m.title}>Place a Bid</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        {/* Project info */}
        <div style={m.projectInfo}>
          <p style={{ fontSize:15, fontWeight:600, color:"var(--text)", margin:"0 0 4px" }}>
            {project.title}
          </p>
          <p style={{ fontSize:13, color:"var(--text3)", margin:0 }}>
            Client budget: <strong style={{ color:"var(--green)" }}>${project.budget}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div className="form-group">
              <label className="form-label">Your Bid Amount ($) *</label>
              <input
                className="form-input"
                type="number" min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter your price"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proposal / Message</label>
              <textarea
                className="form-input"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your approach, experience, and why you're the best fit..."
                rows={4}
                style={{ resize:"vertical" }}
              />
            </div>

            {/* AI Generate button */}
            <button
              type="button"
              onClick={generateProposal}
              disabled={generating}
              style={s.aiBtn}
            >
              {generating
                ? <><span className="spinner" style={{ width:14, height:14 }} /> Generating...</>
                : "✨ Generate with AI"
              }
            </button>
          </div>

          <div style={{ display:"flex", gap:12, marginTop:24 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex:1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex:2 }}>
              {saving ? <span className="spinner" /> : "Submit Bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View Bids Modal ──
function BidsModal({ project, bids, loading, email, onClose, onAccept }) {
  const isOwner = project.createdBy === email;

  return (
    <div style={m.overlay}>
      <div style={{ ...m.modal, maxWidth:540 }}>
        <div style={m.header}>
          <h2 style={m.title}>Bids for "{project.title}"</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding:"40px 0", textAlign:"center" }}>
            <div className="spinner" style={{ margin:"0 auto", width:28, height:28 }} />
          </div>
        ) : bids.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◇</div>
            <h3>No bids yet</h3>
            <p>Share your project link to attract freelancers.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:420, overflowY:"auto" }}>
            {bids.map(b => (
              <div key={b._id} style={s.bidCard}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <div style={s.bidAvatar}>
                        {(b.freelancerEmail||"?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize:14, fontWeight:600, color:"var(--text)", margin:0 }}>
                          {b.freelancerEmail?.split("@")[0]}
                        </p>
                        <p style={{ fontSize:11, color:"var(--text3)", margin:0 }}>
                          {new Date(b.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {b.message && (
                      <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6, margin:0 }}>
                        {b.message}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ fontSize:20, fontWeight:800, color:"var(--green)", margin:"0 0 8px", fontFamily:"'Syne',sans-serif" }}>
                      ${b.amount}
                    </p>
                    {isOwner && !project.assigned && (
                      <button
                        className="btn btn-primary"
                        style={{ padding:"8px 16px", fontSize:13 }}
                        onClick={() => onAccept(project._id, b.freelancerEmail)}
                      >
                        Accept
                      </button>
                    )}
                    {project.assigned && project.assignedFreelancer === b.freelancerEmail && (
                      <span className="badge badge-green">✓ Hired</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="btn btn-ghost" style={{ width:"100%", marginTop:16 }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
//  STYLES
// ══════════════════════════════════════
const s = {
  topbar:    { display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:16 },
  pageTitle: { fontSize:30, fontWeight:800, color:"var(--text)", margin:"0 0 6px", letterSpacing:"-0.8px", fontFamily:"'Syne',sans-serif" },
  pageSub:   { fontSize:14, color:"var(--text2)", margin:0 },

  filtersRow:{ display:"flex", alignItems:"center", gap:12, marginBottom:28, flexWrap:"wrap" },
  filterBtns:{ display:"flex", gap:6 },
  select:    { background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:10, padding:"8px 14px", color:"var(--text)", fontSize:14, cursor:"pointer", outline:"none", fontFamily:"inherit", height:40 },

  grid:        { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:20, marginBottom:32 },
  skeletonCard:{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:14, padding:24 },

  card:      { background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:14, padding:22, transition:"all 0.2s", cursor:"default" },
  cardTop:   { display:"flex", gap:8, marginBottom:12 },
  cardTitle: { fontSize:17, fontWeight:700, color:"var(--text)", margin:"0 0 8px", lineHeight:1.3, fontFamily:"'Syne',sans-serif" },
  cardDesc:  { fontSize:13, color:"var(--text2)", lineHeight:1.65, margin:"0 0 14px" },
  cardMeta:  { display:"flex", gap:14, marginBottom:16 },
  cardMetaItem:{ fontSize:12, color:"var(--text3)" },
  cardFooter:{ display:"flex", alignItems:"center", justifyContent:"space-between" },
  cardBudget:{ fontSize:22, fontWeight:800, color:"var(--green)", fontFamily:"'Syne',sans-serif" },

  aiBtn: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"10px 18px", borderRadius:10,
    background:"linear-gradient(135deg,rgba(108,99,255,0.15),rgba(167,139,250,0.15))",
    border:"1px solid rgba(108,99,255,0.35)",
    color:"var(--accent2)", fontSize:13, fontWeight:600,
    cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
  },

  estimateBox: {
    background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)",
    borderRadius:12, padding:"16px 18px",
  },
  estimateTitle:{ fontSize:13, fontWeight:700, color:"var(--green)", margin:"0 0 12px" },
  estimateGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 },
  estimateItem: { display:"flex", flexDirection:"column", gap:4 },
  estimateLabel:{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.4px" },
  estimateValue:{ fontSize:15, fontWeight:700, color:"var(--text)" },

  bidCard:  { background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12, padding:16 },
  bidAvatar:{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#6c63ff,#f472b6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0 },

  pagination:{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginTop:8 },
};

const m = {
  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn 0.2s" },
  modal:       { background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:20, padding:"32px", width:"100%", maxWidth:480, boxShadow:"0 32px 80px rgba(0,0,0,0.7)", maxHeight:"90vh", overflowY:"auto", animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" },
  header:      { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 },
  title:       { fontSize:20, fontWeight:800, color:"var(--text)", margin:0, fontFamily:"'Syne',sans-serif" },
  closeBtn:    { background:"rgba(255,255,255,0.06)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text3)", fontSize:16, cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" },
  projectInfo: { background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:20 },
};