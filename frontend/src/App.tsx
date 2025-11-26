import { useEffect, useState } from "react";

type Status = "checking" | "up" | "down";

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
const healthUrl = `${apiBase.replace(/\/$/, "")}/health`;

function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Checking backend health...");

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
  }, []);

  const indicatorColor = status === "up" ? "#16a34a" : status === "down" ? "#dc2626" : "#d97706";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 15px 50px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ fontSize: "20px", margin: "0 0 16px" }}>skola-alpha</h1>
        <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: indicatorColor,
              boxShadow: `0 0 12px ${indicatorColor}`,
            }}
          />
          {message}
        </p>
        <p style={{ marginTop: "12px", color: "#94a3b8", fontSize: "13px" }}>Endpoint: {healthUrl}</p>
      </div>
    </main>
  );
}

export default App;
