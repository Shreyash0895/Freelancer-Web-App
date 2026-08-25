import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";
import API from "../api/api";
import { BASE_URL } from "../api/api";
import { showToast } from "../utils/toast";

let socket = null;

export default function Chat() {
  const [searchParams]     = useSearchParams();
  const [chats,            setChats]            = useState([]);
  const [activeRoom,       setActiveRoom]        = useState(null);
  const [messages,         setMessages]          = useState([]);
  const [msg,              setMsg]               = useState("");
  const [connected,        setConnected]         = useState(false);
  const [loadingChats,     setLoadingChats]      = useState(true);
  const [loadingMsgs,      setLoadingMsgs]       = useState(false);
  const [startingMeeting,  setStartingMeeting]   = useState(false);

  const bottomRef = useRef(null);
  const email     = localStorage.getItem("email") || "Anonymous";
  const token     = localStorage.getItem("token") || "";

  // ── Load conversations ──
  useEffect(() => {
    API.get("/my-chats")
      .then(r => {
        const list = [
          { room:"global", projectTitle:"Global Chat", otherParty:"Everyone", isGlobal:true },
          ...(r.data || []),
        ];
        setChats(list);
        const pid = searchParams.get("project");
        if (pid) {
          const match = list.find(c => String(c.projectId) === pid);
          if (match) { setActiveRoom(match); return; }
        }
        setActiveRoom(list[0]);
      })
      .catch(() => {
        const fallback = [{ room:"global", projectTitle:"Global Chat", otherParty:"Everyone", isGlobal:true }];
        setChats(fallback);
        setActiveRoom(fallback[0]);
      })
      .finally(() => setLoadingChats(false));
  }, []);

  // ── Connect socket on room change ──
  useEffect(() => {
    if (!activeRoom) return;
    setLoadingMsgs(true);
    setMessages([]);

    API.get(`/messages/${activeRoom.room}`)
      .then(r => setMessages(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));

    if (socket) {
      socket.off("receiveMessage");
      socket.off("chatHistory");
      socket.off("authError");
      socket.disconnect();
    }

    socket = io(BASE_URL, {
      transports: ["websocket"],
      query: { room: activeRoom.room, token },
    });

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("authError",  (errMsg) => {
      showToast("error", errMsg || "Not authorized for this chat");
      setActiveRoom(chats[0]);
    });
    socket.on("chatHistory", (history) => {
      setMessages(history || []);
      setLoadingMsgs(false);
    });
    socket.on("receiveMessage", (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      if (socket) {
        socket.off("receiveMessage");
        socket.off("chatHistory");
        socket.off("authError");
        socket.disconnect();
        socket = null;
      }
    };
  }, [activeRoom?.room]);

  // ── Auto scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    if (!msg.trim() || !socket || !activeRoom) return;
    const payload = { text:msg.trim(), sender:email, time:new Date().toISOString() };
    setMessages(prev => [...prev, { ...payload, own:true }]);
    socket.emit("sendMessage", payload);
    setMsg("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const startMeeting = async () => {
    if (!activeRoom || activeRoom.isGlobal || !activeRoom.projectId) return;
    setStartingMeeting(true);
    try {
      const res = await API.post("/meetings/create", { projectId: activeRoom.projectId });
      window.open(res.data.url, "_blank");
      showToast("success", "Meeting started!");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Add DAILY_API_KEY to backend .env");
    } finally {
      setStartingMeeting(false);
    }
  };

  return (
    <div style={s.layout}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.chatLayout}>

          {/* ── Left panel ── */}
          <div style={s.convList}>
            <div style={s.convHeader}>
              <h2 style={s.convTitle}>Messages</h2>
              <p style={s.convSub}>{chats.filter(c => !c.isGlobal).length} private chats</p>
            </div>
            {loadingChats ? (
              <div style={{ padding:"16px 12px", display:"flex", flexDirection:"column", gap:8 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:52, borderRadius:10 }} />)}
              </div>
            ) : (
              <div style={s.convScroll}>
                {chats.map(c => (
                  <button key={c.room} onClick={() => setActiveRoom(c)}
                    style={{ ...s.convItem, ...(activeRoom?.room === c.room ? s.convActive : {}) }}>
                    <div style={{ ...s.convAvatar, background: c.isGlobal
                      ? "linear-gradient(135deg,#6c63ff,#22d3ee)"
                      : "linear-gradient(135deg,#f472b6,#6c63ff)" }}>
                      {c.isGlobal ? "🌐" : (c.otherParty||"?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                      <div style={s.convName}>{c.isGlobal ? "Global Chat" : c.projectTitle}</div>
                      <div style={s.convPreview}>
                        {c.isGlobal ? "Public — everyone" : c.lastMessage || `With ${c.otherParty?.split("@")[0]}`}
                      </div>
                    </div>
                    {activeRoom?.room === c.room && (
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }} />
                    )}
                  </button>
                ))}
                {chats.length === 1 && (
                  <p style={{ padding:"16px 14px", color:"var(--text3)", fontSize:12, lineHeight:1.6 }}>
                    Private chats unlock when a bid is accepted on a project.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Right panel ── */}
          <div style={s.thread}>
            {!activeRoom ? (
              <div style={s.center}><p style={{ color:"var(--text3)" }}>Select a conversation</p></div>
            ) : (
              <>
                {/* Topbar */}
                <div style={s.topbar}>
                  <div>
                    <h1 style={s.title}>{activeRoom.isGlobal ? "Global Chat" : activeRoom.projectTitle}</h1>
                    <p style={s.subtitle}>{activeRoom.isGlobal ? "Public · everyone" : `Private · ${activeRoom.otherParty}`}</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {!activeRoom.isGlobal && (
                      <button onClick={startMeeting} disabled={startingMeeting} style={s.meetingBtn}>
                        {startingMeeting ? <span className="spinner" style={{ width:14, height:14 }} /> : "📹"}
                        <span style={{ fontSize:13, marginLeft:6 }}>
                          {startingMeeting ? "Starting..." : "Meeting"}
                        </span>
                      </button>
                    )}
                    <div style={{ ...s.statusPill, ...(connected ? s.online : s.offline) }}>
                      <span style={{ ...s.dot, background: connected ? "#34d399" : "#f87171" }} />
                      {connected ? "Connected" : "Connecting..."}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={s.chatBox}>
                  <div style={s.msgs}>
                    {loadingMsgs ? (
                      <div style={s.center}>
                        <div className="spinner" style={{ width:28, height:28, margin:"0 auto 10px" }} />
                        <p style={{ color:"var(--text3)", fontSize:14 }}>Loading...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={s.center}>
                        <div style={{ fontSize:36, marginBottom:10 }}>{activeRoom.isGlobal ? "🌐" : "🔒"}</div>
                        <p style={{ color:"var(--text3)", fontSize:14 }}>
                          {activeRoom.isGlobal ? "No messages yet. Say hello!" : "Start of your private conversation."}
                        </p>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <Bubble key={m._id || i} message={m} own={m.own || m.sender === email} />
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <form style={s.inputRow} onSubmit={send}>
                    <input
                      style={s.input}
                      placeholder={activeRoom.isGlobal ? "Message everyone..." : `Message ${activeRoom.otherParty?.split("@")[0]}...`}
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      onKeyDown={handleKey}
                      autoComplete="off"
                    />
                    <button type="submit" disabled={!msg.trim()} style={msg.trim() ? s.sendBtn : { ...s.sendBtn, opacity:0.4, cursor:"not-allowed" }}>
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
  const time = (m.time || m.createdAt)
    ? new Date(m.time || m.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })
    : "";
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, justifyContent: own ? "flex-end" : "flex-start" }}>
      {!own && (
        <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#6c63ff,#f472b6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>
          {(m.sender||"?")[0].toUpperCase()}
        </div>
      )}
      <div style={own ? s.bubbleOwn : s.bubbleOther}>
        {!own && <div style={{ fontSize:11, fontWeight:700, color:"var(--accent2)", marginBottom:4 }}>{m.sender?.split("@")[0]}</div>}
        <div style={{ fontSize:14, lineHeight:1.5, color:"var(--text)", wordBreak:"break-word" }}>{m.text}</div>
        {time && <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:4, textAlign:"right" }}>{time}</div>}
      </div>
    </div>
  );
}

