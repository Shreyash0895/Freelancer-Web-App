import Sidebar from "../components/Sidebar";

export default function Analytics() {
  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.inner}>
          <div style={s.pageHeader}>
            <h1 style={s.pageTitle}>Analytics</h1>
            <p style={s.pageSub}>View your project and earnings analytics</p>
          </div>
          <div style={s.card}>
            <p style={s.placeholder}>Analytics dashboard coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  layout:      { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f" },
  main:        { flex: 1, overflowY: "auto", background: "radial-gradient(ellipse at 10% 10%, rgba(108,99,255,0.06) 0%, transparent 55%), #07080f" },
  inner:       { padding: "44px 52px", maxWidth: 1100 },
  pageHeader:  { marginBottom: 36 },
  pageTitle:   { fontSize: 34, fontWeight: 800, color: "#f0f0ff", margin: "0 0 8px", letterSpacing: "-1px", fontFamily: "Georgia, serif" },
  pageSub:     { fontSize: 15, color: "#7a83aa", margin: 0 },
  card:        { background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "36px 36px" },
  placeholder: { fontSize: 15, color: "#7a83aa", margin: 0 },
};
