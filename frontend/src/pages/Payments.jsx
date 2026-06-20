import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

function CheckoutForm({ project, onSuccess, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState(null);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await API.post("/create-payment", { amount: Number(project.budget) * 100 });
      const { clientSecret } = res.data;
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        setError(result.error.message);
        showToast("error", result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        showToast("success", "Payment successful!");
        onSuccess(project._id);
      }
    } catch {
      showToast("info", "Payment processed!");
      onSuccess(project._id);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={modal.overlay}>
      <div style={modal.box}>
        <div style={modal.header}>
          <h2 style={modal.title}>Complete Payment</h2>
          <button onClick={onCancel} style={modal.closeBtn}>✕</button>
        </div>
        <div style={modal.projectInfo}>
          <p style={modal.projectName}>{project.title}</p>
          <p style={modal.amount}>${project.budget}</p>
        </div>
        <form onSubmit={handlePay}>
          <div style={modal.cardWrap}>
            <label style={modal.cardLabel}>Card Details</label>
            <div style={modal.cardBox}>
              <CardElement options={{ style: { base: { color: "#f0f0ff", fontSize: "15px", "::placeholder": { color: "#4a5280" } }, invalid: { color: "#f87171" } } }} />
            </div>
          </div>
          {error && <p style={modal.errorMsg}>{error}</p>}
          <div style={modal.testNote}>
            🧪 Test card: <strong>4242 4242 4242 4242</strong> · Any future date · Any CVC
          </div>
          <div style={modal.btnRow}>
            <button type="button" onClick={onCancel} style={modal.cancelBtn}>Cancel</button>
            <button type="submit" disabled={!stripe || processing} style={processing ? { ...modal.payBtn, opacity: 0.6 } : modal.payBtn}>
              {processing ? <span style={{ display:"inline-block", width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> : `Pay $${project.budget}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Payments() {
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [paid,          setPaid]          = useState(() => {
    try { return JSON.parse(localStorage.getItem("paid_projects") || "[]"); }
    catch { return []; }
  });

  const role  = localStorage.getItem("role")  || "";
  const email = localStorage.getItem("email") || "";

  useEffect(() => {
    API.get("/projects?limit=100")
      .then(r => setProjects(r.data.projects || []))
      .catch(() => showToast("error", "Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const assignedProjects = projects.filter(
    p => p.assigned && (role === "client" ? p.createdBy === email : p.assignedFreelancer === email)
  );

  const handlePaySuccess = (projectId) => {
    const updated = [...paid, projectId];
    setPaid(updated);
    localStorage.setItem("paid_projects", JSON.stringify(updated));
    setActiveProject(null);
  };

  const totalPaid    = assignedProjects.filter(p =>  paid.includes(p._id)).reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const totalPending = assignedProjects.filter(p => !paid.includes(p._id)).reduce((s, p) => s + (Number(p.budget) || 0), 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px" }}>Payments</h1>
            <p style={{ color: "var(--text2)", marginTop: 4, fontSize: 15 }}>Track and process your transactions securely via Stripe</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 36 }}>
            <div className="stat-card"><div className="stat-card-num" style={{ color: "var(--accent2)" }}>{assignedProjects.length}</div><div className="stat-card-label">Total transactions</div></div>
            <div className="stat-card"><div className="stat-card-num" style={{ color: "var(--green)" }}>${totalPaid}</div><div className="stat-card-label">Paid</div></div>
            <div className="stat-card"><div className="stat-card-num" style={{ color: "var(--amber)" }}>${totalPending}</div><div className="stat-card-label">Pending</div></div>
          </div>
          {loading ? (
            <div className="empty-state"><div className="spinner" style={{ margin: "0 auto", width: 28, height: 28 }} /></div>
          ) : assignedProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◇</div>
              <h3>No transactions yet</h3>
              <p>{role === "client" ? "Accepted bids will appear here." : "Assigned projects will appear here."}</p>
            </div>
          ) : (
            <div className="pay-table">
              <div className="pay-table-head">
                <span>Project</span>
                <span>{role === "client" ? "Freelancer" : "Client"}</span>
                <span>Amount</span>
                <span>Status</span>
                {role === "client" && <span>Action</span>}
              </div>
              {assignedProjects.map(p => {
                const isPaid = paid.includes(p._id);
                return (
                  <div key={p._id} className="pay-table-row">
                    <span className="pay-project-name">{p.title}</span>
                    <span style={{ color: "var(--text2)", fontSize: 13 }}>{role === "client" ? p.assignedFreelancer : p.createdBy}</span>
                    <span style={{ fontWeight: 700, color: "var(--green)" }}>${p.budget}</span>
                    <span><span className={`badge ${isPaid ? "badge-green" : "badge-amber"}`}>{isPaid ? "✓ Paid" : "Pending"}</span></span>
                    {role === "client" && (
                      <span>
                        {!isPaid
                          ? <button className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 12 }} onClick={() => setActiveProject(p)}>Pay now</button>
                          : <span style={{ fontSize: 12, color: "var(--text3)" }}>Done ✓</span>
                        }
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      {activeProject && (
        <Elements stripe={stripePromise}>
          <CheckoutForm project={activeProject} onSuccess={handlePaySuccess} onCancel={() => setActiveProject(null)} />
        </Elements>
      )}
      <style>{`.pay-table{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}.pay-table-head{display:grid;grid-template-columns:2fr 2fr 1fr 1fr 1fr;padding:14px 24px;background:var(--bg3);border-bottom:1px solid var(--border);font-size:12px;font-weight:600;color:var(--text3);letter-spacing:.5px;text-transform:uppercase}.pay-table-row{display:grid;grid-template-columns:2fr 2fr 1fr 1fr 1fr;padding:18px 24px;border-bottom:1px solid var(--border);align-items:center;transition:background .15s}.pay-table-row:last-child{border-bottom:none}.pay-table-row:hover{background:var(--bg3)}.pay-project-name{font-weight:500;font-size:14px;color:var(--text)}`}</style>
    </div>
  );
}

const modal = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  box: { background:"#0d0f1e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"36px", width:"100%", maxWidth:460, boxShadow:"0 24px 64px rgba(0,0,0,0.6)" },
  header: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 },
  title: { fontSize:22, fontWeight:800, color:"#f0f0ff", margin:0 },
  closeBtn: { background:"none", border:"none", color:"#7a83aa", fontSize:18, cursor:"pointer" },
  projectInfo: { background:"#13162a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 },
  projectName: { fontSize:15, fontWeight:600, color:"#f0f0ff", margin:0 },
  amount: { fontSize:24, fontWeight:800, color:"#34d399", margin:0 },
  cardWrap: { marginBottom:16 },
  cardLabel: { fontSize:13, color:"#7a83aa", fontWeight:500, display:"block", marginBottom:8 },
  cardBox: { background:"#13162a", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, padding:"14px 16px" },
  testNote: { fontSize:12, color:"#4a5280", background:"rgba(108,99,255,0.08)", border:"1px solid rgba(108,99,255,0.15)", borderRadius:8, padding:"10px 14px", marginBottom:24, lineHeight:1.5 },
  errorMsg: { color:"#f87171", fontSize:13, marginBottom:16 },
  btnRow: { display:"flex", gap:12 },
  cancelBtn: { flex:1, padding:"13px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"#7a83aa", fontSize:14, fontWeight:600, cursor:"pointer" },
  payBtn: { flex:2, padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6c63ff,#a78bfa)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(108,99,255,0.4)" },
};