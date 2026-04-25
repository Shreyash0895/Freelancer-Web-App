/* ========================================
   FreelanceHub - Main Application
   ======================================== */

import "./style.css";
import "./dashboard.css";
import { login, signup } from "./api.js";
import { showToast } from "./toast.js";
import { renderDashboard, bindDashboardEvents } from "./dashboard.js";

/* -----------  Helpers  ----------- */

function $(sel, root = document) {
  return root.querySelector(sel);
}

/* -----------  Background / Particles  ----------- */

function renderBackground() {
  return `
    <div class="bg-canvas">
      <div class="bg-orb bg-orb--1"></div>
      <div class="bg-orb bg-orb--2"></div>
      <div class="bg-orb bg-orb--3"></div>
      <div class="bg-grid"></div>
    </div>
  `;
}

function spawnParticles() {
  const count = 25;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 6}s`;
    p.style.width = p.style.height = `${2 + Math.random() * 3}px`;
    const hue = 220 + Math.random() * 80; // purple → pink range
    p.style.background = `hsl(${hue}, 80%, 70%)`;
    document.body.appendChild(p);
  }
}

/* -----------  Branding Panel (shared)  ----------- */

function brandingHTML() {
  return `
    <div class="auth-branding">
      <div class="brand-logo">
        <div class="brand-logo-icon">F</div>
        <span class="brand-logo-text">FreelanceHub</span>
      </div>

      <h1 class="brand-headline">
        Find the perfect<br />
        <span class="gradient-text">freelance services</span><br />
        for your business
      </h1>

      <p class="brand-subtext">
        Join thousands of businesses and freelancers who trust FreelanceHub to
        connect, collaborate, and build amazing projects together.
      </p>

      <div class="brand-features">
        <div class="brand-feature">
          <div class="brand-feature-icon brand-feature-icon--purple">🚀</div>
          <span class="brand-feature-text">Post projects & receive competitive bids</span>
        </div>
        <div class="brand-feature">
          <div class="brand-feature-icon brand-feature-icon--pink">💼</div>
          <span class="brand-feature-text">Access verified freelancers worldwide</span>
        </div>
        <div class="brand-feature">
          <div class="brand-feature-icon brand-feature-icon--cyan">⚡</div>
          <span class="brand-feature-text">Secure payments & milestone tracking</span>
        </div>
      </div>
    </div>
  `;
}

/* ===========================================================
   LOGIN PAGE
   =========================================================== */

function loginFormHTML() {
  return `
    <div class="auth-form-panel form-panel-transition" id="login-panel">
      <div class="form-header">
        <h2 class="form-title">Welcome back</h2>
        <p class="form-subtitle">
          Don't have an account? <a id="go-to-signup">Create one</a>
        </p>
      </div>

      <form class="auth-form" id="login-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="login-email">Email Address</label>
          <div class="form-input-wrapper">
            <span class="form-input-icon">✉</span>
            <input
              class="form-input"
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <div class="form-input-wrapper">
            <span class="form-input-icon">🔒</span>
            <input
              class="form-input"
              id="login-password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button type="button" class="password-toggle" id="login-pw-toggle" aria-label="Show password">👁</button>
          </div>
        </div>

        <div class="form-options">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="remember-me" />
            <label for="remember-me">Remember me</label>
          </div>
          <a class="forgot-link">Forgot password?</a>
        </div>

        <button class="btn-primary" type="submit" id="login-btn">
          <span>Sign In</span>
        </button>

        <div class="divider">or continue with</div>

        <div class="social-buttons">
          <button type="button" class="btn-social" id="social-google">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button type="button" class="btn-social" id="social-github">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </button>
        </div>
      </form>
    </div>
  `;
}

/* ===========================================================
   SIGNUP PAGE
   =========================================================== */

function signupFormHTML() {
  return `
    <div class="auth-form-panel form-panel-transition" id="signup-panel">
      <div class="form-header">
        <h2 class="form-title">Create your account</h2>
        <p class="form-subtitle">
          Already have an account? <a id="go-to-login">Sign in</a>
        </p>
      </div>

      <form class="auth-form" id="signup-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="signup-email">Email Address</label>
          <div class="form-input-wrapper">
            <span class="form-input-icon">✉</span>
            <input
              class="form-input"
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="signup-password">Password</label>
          <div class="form-input-wrapper">
            <span class="form-input-icon">🔒</span>
            <input
              class="form-input"
              id="signup-password"
              type="password"
              placeholder="Min 6 characters"
              autocomplete="new-password"
              required
            />
            <button type="button" class="password-toggle" id="signup-pw-toggle" aria-label="Show password">👁</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="signup-confirm-password">Confirm Password</label>
          <div class="form-input-wrapper">
            <span class="form-input-icon">🔒</span>
            <input
              class="form-input"
              id="signup-confirm-password"
              type="password"
              placeholder="Re-enter password"
              autocomplete="new-password"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">I am a</label>
          <div class="role-selector">
            <label class="role-option">
              <input type="radio" name="role" value="client" checked />
              <div class="role-card">
                <span class="role-card-icon">🏢</span>
                <span class="role-card-label">Client</span>
              </div>
            </label>
            <label class="role-option">
              <input type="radio" name="role" value="freelancer" />
              <div class="role-card">
                <span class="role-card-icon">💻</span>
                <span class="role-card-label">Freelancer</span>
              </div>
            </label>
          </div>
        </div>

        <button class="btn-primary" type="submit" id="signup-btn">
          <span>Create Account</span>
        </button>

        <div class="divider">or sign up with</div>

        <div class="social-buttons">
          <button type="button" class="btn-social" id="social-google-signup">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button type="button" class="btn-social" id="social-github-signup">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </button>
        </div>
      </form>
    </div>
  `;
}

/* ===========================================================
   PAGE RENDERING & ROUTING
   =========================================================== */

let currentPage = "login"; // "login" | "signup" | "dashboard"

function render(page) {
  currentPage = page;
  const app = $("#app");

  if (page === "dashboard") {
    app.innerHTML = renderDashboard();
    bindDashboardEvents(switchPage);
    return;
  }

  const formHTML = page === "login" ? loginFormHTML() : signupFormHTML();

  app.innerHTML = `
    <div class="auth-container" id="auth-container">
      ${brandingHTML()}
      ${formHTML}
    </div>
  `;

  bindEvents(page);
}

/* ===========================================================
   EVENT BINDINGS
   =========================================================== */

function bindEvents(page) {
  if (page === "login") {
    bindLoginEvents();
  } else {
    bindSignupEvents();
  }
}

/* --------- Password Toggle --------- */
function togglePassword(inputId, toggleBtnId) {
  const input = $(`#${inputId}`);
  const btn = $(`#${toggleBtnId}`);
  if (!input || !btn) return;

  btn.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.textContent = isPassword ? "🙈" : "👁";
  });
}

