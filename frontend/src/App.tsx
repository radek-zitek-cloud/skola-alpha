import { useAuth } from "./AuthContext";
import { Login } from "./components/Login";
import { UserProfile } from "./components/UserProfile";
import { Dashboard } from "./components/Dashboard";

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
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
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <UserProfile />
      <Dashboard />
    </>
  );
}

export default App;
