import { useState } from "react";
import API from "../api/api";

export default function PostProject() {
  const [data, setData] = useState({
    title: "",
    description: "",
    budget: ""
  });

  const handleSubmit = async () => {
    await API.post("/projects", data);
    alert("Project Posted 🚀");
  };

  return (
    <div className="card">
      <h2>Post a Project</h2>

      <input placeholder="Title"
        onChange={e => setData({...data, title: e.target.value})}
      />

      <textarea placeholder="Description"
        onChange={e => setData({...data, description: e.target.value})}
      />

      <input placeholder="Budget"
        onChange={e => setData({...data, budget: e.target.value})}
      />

      <button onClick={handleSubmit}>Post</button>
    </div>
  );
}