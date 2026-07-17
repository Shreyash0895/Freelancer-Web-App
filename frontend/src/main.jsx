import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

// ── Global Error Boundary — catches blank screen crashes ──
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#07080f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: 20,
        }}>
          <div style={{
            background: "#0d0f1e",
            border: "1px solid rgba(248,113,113,0.3)",
            borderRadius: 16,
            padding: "40px",
            maxWidth: 480,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: "#f0f0ff", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#7a83aa", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);