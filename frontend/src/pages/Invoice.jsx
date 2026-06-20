import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

export default function Invoice() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [generating, setGenerating] = useState(null);
  const [paid, setPaid] = useState(() => {
    try { return JSON.parse(localStorage.getItem("paid_projects") || "[]"); }
    catch { return []; }
  });

  const role  = localStorage.getItem("role")  || "";
  const email = localStorage.getItem("email") || "";

  useEffect(() => {
    API.get("/projects?limit=100")
      .then(r => setProjects(r.data.projects || []))
      .catch(() => showToast("error", "Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  const assignedProjects = projects.filter(
    p => p.assigned && (
      role === "client"
        ? p.createdBy === email
        : p.assignedFreelancer === email
    )
  );

  const generatePDF = async (project) => {
    setGenerating(project._id);
    try {
      const doc = new jsPDF();
      const isPaid = paid.includes(project._id);
      const invoiceNum = `INV-${project._id.slice(-6).toUpperCase()}`;
      const date = new Date(project.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      });

      // ── Header background ──
      doc.setFillColor(7, 8, 15);
      doc.rect(0, 0, 210, 297, "F");

      // ── Logo / Brand ──
      doc.setFontSize(26);
      doc.setTextColor(108, 99, 255);
      doc.setFont("helvetica", "bold");
      doc.text("FreelanceHub", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(122, 131, 170);
      doc.setFont("helvetica", "normal");
      doc.text("The marketplace built for real work.", 14, 30);

      // ── Invoice label ──
      doc.setFontSize(32);
      doc.setTextColor(240, 240, 255);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 196, 22, { align: "right" });

      // ── Invoice details ──
      doc.setFontSize(10);
      doc.setTextColor(122, 131, 170);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice No: ${invoiceNum}`, 196, 30, { align: "right" });
      doc.text(`Date: ${date}`, 196, 36, { align: "right" });
      doc.text(`Status: ${isPaid ? "PAID" : "PENDING"}`, 196, 42, { align: "right" });

      // ── Divider ──
      doc.setDrawColor(30, 35, 70);
      doc.setLineWidth(0.5);
      doc.line(14, 48, 196, 48);

      // ── From / To ──
      doc.setFontSize(9);
      doc.setTextColor(122, 131, 170);
      doc.text("FROM", 14, 58);
      doc.text("TO", 110, 58);

      doc.setFontSize(11);
      doc.setTextColor(240, 240, 255);
      doc.setFont("helvetica", "bold");
      doc.text(project.createdBy || "Client", 14, 66);
      doc.text(project.assignedFreelancer || "Freelancer", 110, 66);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(122, 131, 170);
      doc.text("Client", 14, 72);
      doc.text("Freelancer", 110, 72);

      // ── Project details table ──
      doc.setFontSize(12);
      doc.setTextColor(240, 240, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Project Details", 14, 88);

      autoTable(doc, {
        startY: 93,
        head: [["Description", "Project Title", "Amount"]],
        body: [
          [
            project.description?.slice(0, 60) + (project.description?.length > 60 ? "..." : "") || "—",
            project.title,
            `$${project.budget}`,
          ],
        ],
        styles: {
          fillColor: [13, 15, 30],
          textColor: [240, 240, 255],
          fontSize: 10,
          cellPadding: 10,
        },
        headStyles: {
          fillColor: [20, 22, 45],
          textColor: [122, 131, 170],
          fontStyle: "bold",
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 70 },
          2: { cellWidth: 30, halign: "right" },
        },
        theme: "grid",
        tableLineColor: [30, 35, 70],
        tableLineWidth: 0.3,
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // ── Total box ──
      doc.setFillColor(20, 22, 45);
      doc.roundedRect(120, finalY, 76, 40, 3, 3, "F");

      doc.setFontSize(10);
      doc.setTextColor(122, 131, 170);
      doc.text("Subtotal", 126, finalY + 12);
      doc.text("Tax (0%)", 126, finalY + 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(52, 211, 153);
      doc.text("Total", 126, finalY + 34);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(240, 240, 255);
      doc.text(`$${project.budget}`, 192, finalY + 12, { align: "right" });
      doc.text("$0.00", 192, finalY + 22, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(52, 211, 153);
      doc.text(`$${project.budget}`, 192, finalY + 34, { align: "right" });

      // ── Status stamp ──
      if (isPaid) {
        doc.setFontSize(28);
        doc.setTextColor(52, 211, 153);
        doc.setFont("helvetica", "bold");
        doc.text("✓ PAID", 14, finalY + 34);
      } else {
        doc.setFontSize(28);
        doc.setTextColor(251, 191, 36);
        doc.setFont("helvetica", "bold");
        doc.text("PENDING", 14, finalY + 34);
      }

      // ── Footer ──
      doc.setDrawColor(30, 35, 70);
      doc.line(14, 270, 196, 270);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(74, 82, 128);
      doc.text("FreelanceHub — The marketplace built for real work.", 105, 278, { align: "center" });
      doc.text("For support: support@freelancehub.com", 105, 284, { align: "center" });

      // ── Save ──
      doc.save(`FreelanceHub-Invoice-${invoiceNum}.pdf`);
      showToast("success", "Invoice downloaded!");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to generate invoice");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px" }}>
              Invoices
            </h1>
            <p style={{ color: "var(--text2)", marginTop: 4, fontSize: 15 }}>
              Download PDF invoices for your completed projects
            </p>
          </div>

          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--accent2)" }}>{assignedProjects.length}</div>
              <div className="stat-card-label">Total Invoices</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--green)" }}>
                {assignedProjects.filter(p => paid.includes(p._id)).length}
              </div>
              <div className="stat-card-label">Paid</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--amber)" }}>
                {assignedProjects.filter(p => !paid.includes(p._id)).length}
              </div>
              <div className="stat-card-label">Pending</div>
            </div>
          </div>

          {/* Invoice list */}
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: "0 auto", width: 28, height: 28 }} />
            </div>
          ) : assignedProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <h3>No invoices yet</h3>
              <p>{role === "client" ? "Accept a bid to generate invoices." : "Get assigned to projects to see invoices."}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {assignedProjects.map(p => {
                const isPaid = paid.includes(p._id);
                const invoiceNum = `INV-${p._id.slice(-6).toUpperCase()}`;
                return (
                  <div key={p._id} style={invoiceCard}>
                    {/* Left */}
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div style={invoiceIcon}>🧾</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text3)" }}>
                          {invoiceNum} · {new Date(p.createdAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                          {role === "client" ? `Freelancer: ${p.assignedFreelancer}` : `Client: ${p.createdBy}`}
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--green)" }}>
                          ${p.budget}
                        </div>
                        <span className={`badge ${isPaid ? "badge-green" : "badge-amber"}`}>
                          {isPaid ? "✓ Paid" : "Pending"}
                        </span>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "10px 20px", gap: 8, whiteSpace: "nowrap" }}
                        disabled={generating === p._id}
                        onClick={() => generatePDF(p)}
                      >
                        {generating === p._id
                          ? <span className="spinner" style={{ width: 14, height: 14 }} />
                          : "⬇ Download PDF"
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const invoiceCard = {
  background: "var(--bg2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "24px 28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  transition: "border-color 0.2s",
};

const invoiceIcon = {
  width: 48, height: 48,
  borderRadius: 12,
  background: "rgba(108,99,255,0.15)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 22, flexShrink: 0,
};