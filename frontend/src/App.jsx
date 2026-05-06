import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import Chat from "./pages/Chat";
import Payments from "./pages/Payments";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/chat"
          element={<Chat />}
        />

        <Route
          path="/payments"
          element={<Payments />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;