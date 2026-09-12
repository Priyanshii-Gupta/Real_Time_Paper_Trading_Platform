import React from "react";

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => {
        const icon =
          toast.type === "success" ? "✓" : toast.type === "error" ? "⚠" : "ℹ";

        return (
          <div
            key={toast.id}
            className={`toast ${toast.type || "info"}`}
            id={`toast-${toast.id}`}
          >
            <div className="toast-icon">{icon}</div>
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
