/* ========================================
   Toast Notification System
   ======================================== */

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }
}

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

/**
 * Show a toast notification
 * @param {"success"|"error"|"info"} type
 * @param {string} message
 * @param {number} durationMs
 */
export function showToast(type, message, durationMs = 4000) {
  ensureContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close notification">✕</button>
  `;

  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => removeToast(toast));

  toastContainer.appendChild(toast);

  // Auto remove
  setTimeout(() => removeToast(toast), durationMs);
}

function removeToast(toast) {
  toast.style.animation = "toastSlideOut 0.3s ease forwards";
  setTimeout(() => toast.remove(), 300);
}
