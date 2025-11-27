import React from "react";
import { useAuth } from "../AuthContext";

export const UserProfile: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();

  if (!user) return null;

  const isDark = theme === "dark";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: isDark ? "#111827" : "#ffffff",
        borderBottom: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name || "User"}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: `2px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
            }}
          />
        )}
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: isDark ? "#e2e8f0" : "#111827",
            }}
          >
            {user.name || "User"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: isDark ? "#94a3b8" : "#6b7280",
            }}
          >
            {user.email}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={toggleTheme}
          style={{
            padding: "8px 16px",
            background: isDark ? "#1f2937" : "#f3f4f6",
            color: isDark ? "#e2e8f0" : "#111827",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? "#374151" : "#e5e7eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? "#1f2937" : "#f3f4f6";
          }}
        >
          {isDark ? "🌞 Light" : "🌙 Dark"}
        </button>
        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            background: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#b91c1c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#dc2626";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};
