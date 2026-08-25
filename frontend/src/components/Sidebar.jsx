import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const NAV = [
  { path: "/dashboard", icon: "◈", label: "Dashboard"  },
  { path: "/projects",  icon: "◉", label: "Projects"   },
  { path: "/chat",      icon: "◎", label: "Messages"   },
  { path: "/payments",  icon: "◇", label: "Payments"   },
  { path: "/analytics", icon: "▦", label: "Analytics"  },
  { path: "/invoice",   icon: "◻", label: "Invoices"   },
  { path: "/profile",   icon: "⬡", label: "Profile"    },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = localStorage.getItem("email") || "";
  const role     = localStorage.getItem("role")  || "user";
  const initial  = (email[0] || "U").toUpperCase();

  const handleLogout = () => {
    // ✅ Clear ALL data on logout — prevents next user seeing old data
    localStorage.clear();
    // ✅ Force full page reload so React state is completely reset
    window.location.href = "/";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Freelance<span>Hub</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ path, icon, label }) => (
          <a
            key={path}
            href={path}
            onClick={(e) => { e.preventDefault(); navigate(path); }}
            className={location.pathname === path ? "active" : ""}
            title={label}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </a>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {/* User info + bell */}
        <div style={s.userRow}>
          <div style={s.avatar}>{initial}</div>
          <div style={s.userInfo}>
            <div style={s.userName}>{email.split("@")[0] || "User"}</div>
            <div style={s.userRole}>{role}</div>
          </div>
          <NotificationBell />
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <span>↩</span> Sign out
        </button>
      </div>
    </aside>
  );
}

const s = {
  userRow:  { display:"flex", alignItems:"center", gap:10, padding:"8px 4px 12px" },
  avatar:   { width:32, height:32, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#6c63ff,#f472b6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" },
  userInfo: { flex:1, minWidth:0 },
  userName: { fontSize:13, fontWeight:600, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  userRole: { fontSize:11, color:"var(--text3)", textTransform:"capitalize" },
};