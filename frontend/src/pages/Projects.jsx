import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Projects() {
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showPost,    setShowPost]    = useState(false);
  const [activeBids,  setActiveBids]  = useState(null); // project for bid modal
  const [showBidForm, setShowBidForm] = useState(null); // project for bid submission

  const email = localStorage.getItem("email") || "";
  const role  = localStorage.getItem("role")  || "";

  const fetchProjects = () => {
    setLoading(true);
    API.get("/projects")
      .then(r => setProjects(r.data))
      .catch(() => showToast("error", "Failed to load projects"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32, flexWrap:"wrap", gap:16 }}>
            <div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, letterSpacing:"-0.8px" }}>
                Projects
              </h1>
              <p style={{ color:"var(--text2)", marginTop:4, fontSize:15 }}>
                {role === "client" ? "Manage your posted projects" : "Browse and bid on projects"}
              </p>
            </div>
            {role === "client" && (
              <button className="btn btn-primary" onClick={() => setShowPost(true)}>
                + Post project
              </button>
            )}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin:"0 auto", width:32, height:32 }} />
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◈</div>
              <h3>No projects yet</h3>
              <p>{role === "client" ? "Post your first project to get started." : "No projects available right now."}</p>
            </div>
          ) : (
            <div className="proj-grid">
              {projects.map(p => (
                <ProjectCard
                  key={p._id}
                  project={p}
                  email={email}
                  role={role}
                  onViewBids={() => setActiveBids(p)}
                  onBid={() => setShowBidForm(p)}
                  onRefresh={fetchProjects}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showPost && (
        <PostProjectModal
          onClose={() => setShowPost(false)}
          onSuccess={() => { setShowPost(false); fetchProjects(); }}
        />
      )}

      {activeBids && (
        <BidsModal
          project={activeBids}
          onClose={() => setActiveBids(null)}
          onRefresh={fetchProjects}
          isOwner={activeBids.createdBy === email}
        />
      )}

      {showBidForm && (
        <BidFormModal
          project={showBidForm}
          onClose={() => setShowBidForm(null)}
          onSuccess={() => { setShowBidForm(null); showToast("success", "Bid submitted!"); }}
        />
      )}
    </div>
  );
}

/* ─── Project Card ─── */
function ProjectCard({ project: p, email, role, onViewBids, onBid, onRefresh }) {
  const isOwner = p.createdBy === email;

  return (
    <div className="proj-card">
      <div className="proj-card-top">
        <div style={{ flex:1 }}>
          <h3 className="proj-title">{p.title}</h3>
          <p className="proj-by">by {p.createdBy}</p>
        </div>
        <span className={`badge ${p.assigned ? "badge-green" : "badge-purple"}`}>
          {p.assigned ? "Assigned" : "Open"}
        </span>
      </div>

      <p className="proj-desc">{p.description}</p>

      <div className="proj-budget">
        <span className="proj-budget-num">${p.budget}</span>
        <span style={{ color:"var(--text3)", fontSize:13 }}>budget</span>
      </div>

      <div className="proj-actions">
        <button className="btn btn-secondary" onClick={onViewBids} style={{ flex:1 }}>
          View bids
        </button>
        {role === "freelancer" && !p.assigned && (
          <button className="btn btn-primary" onClick={onBid} style={{ flex:1 }}>
            Place bid
          </button>
        )}
        {isOwner && (
          <button className="btn btn-secondary" onClick={onViewBids} style={{ flex:1, color:"var(--accent2)" }}>
            Manage
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Post Project Modal ─── */
function PostProjectModal({ onClose, onSuccess }) {
  const [data,    setData]    = useState({ title:"", description:"", budget:"" });
  const [loading, setLoading] = useState(false);

  const set = k => e => setData(d => ({ ...d, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!data.title || !data.description || !data.budget) {
      showToast("error", "Please fill in all fields"); return;
    }
    setLoading(true);
    try {
      await API.post("/projects", data);
      showToast("success", "Project posted!");
      onSuccess();
    } catch {
      showToast("error", "Failed to post project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <h2>Post a project</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div className="form-group">
            <label className="form-label">Project title</label>
            <input className="form-input" placeholder="e.g. Build a React dashboard" onChange={set("title")} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="Describe what you need..." onChange={set("description")} />
          </div>
          <div className="form-group">
            <label className="form-label">Budget (USD)</label>
            <input className="form-input" type="number" placeholder="e.g. 500" onChange={set("budget")} />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
            <button type="submit"  className="btn btn-primary"  disabled={loading} style={{ flex:1 }}>
              {loading ? <span className="spinner" /> : "Post project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Bid Form Modal ─── */
function BidFormModal({ project, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!amount) { showToast("error", "Enter your bid amount"); return; }
    setLoading(true);
    try {
      await API.post("/bid", { projectId: project._id, amount, message });
      onSuccess();
    } catch {
      showToast("error", "Failed to submit bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <h2>Place a bid</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ color:"var(--text2)", fontSize:14, marginBottom:24 }}>
          {project.title} · Client budget: <strong style={{ color:"var(--green)" }}>${project.budget}</strong>
        </p>
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div className="form-group">
            <label className="form-label">Your bid (USD)</label>
            <input className="form-input" type="number" placeholder="e.g. 450" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cover message</label>
            <textarea className="form-input" placeholder="Why are you the best fit for this project?" value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
            <button type="submit"  className="btn btn-primary"  disabled={loading} style={{ flex:1 }}>
              {loading ? <span className="spinner" /> : "Submit bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Bids List Modal ─── */
function BidsModal({ project, onClose, onRefresh, isOwner }) {
  const [bids,    setBids]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/bids/${project._id}`)
      .then(r => setBids(r.data))
      .catch(() => showToast("error", "Failed to load bids"))
      .finally(() => setLoading(false));
  }, [project._id]);

  const acceptBid = async (bid) => {
    try {
      await API.post("/accept-bid", { projectId: project._id, freelancerEmail: bid.freelancerEmail });
      showToast("success", `Accepted bid from ${bid.freelancerEmail}`);
      onRefresh();
      onClose();
    } catch {
      showToast("error", "Failed to accept bid");
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:560 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <h2>Bids</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ color:"var(--text2)", fontSize:14, marginBottom:24 }}>{project.title}</p>

        {loading ? (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <div className="spinner" style={{ margin:"0 auto", width:28, height:28 }} />
          </div>
        ) : bids.length === 0 ? (
          <div className="empty-state" style={{ padding:"30px 0" }}>
            <div className="empty-state-icon" style={{ fontSize:32 }}>◎</div>
            <h3>No bids yet</h3>
            <p>Bids placed on this project will appear here.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14, maxHeight:400, overflowY:"auto" }}>
            {bids.map((b, i) => (
              <div key={i} className="bid-row">
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{b.freelancerEmail}</div>
                  {b.message && <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5 }}>{b.message}</p>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"var(--green)" }}>
                    ${b.amount}
                  </span>
                  {isOwner && !project.assigned && (
                    <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:12 }} onClick={() => acceptBid(b)}>
                      Accept
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}