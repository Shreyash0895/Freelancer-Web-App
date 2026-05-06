import "../index.css";

export default function Projects() {
  const projects = [
    {
      title: "E-Commerce Website",
      budget: "$500",
      status: "In Progress",
    },
    {
      title: "Portfolio Website",
      budget: "$250",
      status: "Completed",
    },
    {
      title: "Chat Application",
      budget: "$700",
      status: "Pending",
    },
  ];

  return (
    <div className="page-container">

      <div className="page-header">
        <h1>📁 Projects</h1>
        <p>Manage all your active projects</p>
      </div>

      <div className="projects-grid">

        {projects.map((project, index) => (
          <div className="project-box" key={index}>

            <h2>{project.title}</h2>

            <p>Budget: {project.budget}</p>

            <span className="status">
              {project.status}
            </span>

            <button>
              View Details
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}