/* --------- Login --------- */
function bindLoginEvents() {
  // Navigate to signup
  const goSignup = $("#go-to-signup");
  if (goSignup) goSignup.addEventListener("click", () => switchPage("signup"));

  // Password toggle
  togglePassword("login-password", "login-pw-toggle");

  // Form submit
  const form = $("#login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = $("#login-email").value.trim();
    const password = $("#login-password").value.trim();

    // Validation
    if (!email || !password) {
      showToast("error", "Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      showToast("error", "Please enter a valid email address.");
      return;
    }

    const btn = $("#login-btn");
    setButtonLoading(btn, true);

    try {
      const data = await login({ email, password });

      if (data.success) {
        showToast("success", `Welcome back! Logged in as ${data.role}.`);
        // Store role in localStorage for future use
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userEmail", email);
        setTimeout(() => switchPage("dashboard"), 500);
      } else {
        showToast("error", "Invalid email or password. Please try again.");
      }
    } catch (err) {
      showToast("error", "Unable to connect to server. Make sure backend is running.");
      console.error(err);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

/* --------- Signup --------- */
function bindSignupEvents() {
  // Navigate to login
  const goLogin = $("#go-to-login");
  if (goLogin) goLogin.addEventListener("click", () => switchPage("login"));

  // Password toggle
  togglePassword("signup-password", "signup-pw-toggle");

  // Form submit
  const form = $("#signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = $("#signup-email").value.trim();
    const password = $("#signup-password").value.trim();
    const confirmPassword = $("#signup-confirm-password").value.trim();
    const role = document.querySelector('input[name="role"]:checked')?.value;

    // Validation
    if (!email || !password || !confirmPassword) {
      showToast("error", "Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      showToast("error", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showToast("error", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }

    const btn = $("#signup-btn");
    setButtonLoading(btn, true);

    try {
      const data = await signup({ email, password, role });
      showToast("success", "Account created successfully! Please sign in.");
      // Switch to login after short delay
      setTimeout(() => switchPage("login"), 1500);
    } catch (err) {
      showToast("error", "Unable to connect to server. Make sure backend is running.");
      console.error(err);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

/* ===========================================================
   UTILITIES
   =========================================================== */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setButtonLoading(btn, isLoading) {
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<span><span class="spinner"></span> Please wait…</span>`;
  } else {
    btn.disabled = false;
    const text = currentPage === "login" ? "Sign In" : "Create Account";
    btn.innerHTML = `<span>${text}</span>`;
  }
}

function switchPage(page) {
  const panel = $("#app").firstElementChild;
  if (panel) {
    // Basic fade out class
    panel.style.transition = "opacity 0.25s, transform 0.25s";
    panel.style.opacity = "0";
    panel.style.transform = "translateY(15px)";
    setTimeout(() => render(page), 250);
  } else {
    render(page);
  }
}

/* ===========================================================
   INIT
   =========================================================== */

function init() {
  // Insert animated background
  document.body.insertAdjacentHTML("afterbegin", renderBackground());
  spawnParticles();

  if (localStorage.getItem("userRole")) {
    render("dashboard");
  } else {
    render("login");
  }
}

document.addEventListener("DOMContentLoaded", init);
