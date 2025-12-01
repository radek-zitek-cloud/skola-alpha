import { useAuth } from "../AuthContext";

interface Activity {
  id: string;
  subject: string;
  topic: string;
  icon: string;
  color: string;
  textColor: string;
}

const activities: Activity[] = [
  {
    id: "english-spelling",
    subject: "English",
    topic: "Spelling",
    icon: "🅰️",
    color: "#6366f1", // Indigo 500
    textColor: "#ffffff",
  },
  {
    id: "math-activity",
    subject: "Math",
    topic: "Practice",
    icon: "🧮",
    color: "#10b981", // Emerald 500
    textColor: "#ffffff",
  },
  {
    id: "habit-tracker",
    subject: "Habits",
    topic: "Track Progress",
    icon: "✅",
    color: "#8b5cf6", // Purple 500
    textColor: "#ffffff",
  },
  {
    id: "czech-error",
    subject: "Czech",
    topic: "Find Error",
    icon: "🔍",
    color: "#f43f5e", // Rose 500
    textColor: "#ffffff",
  },
];

interface DashboardProps {
  onNavigate: (activityId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { theme, user } = useAuth();
  const isDark = theme === "dark";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: isDark ? "#0f172a" : "#f9fafb",
        color: isDark ? "#e2e8f0" : "#111827",
        padding: "24px",
        paddingTop: "88px",
        paddingBottom: "48px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ marginBottom: "48px", textAlign: "center" }}>
          <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>
            Hi, {user?.name?.split(" ")[0] || "Friend"}! 👋
          </h1>
          <p style={{ fontSize: "20px", opacity: 0.8 }}>
            What do you want to learn today?
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "32px",
          }}
        >
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onNavigate(activity.id)}
              style={{
                background: activity.color,
                color: activity.textColor,
                border: "none",
                borderRadius: "24px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                height: "240px",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05) translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
              }}
            >
              <div style={{ 
                fontSize: "64px", 
                marginBottom: "24px", 
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))",
                transition: "transform 0.3s ease"
              }}>
                {activity.icon}
              </div>
              <span style={{ 
                fontSize: "28px", 
                fontWeight: "800", 
                marginBottom: "8px",
                letterSpacing: "-0.5px"
              }}>
                {activity.subject}
              </span>
              <span style={{ 
                fontSize: "20px", 
                opacity: 0.9,
                fontWeight: "500"
              }}>
                {activity.topic}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
};
