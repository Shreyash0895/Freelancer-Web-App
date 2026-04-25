import { useEffect, useState } from "react";
import API from "../api/api";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    API.get("/projects").then((res) => setProjects(res.data));
  }, []);

  return (
    <div className="glass p-6 rounded-xl">
      <h2 className="text-xl mb-4">Available Projects</h2>

      {projects.length === 0 ? (
        <p>No projects available</p>
      ) : (
        projects.map((p, i) => (
          <div key={i} className="border-b border-gray-700 py-3">
            <h3 className="font-bold">{p.title}</h3>
            <p className="text-sm text-gray-400">{p.description}</p>
            <p className="text-purple-400">💰 {p.budget}</p>
          </div>
        ))
      )}
    </div>
  );
}