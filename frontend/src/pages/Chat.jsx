import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

const ROOM = "global";
let socket = null;

export default function Chat() {
  const [messages,  setMessages]  = useState([]);
  const [msg,       setMsg]       = useState("");
  const [connected, setConnected] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const bottomRef = useRef(null);
  const email     = localStorage.getItem("email") || "Anonymous";

  useEffect(() => {
    // ── Step 4: Load chat history from MongoDB ──
    API.get(`/messages/${ROOM}`)
      .then(r => setMessages(r.data))
      .catch(() => showToast("error", "Could not load chat history"))
      .finally(() => setLoading(false));

    // ── Connect socket with room query ──
    socket = io("http://localhost:5001", {
      transports: ["websocket"],
      query: { room: ROOM },
    });

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // History from server (on connect)
    socket.on("chatHistory", (history) => {
      setMessages(history);
      setLoading(false);
    });

    // New incoming message from others
    socket.on("receiveMessage", (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("chatHistory");
      socket.disconnect();
      socket = null;
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    if (!msg.trim() || !socket) return;

    const payload = {
      text:   msg.trim(),
      sender: email,
      time:   new Date().toISOString(),
    };

    // Optimistically add own message to UI
    setMessages(prev => [...prev, { ...payload, own: true }]);
    socket.emit("sendMessage", payload);
    setMsg("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.inner}>

          {/* Header */}
          <div style={s.topbar}>
            <div>
              <h1 style={s.title}>Live Chat</h1>
              <p style={s.subtitle}>Real-time messaging · Messages are saved</p>
            </div>
            <div style={{ ...s.statusBadge, ...(connected ? s.online : s.offline) }}>
              <span style={{ ...s.dot, background: connected ? "#34d399" : "#f87171" }} />
              {connected ? "Connected" : "Connecting..."}
            </div>
          </div>

          {/* Chat window */}
          <div style={s.chatWindow}>

            {/* Messages */}
            <div style={s.messages} id="chat-messages">
              {loading ? (
                <div style={s.centerMsg}>
                  <div style={s.spinner} />
                  <p style={{ color: "#4a5280", marginTop: 12, fontSize: 14 }}>Loading chat history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={s.centerMsg}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
                  <p style={{ color: "#4a5280", fontSize: 15 }}>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <Bubble key={m._id || i} message={m} own={m.own || m.sender === email} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form style={s.inputBar} onSubmit={send}>
              <input
                style={s.input}
                placeholder="Type a message... (Enter to send)"
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="off"
                onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                onBlur={e => Object.assign(e.target.style, s.input)}
              />
              <button
                type="submit"
                disabled={!msg.trim()}
                style={msg.trim() ? s.sendBtn : { ...s.sendBtn, opacity: 0.4, cursor: "not-allowed" }}
              >
                ➤
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}

function Bubble({ message: m, own }) {
  const time = m.time || m.createdAt
    ? new Date(m.time || m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div style={{ ...s.bubbleWrap, justifyContent: own ? "flex-end" : "flex-start" }}>
      {!own && (
        <div style={s.avatarCircle}>
          {(m.sender || "?")[0].toUpperCase()}
        </div>
      )}
      <div style={own ? s.bubbleOwn : s.bubbleOther}>
        {!own && <div style={s.bubbleSender}>{m.sender?.split("@")[0]}</div>}
        <div style={s.bubbleText}>{m.text}</div>
        {time && <div style={s.bubbleTime}>{time}</div>}
      </div>
    </div>
  );
}

const s = {
  layout:   { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f" },
  main:     { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "radial-gradient(ellipse at 10% 10%, rgba(108,99,255,0.06) 0%, transparent 55%), #07080f" },
  inner:    { padding: "44px 52px", flex: 1, display: "flex", flexDirection: "column", maxWidth: 1000 },

  topbar:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  title:    { fontSize: 34, fontWeight: 800, color: "#f0f0ff", margin: "0 0 6px", letterSpacing: "-1px", fontFamily: "Georgia, serif" },
  subtitle: { fontSize: 15, color: "#7a83aa", margin: 0 },

  statusBadge: { display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)", background: "#0d0f1e", fontSize: 13, fontWeight: 500 },
  online:      { color: "#34d399", borderColor: "rgba(52,211,153,0.25)" },
  offline:     { color: "#7a83aa" },
  dot:         { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },

  chatWindow: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#0d0f1e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    height: "calc(100vh - 230px)",
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "28px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  centerMsg: {
    margin: "auto",
    textAlign: "center",
    color: "#4a5280",
  },

  bubbleWrap: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
  },

  avatarCircle: {
    width: 34, height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6c63ff, #f472b6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#fff",
    flexShrink: 0,
  },

  bubbleOther: {
    maxWidth: "58%",
    padding: "12px 16px",
    borderRadius: "16px 16px 16px 4px",
    background: "#181c35",
    border: "1px solid rgba(255,255,255,0.07)",
  },

  bubbleOwn: {
    maxWidth: "58%",
    padding: "12px 16px",
    borderRadius: "16px 16px 4px 16px",
    background: "linear-gradient(135deg, #6c63ff, #8b83ff)",
  },

  bubbleSender: { fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 5 },

  bubbleText: { fontSize: 14, lineHeight: 1.55, color: "#f0f0ff", wordBreak: "break-word" },

  bubbleTime: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6, textAlign: "right" },

  inputBar: {
    display: "flex",
    gap: 12,
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    background: "#0a0b14",
  },

  input: {
    flex: 1,
    background: "#13162a",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 12,
    padding: "13px 18px",
    color: "#f0f0ff",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  inputFocus: {
    flex: 1,
    background: "#181c35",
    border: "1px solid #6c63ff",
    borderRadius: 12,
    padding: "13px 18px",
    color: "#f0f0ff",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    boxShadow: "0 0 0 3px rgba(108,99,255,0.15)",
  },

  sendBtn: {
    width: 48, height: 48,
    borderRadius: 12,
    background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
    color: "#fff",
    fontSize: 17,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 14px rgba(108,99,255,0.35)",
  },

  spinner: {
    width: 28, height: 28,
    border: "3px solid rgba(255,255,255,0.08)",
    borderTopColor: "#6c63ff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    margin: "0 auto",
  },
};