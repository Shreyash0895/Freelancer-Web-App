import Sidebar from "../components/Sidebar";

export default function Invoice() {
  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.inner}>
          <h1 style={s.title}>Invoices</h1>
          <p style={s.subtitle}>Invoice management coming soon.</p>
        </div>
      </main>
    </div>
  );
}

const s = {
  layout:   { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f" },
  main:     { flex: 1, overflowY: "auto", background: "#07080f" },
  inner:    { padding: "44px 52px", maxWidth: 1100 },
  title:    { fontSize: 38, fontWeight: 800, color: "#f0f0ff", margin: "0 0 10px", letterSpacing: "-1px", fontFamily: "Georgia, serif" },
  subtitle: { fontSize: 17, color: "#7a83aa", margin: 0 },
};
