import { useState } from "react";
import axios from "axios";
import "../auth.css";

export default function Signup() {
  const [role, setRole] = useState("freelancer");
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: ""
  });

  const handleSignup = async () => {
    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      await axios.post("http://localhost:5001/signup", {
        name: form.name,
        email: form.email,
        password: form.password,
        role
      });

      alert("Signup success");
      window.location.href = "/";
    } catch {
      alert("Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="left">
        <h2>FreelanceHub</h2>
        <h1>
          Join the future of <span>freelancing</span>
        </h1>
      </div>

      <div className="card">
        <h2>Create account</h2>

        <div className="role-toggle">
          <button
            className={role === "freelancer" ? "active" : ""}
            onClick={() => setRole("freelancer")}
          >
            Freelancer
          </button>

          <button
            className={role === "client" ? "active" : ""}
            onClick={() => setRole("client")}
          >
            Client
          </button>
        </div>

        <input
          placeholder="Full Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div className="input-group">
          <input
            type={show ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span onClick={() => setShow(!show)}>👁️</span>
        </div>

        <div className="input-group">
          <input
            type={show2 ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
          <span onClick={() => setShow2(!show2)}>👁️</span>
        </div>

        <button onClick={handleSignup}>Sign Up</button>

        <div className="social">
          <button>Google</button>
          <button>GitHub</button>
        </div>

        <p>
          Already have account? <a href="/">Login</a>
        </p>
      </div>
    </div>
  );
}