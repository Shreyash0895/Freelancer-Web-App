import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const TYPE_ICON = {
  bid:      { icon:"💰", color:"#fbbf24" },
  accepted: { icon:"🎉", color:"#34d399" },
  payment:  { icon:"💳", color:"#22d3ee" },
  file:     { icon:"📎", color:"#a78bfa" },
  review:   { icon:"⭐", color:"#f472b6" },
  meeting:  { icon:"📹", color:"#22d3ee" },
  default:  { icon:"🔔", color:"#818cf8" },
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [open,          setOpen]          = useState(false);
  const panelRef    = useRef(null);
  const bellRef     = useRef(null);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // don't fetch if not logged in
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current  && !bellRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const markAllRead = async () => {
    if (unread === 0) return;
    try {
      await API.put("/notifications/read");
      setNotifications(prev => prev.map(n => ({ ...n, read:true })));
      setUnread(0);
    } catch {}
  };

  const handleClick = async (notif) => {
    setOpen(false);
    if (!notif.read) await markAllRead();
    if (notif.link) navigate(notif.link);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  return (
    <div style={{ position:"relative" }}>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        style={{ ...s.bell, ...(open ? s.bellActive : {}) }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <span style={{ fontSize:15, lineHeight:1 }}>🔔</span>
        {unread > 0 && (
          <span style={s.badge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div ref={panelRef} style={s.panel} className="notif-panel">
          <div style={s.panelHeader}>
            <h3 style={s.panelTitle}>Notifications</h3>
            {unread > 0 && (
              <button style={s.markReadBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div style={s.list}>
            {notifications.length === 0 ? (
              <div style={{ padding:"32px 16px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🔕</div>
                <p style={{ color:"var(--text3)", fontSize:13, margin:0 }}>
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map(n => {
                const meta = TYPE_ICON[n.type] || TYPE_ICON.default;
                return (
                  <button
                    key={n._id}
                    style={{ ...s.notifItem, ...(n.read ? {} : s.unread) }}
                    onClick={() => handleClick(n)}
                  >
                    <div style={{ ...s.notifIcon, background:`${meta.color}18`, border:`1px solid ${meta.color}30` }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={s.notifMsg}>{n.message}</p>
                      <p style={s.notifTime}>{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span style={s.unreadDot} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  bell:        { position:"relative", width:34, height:34, borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 },
  bellActive:  { background:"rgba(108,99,255,0.15)", borderColor:"rgba(108,99,255,0.4)" },
  badge:       { position:"absolute", top:-5, right:-5, minWidth:18, height:18, borderRadius:9, background:"linear-gradient(135deg,#f472b6,#e11d48)", color:"#fff", fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", border:"2px solid #0a0b14", animation:"badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)" },

  panel:       { position:"absolute", bottom:0, left:"calc(100% + 12px)", width:320, maxHeight:440, background:"#0d0f1e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, boxShadow:"0 24px 64px rgba(0,0,0,0.6)", overflow:"hidden", display:"flex", flexDirection:"column", zIndex:200 },
  panelHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 },
  panelTitle:  { fontSize:14, fontWeight:700, color:"var(--text)", margin:0 },
  markReadBtn: { background:"none", border:"none", color:"#818cf8", fontSize:12, fontWeight:600, cursor:"pointer", padding:"3px 6px", borderRadius:6, fontFamily:"inherit" },

  list:        { overflowY:"auto", flex:1 },
  notifItem:   { width:"100%", display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer", textAlign:"left", transition:"background 0.15s", fontFamily:"'DM Sans',sans-serif" },
  unread:      { background:"rgba(108,99,255,0.07)" },
  notifIcon:   { width:34, height:34, borderRadius:9, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, lineHeight:1 },
  notifMsg:    { fontSize:12, color:"var(--text2)", lineHeight:1.5, margin:"0 0 3px", wordBreak:"break-word" },
  notifTime:   { fontSize:10, color:"var(--text3)", margin:0 },
  unreadDot:   { width:6, height:6, borderRadius:"50%", background:"#818cf8", flexShrink:0, marginTop:6 },
};