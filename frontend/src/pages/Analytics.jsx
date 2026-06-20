import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

const COLORS = ["#6c63ff", "#f472b6", "#34d399", "#fbbf24", "#22d3ee"];

export default function Analytics() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const role  = localStorage.getItem("role")  || "";
  const email = localStorage.getItem("email") || "";

  useEffect(() => {
    API.get("/projects?limit=100")
      .then(r => setProjects(r.data.projects || []))
      .catch(() => showToast("error", "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="empty-state" style={{ marginTop: 100 }}>
            <div className="spinner" style={{ margin: "0 auto", width: 36, height: 36 }} />
            <p style={{ color: "var(--text2)", marginTop: 16 }}>Loading analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-inner">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.8px" }}>
              Analytics
            </h1>
            <p style={{ color: "var(--text2)", marginTop: 4, fontSize: 15 }}>
              {role === "client" ? "Track your hiring activity" : "Track your freelance performance"}
            </p>
          </div>

          {role === "client"
            ? <ClientAnalytics projects={projects} email={email} />
            : <FreelancerAnalytics projects={projects} email={email} />
          }
        </div>
      </main>
    </div>
  );
}

//  CLIENT ANALYTICS

function ClientAnalytics({ projects, email }) {
  const myProjects      = projects.filter(p => p.createdBy === email);
  const assigned        = myProjects.filter(p => p.assigned);
  const open            = myProjects.filter(p => !p.assigned);
  const totalSpent      = assigned.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const avgBudget       = myProjects.length
    ? Math.round(myProjects.reduce((s, p) => s + (Number(p.budget) || 0), 0) / myProjects.length)
    : 0;

  // Monthly spending data
  const monthlyData = getLast6Months().map(month => ({
    month: month.label,
    spent: assigned
      .filter(p => isSameMonth(p.createdAt, month.date))
      .reduce((s, p) => s + (Number(p.budget) || 0), 0),
    projects: myProjects.filter(p => isSameMonth(p.createdAt, month.date)).length,
  }));

  // Project status pie
  const statusData = [
    { name: "Assigned", value: assigned.length },
    { name: "Open",     value: open.length },
  ].filter(d => d.value > 0);

  // Budget distribution
  const budgetRanges = [
    { range: "$0-100",    count: myProjects.filter(p => p.budget <= 100).length },
    { range: "$100-500",  count: myProjects.filter(p => p.budget > 100 && p.budget <= 500).length },
    { range: "$500-1000", count: myProjects.filter(p => p.budget > 500 && p.budget <= 1000).length },
    { range: "$1000+",    count: myProjects.filter(p => p.budget > 1000).length },
  ].filter(d => d.count > 0);

  return (
    <>
      {/* Stats */}
      <div style={grid4}>
        <StatCard label="Total Projects"  value={myProjects.length} color="var(--accent2)" />
        <StatCard label="Assigned"        value={assigned.length}   color="var(--green)"   />
        <StatCard label="Total Spent"     value={`$${totalSpent}`}  color="var(--pink)"    />
        <StatCard label="Avg Budget"      value={`$${avgBudget}`}   color="var(--cyan)"    />
      </div>

      {/* Monthly spending chart */}
      <ChartCard title="Monthly Spending & Projects">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#4a5280" fontSize={12} />
            <YAxis stroke="#4a5280" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="spent"    stroke="#6c63ff" strokeWidth={2} dot={{ fill: "#6c63ff" }} name="Spent ($)" />
            <Line type="monotone" dataKey="projects" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399" }} name="Projects" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={grid2}>
        {/* Project Status Pie */}
        {statusData.length > 0 && (
          <ChartCard title="Project Status">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Budget Distribution */}
        {budgetRanges.length > 0 && (
          <ChartCard title="Budget Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetRanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" stroke="#4a5280" fontSize={11} />
                <YAxis stroke="#4a5280" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#6c63ff" radius={[6,6,0,0]} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Recent projects table */}
      <ChartCard title="Recent Projects">
        <table style={tbl.table}>
          <thead>
            <tr style={tbl.headRow}>
              <th style={tbl.th}>Project</th>
              <th style={tbl.th}>Budget</th>
              <th style={tbl.th}>Status</th>
              <th style={tbl.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {myProjects.slice(0, 8).map(p => (
              <tr key={p._id} style={tbl.row}>
                <td style={tbl.td}>{p.title}</td>
                <td style={{ ...tbl.td, color: "var(--green)", fontWeight: 700 }}>${p.budget}</td>
                <td style={tbl.td}>
                  <span className={`badge ${p.assigned ? "badge-green" : "badge-purple"}`}>
                    {p.assigned ? "Assigned" : "Open"}
                  </span>
                </td>
                <td style={{ ...tbl.td, color: "var(--text3)" }}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {myProjects.length === 0 && (
          <div className="empty-state">
            <p>No projects yet. Post your first project!</p>
          </div>
        )}
      </ChartCard>
    </>
  );
}


//  FREELANCER ANALYTICS

function FreelancerAnalytics({ projects, email }) {
  const [bids, setBids] = useState([]);

  useEffect(() => {
    // We'll compute stats from projects
  }, []);

  const assignedToMe  = projects.filter(p => p.assignedFreelancer === email);
  const totalEarnings = assignedToMe.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const avgEarning    = assignedToMe.length
    ? Math.round(totalEarnings / assignedToMe.length)
    : 0;

  // Monthly earnings
  const monthlyData = getLast6Months().map(month => ({
    month: month.label,
    earnings: assignedToMe
      .filter(p => isSameMonth(p.createdAt, month.date))
      .reduce((s, p) => s + (Number(p.budget) || 0), 0),
    projects: assignedToMe.filter(p => isSameMonth(p.createdAt, month.date)).length,
  }));

  // Earnings by budget range
  const earningRanges = [
    { range: "$0-100",    count: assignedToMe.filter(p => p.budget <= 100).length },
    { range: "$100-500",  count: assignedToMe.filter(p => p.budget > 100 && p.budget <= 500).length },
    { range: "$500-1000", count: assignedToMe.filter(p => p.budget > 500 && p.budget <= 1000).length },
    { range: "$1000+",    count: assignedToMe.filter(p => p.budget > 1000).length },
  ].filter(d => d.count > 0);

  return (
    <>
      {/* Stats */}
      <div style={grid4}>
        <StatCard label="Projects Won"   value={assignedToMe.length} color="var(--accent2)" />
        <StatCard label="Total Earnings" value={`$${totalEarnings}`} color="var(--green)"   />
        <StatCard label="Avg Earning"    value={`$${avgEarning}`}    color="var(--pink)"    />
        <StatCard label="Success Rate"   value={assignedToMe.length > 0 ? "Active" : "Bidding"} color="var(--cyan)" />
      </div>

      {/* Monthly earnings chart */}
      <ChartCard title="Monthly Earnings">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#4a5280" fontSize={12} />
            <YAxis stroke="#4a5280" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="earnings" fill="#6c63ff" radius={[6,6,0,0]} name="Earnings ($)" />
            <Bar dataKey="projects" fill="#34d399" radius={[6,6,0,0]} name="Projects" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={grid2}>
        {/* Earnings distribution */}
        {earningRanges.length > 0 && (
          <ChartCard title="Earnings by Range">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={earningRanges} cx="50%" cy="50%" outerRadius={80} dataKey="count"
                  label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}>
                  {earningRanges.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Performance summary */}
        <ChartCard title="Performance Summary">
          <div style={{ padding: "8px 0" }}>
            {[
              { label: "Projects Won",     value: assignedToMe.length,   color: "var(--accent2)" },
              { label: "Total Earnings",   value: `$${totalEarnings}`,   color: "var(--green)"   },
              { label: "Avg per Project",  value: `$${avgEarning}`,      color: "var(--pink)"    },
              { label: "Best Month",       value: getBestMonth(monthlyData), color: "var(--cyan)" },
            ].map(item => (
              <div key={item.label} style={perfRow}>
                <span style={{ color: "var(--text2)", fontSize: 14 }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 700, fontSize: 16 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Assigned projects table */}
      <ChartCard title="Assigned Projects">
        <table style={tbl.table}>
          <thead>
            <tr style={tbl.headRow}>
              <th style={tbl.th}>Project</th>
              <th style={tbl.th}>Client</th>
              <th style={tbl.th}>Earning</th>
              <th style={tbl.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {assignedToMe.slice(0, 8).map(p => (
              <tr key={p._id} style={tbl.row}>
                <td style={tbl.td}>{p.title}</td>
                <td style={{ ...tbl.td, color: "var(--text2)" }}>{p.createdBy}</td>
                <td style={{ ...tbl.td, color: "var(--green)", fontWeight: 700 }}>${p.budget}</td>
                <td style={{ ...tbl.td, color: "var(--text3)" }}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assignedToMe.length === 0 && (
          <div className="empty-state">
            <p>No assigned projects yet. Keep bidding!</p>
          </div>
        )}
      </ChartCard>
    </>
  );
}

//  HELPER COMPONENTS

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-num" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={chartCard}>
      <h3 style={chartTitle}>{title}</h3>
      {children}
    </div>
  );
}


//  HELPER FUNCTIONS
function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString("default", { month: "short" }),
      date:  d,
    });
  }
  return months;
}

function isSameMonth(dateStr, refDate) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
}

function getBestMonth(data) {
  if (!data.length) return "N/A";
  const best = data.reduce((a, b) => b.earnings > a.earnings ? b : a, data[0]);
  return best.earnings > 0 ? `${best.month} ($${best.earnings})` : "N/A";
}

//  STYLES
const grid4   = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 };
const grid2   = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24, marginBottom: 24 };
const chartCard  = { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "28px", marginBottom: 24 };
const chartTitle = { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 20px" };
const perfRow    = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" };
const tooltipStyle = { background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f0ff" };
const tbl = {
  table:   { width: "100%", borderCollapse: "collapse" },
  headRow: { borderBottom: "1px solid var(--border)" },
  th:      { textAlign: "left", padding: "10px 12px", fontSize: 12, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
  row:     { borderBottom: "1px solid var(--border)", transition: "background 0.15s" },
  td:      { padding: "14px 12px", fontSize: 14, color: "var(--text)" },
};