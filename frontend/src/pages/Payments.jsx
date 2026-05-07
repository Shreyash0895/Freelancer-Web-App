import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Payments() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(null);
  const [paid,     setPaid]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("paid_projects") || "[]"); }
    catch { return []; }
  });

  const role  = localStorage.getItem("role")  || "";
  const email = localStorage.getItem("email") || "";

  useEffect(() => {
    API.get("/projects")
      .then(r => setProjects(r.data))
      .catch(() => showToast("error", "Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const assignedProjects = projects.filter(
    p => p.assigned && (role === "client" ? p.createdBy === email : p.assignedFreelancer === email)
  );

  const markPaid = (projectId) => {
    const updated = [...paid, projectId];
    setPaid(updated);
    localStorage.setItem("paid_projects", JSON.stringify(updated));
    showToast("success", "Payment marked as paid!");
    setPaying(null);
  };

  const handleStripe = async (project) => {
    setPaying(project._id);
    try {
      const res = await API.post("/create-payment", { amount: Number(project.budget) * 100 });
      showToast("info", "Stripe client secret received (integrate Stripe.js here)");
      console.log("clientSecret:", res.data.clientSecret);
      // In production: use @stripe/stripe-js to confirm payment with clientSecret
    } catch {
      showToast("info", "Stripe not configured — marking as paid directly.");
      markPaid(project._id);
    } finally {
      setPaying(null);
    }
  };

  const totalPaid    = assignedProjects.filter(p => paid.includes(p._id)).reduce((s,p) => s + (Number(p.budget)||0), 0);
  const totalPending = assignedProjects.filter(p => !paid.includes(p._id)).reduce((s,p) => s + (Number(p.budget)||0), 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, letterSpacing:"-0.8px" }}>
              Payments
            </h1>
            <p style={{ color:"var(--text2)", marginTop:4, fontSize:15 }}>
              Track all your financial transactions
            </p>
          </div>

          {/* Summary cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:36 }}>
            <SummaryCard label="Total transactions" value={assignedProjects.length} color="var(--accent2)" />
            <SummaryCard label="Paid"    value={`$${totalPaid}`}    color="var(--green)" />
            <SummaryCard label="Pending" value={`$${totalPending}`} color="var(--amber)" />
          </div>

          {/* Table */}
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin:"0 auto", width:28, height:28 }} />
            </div>
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
                    <span style={{ color:"var(--text2)", fontSize:13 }}>
                      {role === "client" ? p.assignedFreelancer : p.createdBy}
                    </span>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:"var(--green)" }}>
                      ${p.budget}
                    </span>
                    <span>
                      <span className={`badge ${isPaid ? "badge-green" : "badge-amber"}`}>
                        {isPaid ? "Paid" : "Pending"}
                      </span>
                    </span>
                    {role === "client" && (
                      <span>
                        {!isPaid ? (
                          <button
                            className="btn btn-primary"
                            style={{ padding:"7px 16px", fontSize:12 }}
                            disabled={paying === p._id}
                            onClick={() => handleStripe(p)}
                          >
                            {paying === p._id ? <span className="spinner" style={{ width:14,height:14 }}/> : "Pay now"}
                          </button>
                        ) : (
                          <span style={{ fontSize:12, color:"var(--text3)" }}>Done</span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style>{payStyles}</style>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="stat-card" style={{ "--accent-color": color }}>
      <div className="stat-card-num" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

const payStyles = `
.pay-table {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.pay-table-head {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
  padding: 14px 24px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 600;
  color: var(--text3);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.pay-table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  transition: background 0.15s;
}
.pay-table-row:last-child { border-bottom: none; }
.pay-table-row:hover { background: var(--bg3); }
.pay-project-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--text);
}
@media(max-width:700px){
  .pay-table-head,
  .pay-table-row { grid-template-columns: 1fr 1fr; gap:8px; }
}
`;