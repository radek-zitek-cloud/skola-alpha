import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";

type Status = "checking" | "up" | "down";

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
const healthUrl = `${apiBase.replace(/\/$/, "")}/health`;

export const StatusFooter: React.FC = () => {
  const { theme } = useAuth();
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Checking backend health...");

  const isDark = theme === "dark";

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(healthUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const body = await res.json();
        if (body?.status === "ok") {
          setStatus("up");
          setMessage("Backend is reachable.");
        } else {
          setStatus("down");
          setMessage("Backend responded unexpectedly.");
        }
      } catch (err) {
        setStatus("down");
        setMessage(`Backend unreachable: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    };

    void checkHealth();
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
        void checkHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const indicatorColor = status === "up" ? "#16a34a" : status === "down" ? "#dc2626" : "#d97706";

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "32px",
        background: isDark ? "#1e293b" : "#f3f4f6",
        borderTop: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontSize: "12px",
        color: isDark ? "#94a3b8" : "#6b7280",
        zIndex: 100,
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: indicatorColor,
            boxShadow: `0 0 8px ${indicatorColor}`,
          }}
        />
        <span>{message}</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ opacity: 0.7 }}>{healthUrl}</span>
      </div>
      <div>
        v{import.meta.env.VITE_APP_VERSION || "0.0.1"}
      </div>
    </footer>
  );
};
