import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Simulated live activity feed — the product's real pulse ──
const TICKER_EVENTS = [
  { type: "post", text: "Priya posted \"Shopify store redesign\"", amount: "$650" },
  { type: "bid",  text: "Devon bid on \"React dashboard rebuild\"", amount: "$1,200" },
  { type: "hire", text: "Maya hired a freelancer for \"Brand identity kit\"", amount: "$900" },
  { type: "post", text: "Arjun posted \"iOS app bug fixes\"", amount: "$420" },
  { type: "bid",  text: "Lena bid on \"SEO audit & strategy\"", amount: "$300" },
  { type: "hire", text: "Tom hired a freelancer for \"Landing page copy\"", amount: "$250" },
  { type: "post", text: "Wei posted \"Figma to React conversion\"", amount: "$780" },
  { type: "bid",  text: "Sara bid on \"Logo + style guide\"", amount: "$540" },
];

const DOT = { post: "#22d3ee", bid: "#fbbf24", hire: "#34d399" };
const LABEL = { post: "New project", bid: "New bid", hire: "Hired" };

export default function LandingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("client"); // "client" | "freelancer"

  const goSignup = (role) => navigate(`/signup?role=${role}`);

  return (
    <div style={s.page}>
      {/* ── Nav ── */}
      <nav style={s.nav}>
        <div style={s.navInner} className="lp-nav-inner">
          <div style={s.logo}>Freelance<span style={s.logoPink}>Hub</span></div>
          <div style={s.navRight}>
            <button style={s.navLink} onClick={() => navigate("/login")}>Sign in</button>
            <button style={s.navCta} onClick={() => goSignup("freelancer")}>Get started →</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={s.hero} className="lp-hero">
        <div style={s.heroGlow1} />
        <div style={s.heroGlow2} />

        <div style={s.heroInner}>
          <div style={s.eyebrow}>✦ Real projects, real freelancers, real money</div>

          <div style={s.roleToggle}>
            <button
              onClick={() => setMode("client")}
              style={mode === "client" ? s.roleActive : s.roleBtn}
            >
              💼 I'm hiring
            </button>
            <button
              onClick={() => setMode("freelancer")}
              style={mode === "freelancer" ? s.roleActive : s.roleBtn}
            >
              🎨 I'm freelancing
            </button>
          </div>

          <h1 style={s.headline}>
            {mode === "client" ? (
              <>Post it. Get bids.<br /><span style={s.headlineAccent}>Hire by tonight.</span></>
            ) : (
              <>Find work.<br />Bid it. <span style={s.headlineAccent}>Get paid.</span></>
            )}
          </h1>

          <p style={s.heroSub}>
            {mode === "client"
              ? "Describe your project, watch qualified freelancers bid in real time, and pick the one who fits — budget, skill, and timeline, your call."
              : "Browse open projects, send a bid with your price and pitch, and chat directly the moment a client accepts. No middlemen, no waiting weeks for payment."
            }
          </p>

          <div style={s.heroBtns}>
            <button style={s.primaryBtn} onClick={() => goSignup(mode === "client" ? "client" : "freelancer")}>
              {mode === "client" ? "Post your first project →" : "Browse open projects →"}
            </button>
            <button style={s.secondaryBtn} onClick={() => navigate("/login")}>
              I already have an account
            </button>
          </div>

          {/* ── Signature: live activity ticker ── */}
          <div style={s.tickerWrap}>
            <div style={s.tickerLabel}>
              <span style={s.tickerDotPulse} /> Live on FreelanceHub
            </div>
            <Ticker />
          </div>
        </div>
      </section>

      {/* ── Flow: how it actually works ── */}
      <section style={s.section} className="lp-section">
        <div style={s.sectionInner}>
          <p style={s.sectionEyebrow}>How it works</p>
          <h2 style={s.sectionTitle}>One project, four steps, zero guesswork</h2>

          <div style={s.flowGrid} className="lp-flow-grid">
            {[
              { n: "01", title: "Post or browse",  desc: "Clients describe the job and set a budget. Freelancers scan open projects that match their skills.", color: "#818cf8" },
              { n: "02", title: "Bid or compare",   desc: "Freelancers send a price and a short pitch. Clients see every bid side by side, no bidding wars hidden.", color: "#22d3ee" },
              { n: "03", title: "Chat privately",   desc: "The moment a bid is accepted, a private chat opens between just the two of you — files included.", color: "#f472b6" },
              { n: "04", title: "Pay securely",     desc: "Payment runs through Stripe. The freelancer gets notified the second it clears.", color: "#34d399" },
            ].map(step => (
              <div key={step.n} style={s.flowCard}>
                <div style={{ ...s.flowNum, color: step.color, borderColor: `${step.color}33`, background: `${step.color}14` }}>{step.n}</div>
                <h3 style={s.flowTitle}>{step.title}</h3>
                <p style={s.flowDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two-sided value ── */}
      <section style={{ ...s.section, background: "#0a0b14" }} className="lp-section">
        <div style={s.sectionInner}>
          <div style={s.twoCol} className="lp-two-col">
            <div style={s.sideCard}>
              <div style={s.sideTag}>For clients</div>
              <h3 style={s.sideTitle}>Stop chasing freelancers in five different inboxes</h3>
              <ul style={s.sideList}>
                <li>Post once, get bids from people who actually want the work</li>
                <li>Compare price, pitch, and past projects in one screen</li>
                <li>Pay through Stripe — no wire transfers, no invoicing back and forth</li>
                <li>Download a clean PDF invoice the moment payment clears</li>
              </ul>
              <button style={s.sideBtn} onClick={() => goSignup("client")}>Post a project →</button>
            </div>

            <div style={s.sideCard}>
              <div style={{ ...s.sideTag, background: "rgba(34,211,238,0.12)", color: "#22d3ee" }}>For freelancers</div>
              <h3 style={s.sideTitle}>Bid on real budgets, not "exposure"</h3>
              <ul style={s.sideList}>
                <li>Every project shows a real budget before you spend time bidding</li>
                <li>Win a bid, and a private chat with the client opens instantly</li>
                <li>Submit work files directly in the project — no email attachments</li>
                <li>Track every dollar earned with a built-in earnings dashboard</li>
              </ul>
              <button style={{ ...s.sideBtn, background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }} onClick={() => goSignup("freelancer")}>
                Browse projects →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section style={s.trustSection}>
        <div style={s.trustInner} className="lp-trust">
          {[
            { num: "12K+", label: "Projects posted" },
            { num: "98%",  label: "Client satisfaction" },
            { num: "4.9★", label: "Average rating" },
            { num: "<24h", label: "Avg time to first bid" },
          ].map(t => (
            <div key={t.label} style={s.trustItem}>
              <div style={s.trustNum}>{t.num}</div>
              <div style={s.trustLabel}>{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={s.ctaSection} className="lp-section">
        <div style={s.ctaGlow} />
        <div style={s.ctaInner}>
          <h2 style={s.ctaTitle}>Your next project is one post away.</h2>
          <p style={s.ctaSub}>Free to join. No commission until you actually get paid.</p>
          <div style={s.heroBtns}>
            <button style={s.primaryBtn} onClick={() => goSignup("client")}>Post a project →</button>
            <button style={s.secondaryBtn} onClick={() => goSignup("freelancer")}>Start freelancing →</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.logo}>Freelance<span style={s.logoPink}>Hub</span></div>
          <p style={s.footerText}>© {new Date().getFullYear()} FreelanceHub. Built for real work.</p>
        </div>
      </footer>

      <style>{css}</style>
    </div>
  );
}

// ── Marquee ticker component ──
function Ticker() {
  const items = [...TICKER_EVENTS, ...TICKER_EVENTS]; // duplicate for seamless loop
  return (
    <div style={s.tickerTrack}>
      <div className="ticker-scroll" style={s.tickerScroll}>
        {items.map((e, i) => (
          <div key={i} style={s.tickerItem}>
            <span style={{ ...s.tickerDot, background: DOT[e.type] }} />
            <span style={s.tickerType}>{LABEL[e.type]}</span>
            <span style={s.tickerText}>{e.text}</span>
            <span style={s.tickerAmount}>{e.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const css = `
@keyframes scrollTicker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.ticker-scroll {
  animation: scrollTicker 28s linear infinite;
}
@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.8); }
}
@media (prefers-reduced-motion: reduce) {
  .ticker-scroll { animation: none; }
}
@media (max-width: 860px) {
  .ticker-scroll { animation-duration: 20s; }
}
@media (max-width: 900px) {
  .lp-flow-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .lp-two-col   { grid-template-columns: 1fr !important; }
  .lp-trust     { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
}
@media (max-width: 560px) {
  .lp-flow-grid { grid-template-columns: 1fr !important; }
  .lp-nav-inner { padding: 14px 18px !important; }
  .lp-hero      { padding: 56px 18px 40px !important; }
  .lp-section   { padding: 60px 18px !important; }
}
`;

const s = {
  page: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f", color: "#f0f0ff", overflowX: "hidden" },

  // Nav
  nav: { position: "sticky", top: 0, zIndex: 50, background: "rgba(7,8,15,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  navInner: { maxWidth: 1180, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  logoPink: { WebkitTextFillColor: "#f472b6" },
  navRight: { display: "flex", alignItems: "center", gap: 16 },
  navLink: { background: "none", border: "none", color: "#9098c0", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  navCta: { padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(108,99,255,0.35)" },

  // Hero
  hero: { position: "relative", padding: "80px 32px 60px", overflow: "hidden" },
  heroGlow1: { position: "absolute", top: -100, left: "10%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%)", pointerEvents: "none" },
  heroGlow2: { position: "absolute", top: 60, right: "5%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)", pointerEvents: "none" },
  heroInner: { position: "relative", maxWidth: 760, margin: "0 auto", textAlign: "center" },
  eyebrow: { display: "inline-block", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.35)", borderRadius: 100, padding: "6px 18px", fontSize: 13, fontWeight: 600, color: "#a78bfa", marginBottom: 28 },

  roleToggle: { display: "inline-flex", gap: 6, background: "#13162a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 5, marginBottom: 32 },
  roleBtn: { padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", color: "#7a83aa", background: "transparent", fontFamily: "inherit", transition: "all 0.2s" },
  roleActive: { padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", color: "#fff", background: "#6c63ff", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(108,99,255,0.4)" },

  headline: { fontFamily: "Georgia, serif", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-1.5px", margin: "0 0 22px" },
  headlineAccent: { background: "linear-gradient(90deg, #6c63ff, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "italic" },
  heroSub: { fontSize: 17, lineHeight: 1.7, color: "#9098c0", maxWidth: 560, margin: "0 auto 36px" },

  heroBtns: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 },
  primaryBtn: { padding: "15px 30px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 24px rgba(108,99,255,0.4)" },
  secondaryBtn: { padding: "15px 26px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)", color: "#cbd2f0", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  // Ticker
  tickerWrap: { maxWidth: 900, margin: "0 auto", textAlign: "left" },
  tickerLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#7a83aa", marginBottom: 12, letterSpacing: "0.3px" },
  tickerDotPulse: { width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulseDot 1.6s ease-in-out infinite", display: "inline-block" },
  tickerTrack: { overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 0", maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" },
  tickerScroll: { display: "flex", gap: 14, width: "max-content" },
  tickerItem: { display: "flex", alignItems: "center", gap: 9, background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 100, padding: "9px 16px 9px 12px", flexShrink: 0, fontSize: 13 },
  tickerDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  tickerType: { color: "#7a83aa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 },
  tickerText: { color: "#d4d8f0", whiteSpace: "nowrap" },
  tickerAmount: { color: "#34d399", fontWeight: 700, fontFamily: "'Courier New', monospace", marginLeft: 4, flexShrink: 0 },

  // Sections
  section: { padding: "90px 32px" },
  sectionInner: { maxWidth: 1100, margin: "0 auto" },
  sectionEyebrow: { fontSize: 13, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px", textAlign: "center" },
  sectionTitle: { fontFamily: "Georgia, serif", fontSize: "clamp(28px, 3.4vw, 38px)", fontWeight: 700, textAlign: "center", letterSpacing: "-1px", margin: "0 0 56px", maxWidth: 600, marginLeft: "auto", marginRight: "auto" },

  // Flow
  flowGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 },
  flowCard: { background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "28px 24px" },
  flowNum: { width: 44, height: 44, borderRadius: 12, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16, marginBottom: 18 },
  flowTitle: { fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: "#f0f0ff" },
  flowDesc: { fontSize: 14, color: "#7a83aa", lineHeight: 1.65, margin: 0 },

  // Two col
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 },
  sideCard: { background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "40px 36px" },
  sideTag: { display: "inline-block", background: "rgba(108,99,255,0.15)", color: "#a78bfa", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 100, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.5px" },
  sideTitle: { fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, lineHeight: 1.3, margin: "0 0 24px", letterSpacing: "-0.5px" },
  sideList: { listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 14 },
  sideBtn: { padding: "13px 26px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  // Trust
  trustSection: { padding: "60px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  trustInner: { maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, textAlign: "center" },
  trustItem: { display: "flex", flexDirection: "column", gap: 6 },
  trustNum: { fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 800, color: "#fff" },
  trustLabel: { fontSize: 13, color: "#7a83aa" },

  // Final CTA
  ctaSection: { position: "relative", padding: "100px 32px", textAlign: "center", overflow: "hidden" },
  ctaGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(108,99,255,0.15) 0%, transparent 70%)", pointerEvents: "none" },
  ctaInner: { position: "relative", maxWidth: 600, margin: "0 auto" },
  ctaTitle: { fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", margin: "0 0 14px" },
  ctaSub: { fontSize: 16, color: "#9098c0", margin: "0 0 36px" },

  // Footer
  footer: { borderTop: "1px solid rgba(255,255,255,0.06)", padding: "36px 32px" },
  footerInner: { maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  footerText: { fontSize: 13, color: "#4a5280", margin: 0 },
};