import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";

let socket = null;

export default function Chat() {
  const [messages,  setMessages]  = useState([]);
  const [msg,       setMsg]       = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const email     = localStorage.getItem("email") || "Anonymous";

  useEffect(() => {
    socket = io("http://localhost:5001", { transports: ["websocket"] });

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("receiveMessage", (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
      socket = null;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    if (!msg.trim() || !socket) return;
    const payload = { text: msg.trim(), sender: email, time: new Date().toISOString() };
    socket.emit("sendMessage", payload);
    // Optimistically add own message
    setMessages(prev => [...prev, { ...payload, own: true }]);
    setMsg("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display:"flex", flexDirection:"column" }}>
        <div className="page-inner" style={{ flex:1, display:"flex", flexDirection:"column", paddingBottom:0 }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, letterSpacing:"-0.8px" }}>
                Live Chat
              </h1>
              <p style={{ color:"var(--text2)", marginTop:4, fontSize:15 }}>
                Real-time messaging with your team
              </p>
            </div>
            <div className={`chat-status ${connected ? "online" : "offline"}`}>
              <span className="status-dot" />
              {connected ? "Connected" : "Connecting..."}
            </div>
          </div>

          {/* Chat window */}
          <div className="chat-window">
            <div className="chat-messages" id="chatMessages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <div style={{ fontSize:36, marginBottom:12 }}>◎</div>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <ChatBubble key={i} message={m} own={m.own || m.sender === email} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input-bar" onSubmit={send}>
              <input
                className="chat-input"
                placeholder="Type a message... (Enter to send)"
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="off"
              />
              <button type="submit" className="chat-send-btn" disabled={!msg.trim()}>
                ➤
              </button>
            </form>
          </div>
        </div>
      </main>

      <style>{chatStyles}</style>
    </div>
  );
}

function ChatBubble({ message: m, own }) {
  const time = m.time ? new Date(m.time).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "";
  return (
    <div className={`chat-bubble-wrap ${own ? "own" : "other"}`}>
      {!own && <div className="chat-avatar">{(m.sender || "?")[0].toUpperCase()}</div>}
      <div className={`chat-bubble ${own ? "own" : "other"}`}>
        {!own && <div className="bubble-sender">{m.sender?.split("@")[0]}</div>}
        <div className="bubble-text">{m.text}</div>
        {time && <div className="bubble-time">{time}</div>}
      </div>
    </div>
  );
}

const chatStyles = `
.chat-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border2);
  background: var(--bg2);
}
.chat-status.online  { color: var(--green); border-color: rgba(52,211,153,0.25); }
.chat-status.offline { color: var(--text3); }
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100% { opacity:1; }
  50%      { opacity:0.4; }
}
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 220px);
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chat-empty {
  margin: auto;
  text-align: center;
  color: var(--text3);
  font-size: 14px;
}
.chat-bubble-wrap {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
.chat-bubble-wrap.own { flex-direction: row-reverse; }
.chat-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--pink));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.chat-bubble {
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 16px;
}
.chat-bubble.other {
  background: var(--surface);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.chat-bubble.own {
  background: linear-gradient(135deg, var(--accent), #8b83ff);
  border-bottom-right-radius: 4px;
}
.bubble-sender {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent2);
  margin-bottom: 4px;
}
.bubble-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  word-break: break-word;
}
.bubble-time {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  margin-top: 6px;
  text-align: right;
}
.chat-input-bar {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg3);
}
.chat-input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text);
  font-size: 14px;
  transition: border-color 0.2s;
}
.chat-input:focus {
  outline: none;
  border-color: var(--accent);
}
.chat-input::placeholder { color: var(--text3); }
.chat-send-btn {
  width: 46px; height: 46px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chat-send-btn:hover:not(:disabled) {
  background: #7c74ff;
  transform: translateY(-1px);
}
.chat-send-btn:disabled { opacity:0.4; cursor:not-allowed; }
`;