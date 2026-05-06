import { useState } from "react";
import axios from "axios";
import "../auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5001/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      alert("Login success");
      window.location.href = "/dashboard";
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="left">
        <h2>FreelanceHub</h2>
        <h1>
          Find the perfect <span>freelance services</span>
        </h1>
        <p>Connect with top freelancers worldwide</p>
      </div>

      <div className="card">
        <h2>Welcome back</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="input-group">
          <input
            type={show ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={() => setShow(!show)}>
            {show ? "🙈" : "👁️"}
          </span>
        </div>

        <button onClick={handleLogin}>Sign In</button>

        <p>
          Don't have account? <a href="/signup">Signup</a>
        </p>
      </div>
    </div>
  );
}