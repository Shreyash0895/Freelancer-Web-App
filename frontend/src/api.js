/* ========================================
   API Service - Backend Integration
   ======================================== */

const API_BASE = "http://localhost:5001";

/**
 * Generic POST request helper
 */
async function postJSON(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Server responded with status ${res.status}`);
  }

  return res.json();
}

/**
 * Sign up a new user
 * @param {{ email: string, password: string, role: string }} data
 * @returns {Promise<{ message: string }>}
 */
export async function signup(data) {
  return postJSON("/signup", data);
}

/**
 * Log in an existing user
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ success: boolean, role?: string }>}
 */
export async function login(data) {
  return postJSON("/login", data);
}

/**
 * Get all client projects
 * @returns {Promise<Array>}
 */
export async function getProjects() {
  const res = await fetch(`${API_BASE}/client-projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

/**
 * Post a new client project
 * @param {Object} data 
 * @returns {Promise<{message: string}>}
 */
export async function postProject(data) {
  return postJSON("/client", data);
}

/**
 * Save freelancer profile details
 * @param {Object} data 
 * @returns {Promise<{message: string}>}
 */
export async function saveFreelancerProfile(data) {
  return postJSON("/freelancer", data);
}

/**
 * Submit a bid on a project
 * @param {Object} data 
 * @returns {Promise<{message: string}>}
 */
export async function submitBid(data) {
  return postJSON("/bid", data);
}

/**
 * Get bids for a project
 * @param {string} projectId 
 * @returns {Promise<Array>}
 */
export async function getProjectBids(projectId) {
  const res = await fetch(`${API_BASE}/bids/${projectId}`);
  if (!res.ok) throw new Error("Failed to fetch bids");
  return res.json();
}
