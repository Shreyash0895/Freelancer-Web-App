import { useNavigate, useLocation } from "react-router-dom";

const NAV = [
  { path: "/dashboard", icon: "⬡", label: "Dashboard" },
  { path: "/projects",  icon: "◈", label: "Projects"  },
  { path: "/chat",      icon: "◎", label: "Messages"  },
  { path: "/payments",  icon: "◇", label: "Payments"  },
  { path: "/profile",   icon: "◉", label: "Profile"   },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = localStorage.getItem("email") || "";
  const role      = localStorage.getItem("role")  || "user";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Freelance<span>Hub</span></div>

      <nav className="sidebar-nav">
        {NAV.map(({ path, icon, label }) => (
          <a
            key={path}
            href={path}
            onClick={(e) => { e.preventDefault(); navigate(path); }}
            className={location.pathname === path ? "active" : ""}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </a>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div style={{ padding: "8px 14px 14px", fontSize: "12px", color: "var(--text3)" }}>
          <div style={{ color: "var(--text2)", fontWeight: 500, marginBottom: 2, fontSize: 13 }}>
            {email.split("@")[0] || "User"}
          </div>
          <div style={{ textTransform: "capitalize" }}>{role}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span>⬡</span> Sign out
        </button>
      </div>
    </aside>
  );
}