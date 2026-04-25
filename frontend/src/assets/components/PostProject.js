import { useState } from "react";
import API from "../api/api";

export default function PostProject() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    skills: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await API.post("/projects", form);
    alert("Project posted!");
  };

  return (
    <div className="glass p-6 rounded-xl mb-6">
      <h2 className="text-xl mb-4">Post a Project</h2>

      <input name="title" placeholder="Title" onChange={handleChange} className="input-field mb-3" />
      <textarea name="description" placeholder="Description" onChange={handleChange} className="input-field mb-3" />
      <input name="budget" placeholder="Budget" onChange={handleChange} className="input-field mb-3" />
      <input name="skills" placeholder="Skills (React, Node)" onChange={handleChange} className="input-field mb-3" />

      <button onClick={handleSubmit} className="btn-gradient w-full">
        Post Project
      </button>
    </div>
  );
}