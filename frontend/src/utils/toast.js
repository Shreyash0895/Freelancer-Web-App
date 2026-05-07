let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

const ICONS = { success: "✓", error: "✕", info: "ℹ" };

export function showToast(type, message, duration = 4000) {
  const c = getContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] ?? "!"}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close">✕</button>
  `;
  toast.querySelector(".toast-close").addEventListener("click", () => remove(toast));
  c.appendChild(toast);
  setTimeout(() => remove(toast), duration);
}

function remove(toast) {
  toast.style.animation = "toastOut 0.3s ease forwards";
  setTimeout(() => toast.remove(), 300);
}