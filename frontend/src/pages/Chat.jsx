import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { showToast } from "../utils/toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

let socket = null;

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [chats,        setChats]        = useState([]);
  const [activeRoom,   setActiveRoom]   = useState(null); // { room, projectTitle, otherParty }
  const [messages,     setMessages]     = useState([]);
  const [msg,          setMsg]          = useState("");
  const [connected,    setConnected]    = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);

  const bottomRef = useRef(null);
  const email     = localStorage.getItem("email") || "Anonymous";
  const token     = localStorage.getItem("token") || "";

  // ── Load conversation list ──
  useEffect(() => {
    API.get("/my-chats")
      .then(r => {
        const list = [
          { room: "global", projectTitle: "Global Chat", otherParty: "Everyone", isGlobal: true },
          ...r.data,
        ];
        setChats(list);

        // Auto-select from URL param or first project chat
        const projectIdParam = searchParams.get("project");
        if (projectIdParam) {
          const match = list.find(c => c.projectId === projectIdParam);
          if (match) { setActiveRoom(match); return; }
        }
        setActiveRoom(list[0]);
      })
      .catch(() => showToast("error", "Could not load conversations"))
      .finally(() => setLoadingChats(false));
  }, []);

  // ── Connect socket when active room changes ──
  useEffect(() => {
    if (!activeRoom) return;

    setLoadingMsgs(true);
    setMessages([]);

    // Load history via REST first
    API.get(`/messages/${activeRoom.room}`)
      .then(r => setMessages(r.data))
      .catch(() => showToast("error", "Could not load messages"))
      .finally(() => setLoadingMsgs(false));

    // Connect socket scoped to this room
    if (socket) socket.disconnect();
    socket = io(BASE_URL, {
      transports: ["websocket"],
      query: { room: activeRoom.room, token },
    });

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("authError", (msg) => showToast("error", msg));

    socket.on("chatHistory", (history) => {
      setMessages(history);
      setLoadingMsgs(false);
    });

    socket.on("receiveMessage", (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket?.off("receiveMessage");
      socket?.off("chatHistory");
      socket?.disconnect();
      socket = null;
    };
  }, [activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    if (!msg.trim() || !socket || !activeRoom) return;

    const payload = { text: msg.trim(), sender: email, time: new Date().toISOString() };
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
        <div style={s.chatLayout}>

          {/* ── Left: Conversation list ── */}
          <div style={s.convList}>
            <div style={s.convHeader}>
              <h2 style={s.convTitle}>Messages</h2>
              <p style={s.convSub}>{chats.length - 1} private chat{chats.length - 1 !== 1 ? "s" : ""}</p>
            </div>

            {loadingChats ? (
              <div style={s.centerSmall}><div style={s.spinner} /></div>
            ) : (
              <div style={s.convScroll}>
                {chats.map(c => (
                  <button
                    key={c.room}
                    onClick={() => setActiveRoom(c)}
                    style={{
                      ...s.convItem,
                      ...(activeRoom?.room === c.room ? s.convItemActive : {}),
                    }}
                  >
                    <div style={s.convAvatar}>
                      {c.isGlobal ? "🌐" : (c.otherParty || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={s.convName}>
                        {c.isGlobal ? "Global Chat" : c.projectTitle}
                      </div>
                      <div style={s.convPreview}>
                        {c.isGlobal
                          ? "Public room for everyone"
                          : (c.lastMessage || `Chat with ${c.otherParty?.split("@")[0]}`)
                        }
                      </div>
                    </div>
                  </button>
                ))}

                {chats.length === 1 && (
                  <div style={{ padding: "20px 16px", textAlign: "center" }}>
                    <p style={{ color: "var(--text3)", fontSize: 13, lineHeight: 1.6 }}>
                      Private chats unlock automatically once a bid is accepted on a project.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Active conversation ── */}
          <div style={s.threadPane}>
            {!activeRoom ? (
              <div style={s.centerMsg}>
                <p style={{ color: "#4a5280" }}>Select a conversation</p>
              </div>
            ) : (
              <>
                <div style={s.topbar}>
                  <div>
                    <h1 style={s.title}>
                      {activeRoom.isGlobal ? "Global Chat" : activeRoom.projectTitle}
                    </h1>
                    <p style={s.subtitle}>
                      {activeRoom.isGlobal
                        ? "Public · everyone can see this"
                        : `Private chat with ${activeRoom.otherParty}`
                      }
                    </p>
                  </div>
                  <div style={{ ...s.statusBadge, ...(connected ? s.online : s.offline) }}>
                    <span style={{ ...s.dot, background: connected ? "#34d399" : "#f87171" }} />
                    {connected ? "Connected" : "Connecting..."}
                  </div>
                </div>

                <div style={s.chatWindow}>
                  <div style={s.messages}>
                    {loadingMsgs ? (
                      <div style={s.centerMsg}>
                        <div style={s.spinner} />
                        <p style={{ color: "#4a5280", marginTop: 12, fontSize: 14 }}>Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={s.centerMsg}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>
                          {activeRoom.isGlobal ? "🌐" : "🔒"}
                        </div>
                        <p style={{ color: "#4a5280", fontSize: 15 }}>
                          {activeRoom.isGlobal
                            ? "No messages yet. Start the conversation!"
                            : "This is the start of your private conversation."
                          }
                        </p>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <Bubble key={m._id || i} message={m} own={m.own || m.sender === email} />
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <form style={s.inputBar} onSubmit={send}>
                    <input
                      style={s.input}
                      placeholder={activeRoom.isGlobal ? "Message everyone..." : `Message ${activeRoom.otherParty?.split("@")[0]}...`}
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
              </>
            )}
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
      {!own && <div style={s.avatarCircle}>{(m.sender || "?")[0].toUpperCase()}</div>}
      <div style={own ? s.bubbleOwn : s.bubbleOther}>
        {!own && <div style={s.bubbleSender}>{m.sender?.split("@")[0]}</div>}
        <div style={s.bubbleText}>{m.text}</div>
        {time && <div style={s.bubbleTime}>{time}</div>}
      </div>
    </div>
  );
}

const s = {
  layout: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#07080f" },
  main:   { flex: 1, display: "flex", overflow: "hidden", background: "radial-gradient(ellipse at 10% 10%, rgba(108,99,255,0.06) 0%, transparent 55%), #07080f" },
  chatLayout: { display: "flex", flex: 1, height: "100vh" },

  // ── Conversation list ──
  convList:   { width: 320, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", background: "#0a0b14" },
  convHeader: { padding: "28px 24px 16px" },
  convTitle:  { fontSize: 24, fontWeight: 800, color: "#f0f0ff", margin: "0 0 4px", fontFamily: "Georgia, serif" },
  convSub:    { fontSize: 13, color: "#7a83aa", margin: 0 },
  convScroll: { flex: 1, overflowY: "auto", padding: "8px 12px" },
  convItem: {
    display: "flex", alignItems: "center", gap: 12, width: "100%",
    padding: "12px", borderRadius: 12, border: "none", background: "transparent",
    cursor: "pointer", marginBottom: 4, textAlign: "left",
  },
  convItemActive: { background: "rgba(108,99,255,0.15)" },
  convAvatar: {
    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg, #6c63ff, #f472b6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 700, color: "#fff",
  },
  convName:    { fontSize: 14, fontWeight: 600, color: "#f0f0ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  convPreview: { fontSize: 12, color: "#7a83aa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 },

  // ── Thread pane ──
  threadPane: { flex: 1, display: "flex", flexDirection: "column", padding: "32px 40px", overflow: "hidden" },
  topbar:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  title:    { fontSize: 26, fontWeight: 800, color: "#f0f0ff", margin: "0 0 4px", fontFamily: "Georgia, serif" },
  subtitle: { fontSize: 14, color: "#7a83aa", margin: 0 },

  statusBadge: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)", background: "#0d0f1e", fontSize: 12, fontWeight: 500 },
  online:  { color: "#34d399", borderColor: "rgba(52,211,153,0.25)" },
  offline: { color: "#7a83aa" },
  dot:     { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },

  chatWindow: { flex: 1, display: "flex", flexDirection: "column", background: "#0d0f1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" },
  messages:   { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 },
  centerMsg:  { margin: "auto", textAlign: "center", color: "#4a5280" },
  centerSmall:{ display: "flex", justifyContent: "center", padding: "30px 0" },

  bubbleWrap: { display: "flex", alignItems: "flex-end", gap: 10 },
  avatarCircle: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 },
  bubbleOther: { maxWidth: "60%", padding: "11px 15px", borderRadius: "16px 16px 16px 4px", background: "#181c35", border: "1px solid rgba(255,255,255,0.07)" },
  bubbleOwn:   { maxWidth: "60%", padding: "11px 15px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg, #6c63ff, #8b83ff)" },
  bubbleSender:{ fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 4 },
  bubbleText:  { fontSize: 14, lineHeight: 1.5, color: "#f0f0ff", wordBreak: "break-word" },
  bubbleTime:  { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 5, textAlign: "right" },

  inputBar: { display: "flex", gap: 12, padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0a0b14" },
  input:    { flex: 1, background: "#13162a", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "12px 16px", color: "#f0f0ff", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  inputFocus: { flex: 1, background: "#181c35", border: "1px solid #6c63ff", borderRadius: 12, padding: "12px 16px", color: "#f0f0ff", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 0 0 3px rgba(108,99,255,0.15)" },
  sendBtn: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6c63ff, #a78bfa)", color: "#fff", fontSize: 16, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(108,99,255,0.35)" },

  spinner: { width: 26, height: 26, border: "3px solid rgba(255,255,255,0.08)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" },
};