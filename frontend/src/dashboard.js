import PostProject from "../components/PostProject";
import ProjectList from "../components/ProjectList";

export default function Dashboard() {
  const role = localStorage.getItem("role");

  return (
    <div className="p-10 text-white">

      <h1 className="text-3xl mb-6">Dashboard 🚀</h1>

      {role === "client" && <PostProject />}

      <ProjectList />

    </div>
  );
}