import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Login } from "./components/Login";
import { UserProfile } from "./components/UserProfile";
import { Dashboard } from "./components/Dashboard";
import { StatusFooter } from "./components/StatusFooter";
import { SpellingActivity } from "./components/SpellingActivity";
import { MathActivity } from "./components/MathActivity";

function App() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>("dashboard");

  if (isLoading) {
    return (
      <>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#e2e8f0",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          }}
        >
          <div>Loading...</div>
        </div>
        <StatusFooter />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <StatusFooter />
      </>
    );
  }

  return (
    <>
      <UserProfile />
      {currentView === "dashboard" && (
        <Dashboard onNavigate={(view) => setCurrentView(view)} />
      )}
      {currentView === "english-spelling" && (
        <SpellingActivity onBack={() => setCurrentView("dashboard")} />
      )}
      {currentView === "math-activity" && (
        <MathActivity onBack={() => setCurrentView("dashboard")} />
      )}
      {/* Fallback for unimplemented activities */}
      {currentView !== "dashboard" && currentView !== "english-spelling" && (
        <div style={{ 
          minHeight: "100vh", 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center", 
          justifyContent: "center",
          background: "#0f172a",
          color: "#e2e8f0"
        }}>
          <h1>Coming Soon!</h1>
          <button 
            onClick={() => setCurrentView("dashboard")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Back to Dashboard
          </button>
        </div>
      )}
      <StatusFooter />
    </>
  );
}

export default App;