const s = {
  layout:     { display:"flex", minHeight:"100vh", background:"var(--bg)" },
  main:       { flex:1, display:"flex", overflow:"hidden", background:"radial-gradient(ellipse at 10% 10%, rgba(108,99,255,0.06) 0%, transparent 55%), var(--bg)" },
  chatLayout: { display:"flex", flex:1, height:"100vh" },

  convList:   { width:280, flexShrink:0, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--bg2)" },
  convHeader: { padding:"22px 18px 14px", borderBottom:"1px solid var(--border)" },
  convTitle:  { fontSize:18, fontWeight:800, color:"var(--text)", margin:"0 0 3px", fontFamily:"'Syne',sans-serif" },
  convSub:    { fontSize:12, color:"var(--text3)", margin:0 },
  convScroll: { flex:1, overflowY:"auto", padding:"8px 8px" },
  convItem:   { display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 10px", borderRadius:10, border:"none", background:"transparent", cursor:"pointer", marginBottom:2, transition:"background 0.15s" },
  convActive: { background:"rgba(108,99,255,0.12)" },
  convAvatar: { width:36, height:36, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff" },
  convName:   { fontSize:13, fontWeight:600, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  convPreview:{ fontSize:11, color:"var(--text3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginTop:2 },

  thread:  { flex:1, display:"flex", flexDirection:"column", padding:"22px 28px", overflow:"hidden" },
  topbar:  { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 },
  title:   { fontSize:20, fontWeight:800, color:"var(--text)", margin:"0 0 3px", fontFamily:"'Syne',sans-serif" },
  subtitle:{ fontSize:13, color:"var(--text3)", margin:0 },

  meetingBtn: { display:"flex", alignItems:"center", padding:"8px 14px", borderRadius:10, border:"1px solid rgba(34,211,238,0.3)", background:"rgba(34,211,238,0.08)", color:"var(--cyan)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" },

  statusPill:{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:100, border:"1px solid rgba(255,255,255,0.1)", background:"var(--bg2)", fontSize:12, fontWeight:500 },
  online:    { color:"#34d399", borderColor:"rgba(52,211,153,0.25)" },
  offline:   { color:"var(--text3)" },
  dot:       { width:6, height:6, borderRadius:"50%", flexShrink:0 },

  chatBox:   { flex:1, display:"flex", flexDirection:"column", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden" },
  msgs:      { flex:1, overflowY:"auto", padding:"18px", display:"flex", flexDirection:"column", gap:12 },
  center:    { margin:"auto", textAlign:"center" },

  bubbleOther: { maxWidth:"60%", padding:"10px 14px", borderRadius:"14px 14px 14px 3px", background:"var(--surface)", border:"1px solid var(--border)" },
  bubbleOwn:   { maxWidth:"60%", padding:"10px 14px", borderRadius:"14px 14px 3px 14px", background:"linear-gradient(135deg,#6c63ff,#8b83ff)" },

  inputRow:{ display:"flex", gap:10, padding:"12px 14px", borderTop:"1px solid var(--border)", background:"var(--bg3)" },
  input:   { flex:1, background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10, padding:"11px 14px", color:"var(--text)", fontSize:14, outline:"none", fontFamily:"inherit" },
  sendBtn: { width:42, height:42, borderRadius:10, background:"linear-gradient(135deg,#6c63ff,#a78bfa)", color:"#fff", fontSize:16, border:"none", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(108,99,255,0.35)" },
};