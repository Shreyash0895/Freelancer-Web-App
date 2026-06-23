import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const TYPE_ICON = {
  bid:      { icon: "💰", color: "#fbbf24" },
  accepted: { icon: "🎉", color: "#34d399" },
  payment:  { icon: "💳", color: "#22d3ee" },
  file:     { icon: "📎", color: "#a78bfa" },
  review:   { icon: "⭐", color: "#f472b6" },
  default:  { icon: "🔔", color: "#818cf8" },
};

export default function NotificationBell() {
  const navigate  = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread,   setUnread]   = useState(0);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const panelRef   = useRef(null);
  const bellRef    = useRef(null);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    } catch {
      // silently fail — bell is non-critical
    }
  }, []);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        bellRef.current   && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggleOpen = () => setOpen(prev => !prev);

  const markAllRead = async () => {
    if (unread === 0) return;
    try {
      await API.put("/notifications/read");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const handleNotifClick = async (notif) => {
    setOpen(false);
    // Mark all read when user opens a notification
    if (!notif.read) {
      await markAllRead();
    }
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

  const { icon: bellIcon } = unread > 0 ? { icon: "🔔" } : { icon: "🔕" };

  return (
    <div style={s.wrap}>
      {/* ── Bell button ── */}
      <button
        ref={bellRef}
        onClick={toggleOpen}
        style={{ ...s.bell, ...(open ? s.bellActive : {}) }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        title="Notifications"
      >
        <span style={s.bellIcon}>🔔</span>
        {unread > 0 && (
          <span style={s.badge} aria-live="polite">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div ref={panelRef} style={s.panel}>
          {/* Header */}
          <div style={s.panelHeader}>
            <h3 style={s.panelTitle}>Notifications</h3>
            {unread > 0 && (
              <button style={s.markReadBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={s.list}>
            {notifications.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>🔕</div>
                <p style={s.emptyText}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_ICON[n.type] || TYPE_ICON.default;
                return (
                  <button
                    key={n._id}
                    style={{
                      ...s.notifItem,
                      ...(n.read ? {} : s.notifUnread),
                    }}
                    onClick={() => handleNotifClick(n)}
                  >
                    <div style={{ ...s.notifIconWrap, background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
                      <span style={s.notifIconEmoji}>{meta.icon}</span>
                    </div>
                    <div style={s.notifBody}>
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
  wrap: { position: "relative" },

  bell: {
    position: "relative",
    width: 36, height: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s",
  },
  bellActive: {
    background: "rgba(108,99,255,0.15)",
    borderColor: "rgba(108,99,255,0.4)",
  },
  bellIcon: { fontSize: 16, lineHeight: 1 },

  badge: {
    position: "absolute",
    top: -5, right: -5,
    minWidth: 18, height: 18,
    borderRadius: 9,
    background: "linear-gradient(135deg, #f472b6, #e11d48)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #0a0b14",
    fontFamily: "system-ui, sans-serif",
    animation: "badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  panel: {
    position: "absolute",
    bottom: 0,
    left: "calc(100% + 12px)",
    width: 340,
    maxHeight: 460,
    background: "#0d0f1e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    zIndex: 200,
  },

  panelHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 18px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: 15, fontWeight: 700, color: "#f0f0ff", margin: 0,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  markReadBtn: {
    background: "none", border: "none",
    color: "#818cf8", fontSize: 12, fontWeight: 600,
    cursor: "pointer", padding: "4px 8px", borderRadius: 6,
    fontFamily: "inherit",
  },

  list: { overflowY: "auto", flex: 1 },

  empty: { padding: "40px 20px", textAlign: "center" },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyText: { color: "#4a5280", fontSize: 14, margin: 0 },

  notifItem: {
    width: "100%", display: "flex", alignItems: "flex-start",
    gap: 12, padding: "14px 18px",
    background: "transparent", border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer", textAlign: "left",
    transition: "background 0.15s",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  notifUnread: { background: "rgba(108,99,255,0.07)" },

  notifIconWrap: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  notifIconEmoji: { fontSize: 16, lineHeight: 1 },

  notifBody: { flex: 1, minWidth: 0 },
  notifMsg: {
    fontSize: 13, color: "#d4d8f0", lineHeight: 1.5,
    margin: "0 0 4px", wordBreak: "break-word",
  },
  notifTime: { fontSize: 11, color: "#4a5280", margin: 0 },

  unreadDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#818cf8", flexShrink: 0, marginTop: 6,
  },
};