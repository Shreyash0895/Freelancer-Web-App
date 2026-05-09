import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Projects() {
  const [projects,    setProjects]    = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0, hasNext: false, hasPrev: false });
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all"); // all | open | assigned
  const [page,        setPage]        = useState(1);
  const [showPost,    setShowPost]    = useState(false);
  const [activeBids,  setActiveBids]  = useState(null);
  const [showBidForm, setShowBidForm] = useState(null);

  const email = localStorage.getItem("email") || "";
  const role  = localStorage.getItem("role")  || "";

  // ── Fetch with search + filter + pagination ──
  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 9 });
    if (search) params.set("search", search);
    if (filter === "open")     params.set("assigned", "false");
    if (filter === "assigned") params.set("assigned", "true");

    API.get(`/projects?${params}`)
      .then(r => {
        setProjects(r.data.projects);
        setPagination(r.data.pagination);
      })
      .catch(() => showToast("error", "Failed to load projects"))
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Reset to page 1 when search/filter changes
  useEffect(() => { setPage(1); }, [search, filter]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.inner}>

          {/* ── Header ── */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.title}>Projects</h1>
              <p style={s.subtitle}>
                {pagination.total} project{pagination.total !== 1 ? "s" : ""} found
              </p>
            </div>
            {role === "client" && (
              <button style={s.postBtn} onClick={() => setShowPost(true)}>
                + Post project
              </button>
            )}
          </div>

          {/* ── Search + Filter bar ── */}
          <div style={s.toolbar}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.searchInput}
                placeholder="Search projects by title or description..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onFocus={e => Object.assign(e.target.style, s.searchInputFocus)}
                onBlur={e => Object.assign(e.target.style, s.searchInput)}
              />
              {searchInput && (
                <button style={s.clearBtn} onClick={() => setSearchInput("")}>✕</button>
              )}
            </div>
            <div style={s.filters}>
              {["all", "open", "assigned"].map(f => (
                <button
                  key={f}
                  style={filter === f ? s.filterActive : s.filterBtn}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "open" ? "Open" : "Assigned"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Project Grid ── */}
          {loading ? (
            <div style={s.center}>
              <div style={s.spinner} />
            </div>
          ) : projects.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
              <h3 style={s.emptyTitle}>No projects found</h3>
              <p style={s.emptySub}>
                {search ? `No results for "${search}"` : role === "client" ? "Post your first project!" : "No projects available right now."}
              </p>
              {search && (
                <button style={s.clearSearchBtn} onClick={() => setSearchInput("")}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div style={s.grid}>
              {projects.map(p => (
                <ProjectCard
                  key={p._id}
                  project={p}
                  email={email}
                  role={role}
                  onViewBids={() => setActiveBids(p)}
                  onBid={() => setShowBidForm(p)}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && pagination.pages > 1 && (
            <div style={s.paginationBar}>
              <button
                style={pagination.hasPrev ? s.pageBtn : { ...s.pageBtn, opacity: 0.35, cursor: "not-allowed" }}
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>

              <div style={s.pageNumbers}>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    style={n === page ? s.pageNumActive : s.pageNum}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                style={pagination.hasNext ? s.pageBtn : { ...s.pageBtn, opacity: 0.35, cursor: "not-allowed" }}
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ── Modals ── */}
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
          onSuccess={() => { setShowBidForm(null); fetchProjects(); showToast("success", "Bid submitted!"); }}
        />
      )}
    </div>
  );
}

/* ─── Project Card ─── */
function ProjectCard({ project: p, email, role, onViewBids, onBid }) {
  const isOwner = p.createdBy === email;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.cardTop}>
        <h3 style={s.cardTitle}>{p.title}</h3>
        <span style={p.assigned ? s.badgeGreen : s.badgePurple}>
          {p.assigned ? "Assigned" : "Open"}
        </span>
      </div>

      <p style={s.cardDesc}>{p.description || "No description provided."}</p>

      <div style={s.cardMeta}>
        <span style={s.cardBy}>by {p.createdBy?.split("@")[0]}</span>
        <span style={s.cardBudget}>${p.budget}</span>
      </div>

      <div style={s.cardActions}>
        <button style={s.viewBidsBtn} onClick={onViewBids}>
          View bids
        </button>
        {role === "freelancer" && !p.assigned && (
          <button style={s.bidBtn} onClick={onBid}>
            Place bid
          </button>
        )}
        {isOwner && (
          <button style={s.manageBtn} onClick={onViewBids}>
            Manage
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Post Project Modal ─── */
function PostProjectModal({ onClose, onSuccess }) {
  const [data,    setData]    = useState({ title: "", description: "", budget: "" });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = k => e => {
    setData(d => ({ ...d, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!data.title || data.title.length < 3)  e.title = "Title must be at least 3 characters";
    if (!data.description || data.description.length < 10) e.description = "Description must be at least 10 characters";
    if (!data.budget || Number(data.budget) < 1) e.budget = "Budget must be at least $1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await API.post("/projects", { ...data, budget: Number(data.budget) });
      showToast("success", "Project posted successfully!");
      onSuccess();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to post project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <div style={s.modalHeader}>
        <h2 style={s.modalTitle}>Post a project</h2>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
      <form onSubmit={submit} style={s.modalForm}>
        <Field label="Project title" error={errors.title}>
          <input style={s.modalInput} placeholder="e.g. Build a React dashboard" onChange={set("title")} />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea style={s.modalTextarea} placeholder="Describe what you need in detail..." onChange={set("description")} />
        </Field>
        <Field label="Budget (USD)" error={errors.budget}>
          <input style={s.modalInput} type="number" placeholder="e.g. 500" onChange={set("budget")} />
        </Field>
        <div style={s.modalBtns}>
          <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? <span style={s.spinner} /> : "Post project"}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

/* ─── Bid Form Modal ─── */
function BidFormModal({ project, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!amount || Number(amount) < 1) { showToast("error", "Enter a valid bid amount"); return; }
    setLoading(true);
    try {
      await API.post("/bid", { projectId: project._id, amount: Number(amount), message });
      onSuccess();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to submit bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrap onClose={onClose}>
      <div style={s.modalHeader}>
        <h2 style={s.modalTitle}>Place a bid</h2>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
      <p style={s.modalSub}>{project.title} · Budget: <strong style={{ color: "#34d399" }}>${project.budget}</strong></p>
      <form onSubmit={submit} style={s.modalForm}>
        <Field label="Your bid amount (USD)">
          <input style={s.modalInput} type="number" placeholder="e.g. 450" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <Field label="Cover message">
          <textarea style={s.modalTextarea} placeholder="Why are you the best fit for this project?" value={message} onChange={e => setMessage(e.target.value)} />
        </Field>
        <div style={s.modalBtns}>
          <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? <span style={s.spinner} /> : "Submit bid"}
          </button>
        </div>
      </form>
    </ModalWrap>
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

  const accept = async (bid) => {
    try {
      await API.post("/accept-bid", { projectId: project._id, freelancerEmail: bid.freelancerEmail });
      showToast("success", `Accepted bid from ${bid.freelancerEmail.split("@")[0]}`);
      onRefresh();
      onClose();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to accept bid");
    }
  };

  return (
    <ModalWrap onClose={onClose} wide>
      <div style={s.modalHeader}>
        <h2 style={s.modalTitle}>Bids ({bids.length})</h2>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
      <p style={s.modalSub}>{project.title}</p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={s.spinner} />
        </div>
      ) : bids.length === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 0", color: "#4a5280" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◎</div>
          <p>No bids yet on this project.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 420, overflowY: "auto" }}>
          {bids.map((b, i) => (
            <div key={i} style={s.bidRow}>
              <div style={s.bidAvatar}>{(b.freelancerEmail || "?")[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0ff", marginBottom: 4 }}>
                  {b.freelancerEmail}
                </div>
                {b.message && (
                  <p style={{ fontSize: 13, color: "#7a83aa", lineHeight: 1.55, margin: 0 }}>{b.message}</p>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                <span style={s.bidAmount}>${b.amount}</span>
                {isOwner && !project.assigned && (
                  <button style={s.acceptBtn} onClick={() => accept(b)}>Accept</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalWrap>
  );
}

/* ─── Reusable helpers ─── */
function ModalWrap({ children, onClose, wide }) {
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modal, maxWidth: wide ? 580 : 480 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
      {error && <span style={s.fieldError}>{error}</span>}
    </div>
  );
}

/* ─── Styles ─── */
const s = {
  layout:  { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f" },
  main:    { flex: 1, overflowY: "auto", background: "radial-gradient(ellipse at 10% 10%, rgba(108,99,255,0.06) 0%, transparent 55%), #07080f" },
  inner:   { padding: "44px 52px", maxWidth: 1200 },

  topbar:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 },
  title:    { fontSize: 34, fontWeight: 800, color: "#f0f0ff", margin: "0 0 6px", letterSpacing: "-1px", fontFamily: "Georgia, serif" },
  subtitle: { fontSize: 15, color: "#7a83aa", margin: 0 },

  postBtn: {
    padding: "13px 26px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 4px 20px rgba(108,99,255,0.35)", fontFamily: "inherit",
  },

  toolbar:    { display: "flex", gap: 14, marginBottom: 32, flexWrap: "wrap" },
  searchWrap: { flex: 1, position: "relative", minWidth: 260 },
  searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" },
  searchInput: {
    width: "100%", padding: "12px 42px", borderRadius: 12, fontSize: 14,
    background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.09)",
    color: "#f0f0ff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  searchInputFocus: {
    width: "100%", padding: "12px 42px", borderRadius: 12, fontSize: 14,
    background: "#13162a", border: "1px solid #6c63ff",
    color: "#f0f0ff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    boxShadow: "0 0 0 3px rgba(108,99,255,0.12)",
  },
  clearBtn:  { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4a5280", cursor: "pointer", fontSize: 13 },

  filters:     { display: "flex", gap: 8 },
  filterBtn:   { padding: "11px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.09)", background: "#0d0f1e", color: "#7a83aa", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" },
  filterActive:{ padding: "11px 18px", borderRadius: 10, border: "1px solid rgba(108,99,255,0.4)", background: "rgba(108,99,255,0.15)", color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" },

  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginBottom: 36 },

  card: {
    background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "26px 26px",
    transition: "border-color 0.2s, transform 0.2s",
    display: "flex", flexDirection: "column", gap: 0,
  },
  cardHover: { borderColor: "rgba(129,140,248,0.35)", transform: "translateY(-3px)" },

  cardTop:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: 700, color: "#f0f0ff", margin: 0, lineHeight: 1.3, fontFamily: "Georgia, serif" },

  badgePurple: { padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(129,140,248,0.15)", color: "#818cf8", flexShrink: 0, whiteSpace: "nowrap" },
  badgeGreen:  { padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(52,211,153,0.15)", color: "#34d399", flexShrink: 0, whiteSpace: "nowrap" },

  cardDesc:    { fontSize: 13, color: "#7a83aa", lineHeight: 1.6, margin: "0 0 18px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardMeta:    { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  cardBy:      { fontSize: 12, color: "#4a5280" },
  cardBudget:  { fontSize: 22, fontWeight: 800, color: "#34d399", fontFamily: "Georgia, serif" },

  cardActions: { display: "flex", gap: 8, marginTop: "auto" },
  viewBidsBtn: { flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#9098c0", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  bidBtn:      { flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  manageBtn:   { flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.08)", color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  // Pagination
  paginationBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 12 },
  pageBtn:       { padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#0d0f1e", color: "#9098c0", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  pageNumbers:   { display: "flex", gap: 6 },
  pageNum:       { width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.09)", background: "#0d0f1e", color: "#7a83aa", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  pageNumActive: { width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(108,99,255,0.4)", background: "rgba(108,99,255,0.15)", color: "#818cf8", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },

  // Empty state
  center:     { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 },
  emptyState: { textAlign: "center", padding: "70px 20px", color: "#4a5280" },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: "#7a83aa", margin: "0 0 10px" },
  emptySub:   { fontSize: 15, margin: "0 0 24px" },
  clearSearchBtn: { padding: "10px 22px", borderRadius: 10, border: "1px solid rgba(108,99,255,0.3)", background: "rgba(108,99,255,0.1)", color: "#818cf8", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },

  // Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal:   { background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "36px", width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle:  { fontSize: 22, fontWeight: 700, color: "#f0f0ff", margin: 0, fontFamily: "Georgia, serif" },
  modalSub:    { fontSize: 14, color: "#7a83aa", margin: "0 0 24px" },
  closeBtn:    { background: "none", border: "none", color: "#4a5280", cursor: "pointer", fontSize: 18, padding: 4 },
  modalForm:   { display: "flex", flexDirection: "column", gap: 18 },
  modalInput:  { background: "#13162a", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11, padding: "12px 16px", fontSize: 14, color: "#f0f0ff", width: "100%", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  modalTextarea: { background: "#13162a", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11, padding: "12px 16px", fontSize: 14, color: "#f0f0ff", width: "100%", outline: "none", boxSizing: "border-box", fontFamily: "inherit", minHeight: 100, resize: "vertical", lineHeight: 1.6 },
  modalBtns:   { display: "flex", gap: 12, marginTop: 8 },
  cancelBtn:   { flex: 1, padding: "12px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9098c0", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  submitBtn:   { flex: 1, padding: "12px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" },
  fieldLabel:  { fontSize: 13, fontWeight: 500, color: "#7a83aa" },
  fieldError:  { fontSize: 12, color: "#f87171", marginTop: 2 },

  // Bid row
  bidRow:    { display: "flex", gap: 14, padding: "16px", background: "#13162a", borderRadius: 12, alignItems: "flex-start" },
  bidAvatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 },
  bidAmount: { fontSize: 20, fontWeight: 800, color: "#34d399", fontFamily: "Georgia, serif" },
  acceptBtn: { padding: "7px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  spinner: { display: "inline-block", width: 24, height: 24, border: "3px solid rgba(255,255,255,0.08)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
};