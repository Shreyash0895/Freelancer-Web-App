import "../index.css";

export default function Profile() {
  return (
    <div className="page-container">

      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Manage your freelancer information</p>
      </div>

      <div className="profile-card">

        <div className="profile-top">
          <img
            src="https://i.pravatar.cc/150"
            alt="profile"
          />

          <div>
            <h2>Shreyash Jokare</h2>
            <span>Full Stack Developer</span>
          </div>
        </div>

        <div className="profile-grid">

          <div className="profile-field">
            <label>Email</label>
            <input value="shreyash@gmail.com" />
          </div>

          <div className="profile-field">
            <label>Phone</label>
            <input value="+91 9876543210" />
          </div>

          <div className="profile-field">
            <label>Skills</label>
            <input value="React, Node.js, MongoDB" />
          </div>

          <div className="profile-field">
            <label>Experience</label>
            <input value="2 Years" />
          </div>

        </div>

        <button className="save-btn">
          Save Profile
        </button>

      </div>

    </div>
  );
}