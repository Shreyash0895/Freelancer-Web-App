import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [projects] = useState([
    {
      title: "Build React Portfolio Website",
      budget: "$300",
      skills: "React, CSS, Responsive UI",
      proposals: 12,
    },
    {
      title: "Node.js Backend API",
      budget: "$500",
      skills: "Node.js, MongoDB, JWT",
      proposals: 8,
    },
  ]);

  // CHAT
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hello! Project update?",
      type: "received",
    },
  ]);

  const sendMessage = () => {
    if (message.trim() === "") return;

    setMessages([
      ...messages,
      {
        text: message,
        type: "sent",
      },
    ]);

    setMessage("");
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div>
          <div className="logo">FreelanceHub</div>

          <nav>
            <button onClick={() => navigate("/dashboard")}>
              🏠 Dashboard
            </button>

            <button onClick={() => navigate("/projects")}>
              📁 Projects
            </button>

            <button onClick={() => navigate("/chat")}>
              💬 Messages
            </button>

            <button onClick={() => navigate("/payments")}>
              💳 Payments
            </button>

            <button onClick={() => navigate("/profile")}>
              👤 Profile
            </button>
          </nav>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <div>
            <h1>Welcome Back 👋</h1>
            <p>Manage projects and freelancers easily.</p>
          </div>

          <div className="profile-box">
            <img
              src="https://i.pravatar.cc/100"
              alt="profile"
            />

            <div>
              <h4>Shreyash</h4>
              <span>Client</span>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <h2>12</h2>
            <p>Active Projects</p>
          </div>

          <div className="stat-card">
            <h2>38</h2>
            <p>Total Freelancers</p>
          </div>

          <div className="stat-card">
            <h2>$4.2K</h2>
            <p>Total Spent</p>
          </div>

        </div>

        {/* PROJECTS */}
        <div className="section-header">
          <h2>Recent Projects</h2>

          <button>
            + Post Project
          </button>
        </div>

        <div className="project-grid">

          {projects.map((project, index) => (
            <div className="project-card" key={index}>

              <h3>{project.title}</h3>

              <p className="skills">
                {project.skills}
              </p>

              <div className="project-footer">
                <span>{project.budget}</span>
                <span>
                  {project.proposals} Proposals
                </span>
              </div>

              <button className="view-btn">
                View Details
              </button>

            </div>
          ))}

        </div>

        {/* CHAT */}
        <div className="chat-box">

          <div className="chat-header">
            💬 Team Chat
          </div>

          <div className="chat-messages">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.type}`}
              >
                {msg.text}
              </div>
            ))}

          </div>

          <div className="chat-input">

            <input
              type="text"
              placeholder="Type message..."
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
            />

            <button onClick={sendMessage}>
              Send
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}