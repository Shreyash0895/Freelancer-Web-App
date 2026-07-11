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

  const [estimate, setEstimate] = useState(null);

const getEstimate = async () => {
  if (!data.title || !data.description) {
    showToast("error", "Fill in title and description first");
    return;
  }
  try {
    const res = await API.post("/ai/estimate-project", data);
    setEstimate(res.data);
  } catch {
    showToast("error", "Estimation failed");
  }
};

// Show result:
{estimate && (
  <div style={estimateBox}>
    <p>⏱ Timeline: <strong>{estimate.timeline}</strong></p>
    <p>💰 Budget range: <strong>${estimate.budgetMin}–${estimate.budgetMax}</strong></p>
    <p>📊 Complexity: <strong>{estimate.complexity}</strong></p>
    <ul>{estimate.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
  </div>
)}

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