import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

// ── Safe Stripe loader — never crashes if key is missing ──
let stripePromise = null;
let Elements = null;
let CardElement = null;
let useStripe = null;
let useElements = null;

try {
  const stripeJs  = await import("@stripe/stripe-js");
  const stripeReact = await import("@stripe/react-stripe-js");
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (key && key.startsWith("pk_")) {
    stripePromise = stripeJs.loadStripe(key);
  }
  Elements    = stripeReact.Elements;
  CardElement = stripeReact.CardElement;
  useStripe   = stripeReact.useStripe;
  useElements = stripeReact.useElements;
} catch {
  // Stripe not installed — will use fallback pay mode
}

// ============================================================
//  STRIPE CHECKOUT FORM
// ============================================================
function CheckoutForm({ project, onSuccess, onCancel }) {
  const stripe   = useStripe ? useStripe()    : null;
  const elements = useElements ? useElements() : null;
  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState(null);
  const [cardReady,  setCardReady]  = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      if (stripe && elements) {
        // Real Stripe payment
        const res = await API.post("/create-payment", {
          amount:    Number(project.budget) * 100,
          projectId: project._id,
        });

        const result = await stripe.confirmCardPayment(res.data.clientSecret, {
          payment_method: { card: elements.getElement(CardElement) },
        });

        if (result.error) {
          setError(result.error.message);
          showToast("error", result.error.message);
          setProcessing(false);
          return;
        }
      }

      // Mark as paid in MongoDB regardless (handles both Stripe + fallback)
      await API.post(`/projects/${project._id}/pay`);
      showToast("success", "Payment completed! ✅");
      onSuccess(project._id);
    } catch (err) {
      const msg = err.response?.data?.message || "Payment failed. Please try again.";
      setError(msg);
      showToast("error", msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={modal.overlay}>
      <div style={modal.box}>
        {/* Header */}
        <div style={modal.header}>
          <h2 style={modal.title}>Complete Payment</h2>
          <button onClick={onCancel} style={modal.closeBtn} disabled={processing}>✕</button>
        </div>

        {/* Project info */}
        <div style={modal.projectInfo}>
          <div>
            <p style={modal.projectName}>{project.title}</p>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>
              Paying to: {project.assignedFreelancer}
            </p>
          </div>
          <p style={modal.amount}>${project.budget}</p>
        </div>

        <form onSubmit={handlePay}>
          {/* Card input — only show if Stripe is configured */}
          {CardElement && stripePromise ? (
            <div style={modal.cardWrap}>
              <label style={modal.cardLabel}>Card Details</label>
              <div style={{
                ...modal.cardBox,
                border: cardReady
                  ? "1px solid rgba(108,99,255,0.5)"
                  : "1px solid rgba(255,255,255,0.09)",
              }}>
                <CardElement
                  onReady={() => setCardReady(true)}
                  options={{
                    style: {
                      base: {
                        color: "#f0f0ff",
                        fontSize: "15px",
                        fontFamily: "system-ui, sans-serif",
                        "::placeholder": { color: "#4a5280" },
                      },
                      invalid: { color: "#f87171" },
                    },
                  }}
                />
              </div>
              <div style={modal.testNote}>
                🧪 Test card: <strong>4242 4242 4242 4242</strong> · Any future date · Any CVC
              </div>
            </div>
          ) : (
            // Fallback — no Stripe configured
            <div style={modal.fallbackNote}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>💳</div>
              <p style={{ color: "var(--text2)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Stripe is not configured. Clicking Pay will mark this project as paid directly.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={modal.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* Buttons */}
          <div style={modal.btnRow}>
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              style={modal.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              style={processing ? { ...modal.payBtn, opacity: 0.7 } : modal.payBtn}
            >
              {processing ? (
                <span style={spinnerStyle} />
              ) : (
                `Pay $${project.budget}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
//  CHECKOUT FORM WRAPPER — handles Stripe Elements safely
// ============================================================
function CheckoutFormWrapper({ project, onSuccess, onCancel }) {
  if (Elements && stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <CheckoutForm
          project={project}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
    );
  }
  // No Stripe — render form directly
  return (
    <CheckoutForm
      project={project}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}

// ============================================================
//  MAIN PAYMENTS PAGE
// ============================================================
export default function Payments() {
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeProject, setActiveProject] = useState(null);

  const role  = localStorage.getItem("role")  || "";
  const email = localStorage.getItem("email") || "";

  useEffect(() => {
    API.get("/projects?limit=100")
      .then(r => setProjects(r.data.projects || []))
      .catch(() => showToast("error", "Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const assignedProjects = projects.filter(p =>
    p.assigned && (
      role === "client"
        ? p.createdBy === email
        : p.assignedFreelancer === email
    )
  );

  const handlePaySuccess = (projectId) => {
    setProjects(prev =>
      prev.map(p => p._id === projectId ? { ...p, paid: true } : p)
    );
    setActiveProject(null);
  };

  const markCompleted = async (projectId) => {
    try {
      await API.post(`/projects/${projectId}/complete`);
      setProjects(prev =>
        prev.map(p => p._id === projectId ? { ...p, completed: true } : p)
      );
      showToast("success", "Project marked as completed! ✅");
    } catch {
      showToast("error", "Failed to mark project as completed.");
    }
  };

  const totalPaid    = assignedProjects.filter(p =>  p.paid).reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const totalPending = assignedProjects.filter(p => !p.paid).reduce((s, p) => s + (Number(p.budget) || 0), 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px" }}>
              Payments
            </h1>
            <p style={{ color: "var(--text2)", marginTop: 4, fontSize: 15 }}>
              Track and process your project transactions
            </p>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 36 }}>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--accent2)" }}>
                {assignedProjects.length}
              </div>
              <div className="stat-card-label">Total Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--green)" }}>
                ${totalPaid}
              </div>
              <div className="stat-card-label">Paid</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--amber)" }}>
                ${totalPending}
              </div>
              <div className="stat-card-label">Pending</div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: "0 auto", width: 28, height: 28 }} />
            </div>
          ) : assignedProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◇</div>
              <h3>No transactions yet</h3>
              <p>
                {role === "client"
                  ? "Accept a bid on a project to see it here."
                  : "You'll see projects here once a client accepts your bid."}
              </p>
            </div>
          ) : (
            <div className="pay-table">
              {/* Table Head */}
              <div className="pay-table-head">
                <span>Project</span>
                <span>{role === "client" ? "Freelancer" : "Client"}</span>
                <span>Amount</span>
                <span>Payment</span>
                <span>Status</span>
                {role === "client" && <span>Actions</span>}
              </div>

              {/* Table Rows */}
              {assignedProjects.map(p => (
                <div key={p._id} className="pay-table-row">
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                    {p.title}
                  </span>

                  <span style={{ color: "var(--text2)", fontSize: 13 }}>
                    {role === "client" ? p.assignedFreelancer?.split("@")[0] : p.createdBy?.split("@")[0]}
                  </span>

                  <span style={{ fontWeight: 700, color: "var(--green)", fontSize: 15 }}>
                    ${p.budget}
                  </span>

                  {/* Payment badge — reads from MongoDB p.paid */}
                  <span>
                    <span className={`badge ${p.paid ? "badge-green" : "badge-amber"}`}>
                      {p.paid ? "✓ Paid" : "Pending"}
                    </span>
                  </span>

                  {/* Project state badge */}
                  <span>
                    <span className={`badge ${
                      p.completed ? "badge-cyan" : "badge-purple"
                    }`}>
                      {p.completed ? "✓ Completed" : "In Progress"}
                    </span>
                  </span>

                  {/* Client actions */}
                  {role === "client" && (
                    <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {!p.paid ? (
                        <button
                          className="btn btn-primary"
                          style={{ padding: "7px 16px", fontSize: 12 }}
                          onClick={() => setActiveProject(p)}
                        >
                          Pay now
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                          Paid ✓
                        </span>
                      )}

                      {p.paid && !p.completed && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "7px 16px", fontSize: 12 }}
                          onClick={() => markCompleted(p._id)}
                        >
                          Mark Complete
                        </button>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {activeProject && (
        <CheckoutFormWrapper
          project={activeProject}
          onSuccess={handlePaySuccess}
          onCancel={() => setActiveProject(null)}
        />
      )}

      <style>{tableCSS}</style>
    </div>
  );
}

// ── Table styles ──
const tableCSS = `
.pay-table {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.pay-table-head {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1.2fr 1.5fr;
  padding: 12px 24px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.pay-table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1.2fr 1.5fr;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  transition: background 0.15s;
}
.pay-table-row:last-child { border-bottom: none; }
.pay-table-row:hover { background: var(--bg3); }
@media(max-width: 900px) {
  .pay-table-head,
  .pay-table-row { grid-template-columns: 1fr 1fr; gap: 8px; }
}
`;

// ── Modal styles ──
const modal = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(8px)",
    zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  box: {
    background: "#0d0f1e",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "36px",
    width: "100%", maxWidth: 460,
    boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
    position: "relative",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: 800, color: "#f0f0ff", margin: 0 },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: "#9098c0",
    fontSize: 16, cursor: "pointer",
    width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  projectInfo: {
    background: "#13162a",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, padding: "16px 20px",
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 24,
  },
  projectName: { fontSize: 15, fontWeight: 600, color: "#f0f0ff", margin: "0 0 4px" },
  amount: { fontSize: 26, fontWeight: 800, color: "#34d399", margin: 0, flexShrink: 0 },
  cardWrap: { marginBottom: 16 },
  cardLabel: {
    fontSize: 12, color: "#7a83aa", fontWeight: 600,
    display: "block", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  cardBox: {
    background: "#13162a",
    borderRadius: 12, padding: "14px 16px",
    transition: "border 0.2s",
  },
  testNote: {
    fontSize: 12, color: "#4a5280",
    background: "rgba(108,99,255,0.08)",
    border: "1px solid rgba(108,99,255,0.15)",
    borderRadius: 8, padding: "10px 14px",
    marginBottom: 20, lineHeight: 1.5,
  },
  fallbackNote: {
    background: "rgba(108,99,255,0.06)",
    border: "1px solid rgba(108,99,255,0.15)",
    borderRadius: 12, padding: "24px 20px",
    textAlign: "center", marginBottom: 20,
  },
  errorBox: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: 10, padding: "12px 16px",
    color: "#f87171", fontSize: 13,
    marginBottom: 16, lineHeight: 1.5,
  },
  btnRow: { display: "flex", gap: 12 },
  cancelBtn: {
    flex: 1, padding: "13px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "#7a83aa",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit",
  },
  payBtn: {
    flex: 2, padding: "13px",
    borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff", fontSize: 14, fontWeight: 600,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(108,99,255,0.4)",
    transition: "opacity 0.2s",
  },
};

const spinnerStyle = {
  display: "inline-block",
  width: 18, height: 18,
  border: "2px solid rgba(255,255,255,0.25)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};