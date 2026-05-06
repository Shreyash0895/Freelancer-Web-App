import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

export default function Chat() {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages(prev => [...prev, data]);
    });
  }, []);

  const send = () => {
    socket.emit("sendMessage", msg);
    setMsg("");
  };

  return (
    <div className="chat-box">
      <h2>Live Chat</h2>

      <div className="messages">
        {messages.map((m, i) => <p key={i}>{m}</p>)}
      </div>

      <input value={msg} onChange={e => setMsg(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}