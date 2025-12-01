import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { habitService } from "../habitService";
import type { Habit, HabitHistoryResponse } from "../types";

interface HabitWithHistory extends Habit {
  history?: HabitHistoryResponse;
}

interface HabitTrackerProps {
  onBack?: () => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ onBack }) => {
  const { theme, token } = useAuth();
  const isDark = theme === "dark";
  const [habits, setHabits] = useState<HabitWithHistory[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabits = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedHabits = await habitService.getHabits(token);

      // Load history for each habit
      const habitsWithHistory = await Promise.all(
        fetchedHabits.map(async (habit) => {
          try {
            const history = await habitService.getHabitHistory(token, habit.id, 35);
            return { ...habit, history };
          } catch (err) {
            console.error(`Failed to load history for habit ${habit.id}`, err);
            return habit;
          }
        })
      );

      setHabits(habitsWithHistory);
    } catch (err) {
      console.error("Failed to load habits:", err);
      setError("Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, [token]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newHabitName.trim()) return;

    try {
      await habitService.createHabit(token, newHabitName.trim());
      setNewHabitName("");
      loadHabits();
    } catch (err) {
      console.error("Failed to create habit:", err);
      setError("Failed to create habit");
    }
  };

  const handleToggleCompletion = async (habitId: number, dateStr: string) => {
    if (!token) return;

    try {
      await habitService.toggleHabitCompletion(token, habitId, dateStr);
      loadHabits();
    } catch (err) {
      console.error("Failed to toggle habit completion:", err);
      setError("Failed to update habit");
    }
  };

  // Generate array of dates for the last 35 days
  const generateDates = (days: number): Date[] => {
    const dates: Date[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }

    return dates;
  };

  // Organize dates into weeks (starting on Monday)
  const organizeDatesIntoWeeks = (dates: Date[]): Date[][] => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    dates.forEach((date) => {
      // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeek = date.getDay();

      // If it's Monday and we have dates in current week, start a new week
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(date);
    });

    // Add the last week if it has any dates
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isCompleted = (habit: HabitWithHistory, date: Date): boolean => {
    if (!habit.history) return false;
    const dateStr = formatDate(date);
    return habit.history.completions.includes(dateStr);
  };

  const getDayLabel = (date: Date): string => {
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return days[date.getDay()];
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: isDark ? "#0f172a" : "#f9fafb",
          color: isDark ? "#e2e8f0" : "#111827",
          padding: "24px",
          paddingTop: "88px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Loading habits...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#0f172a" : "#f9fafb",
        color: isDark ? "#e2e8f0" : "#111827",
        padding: "24px",
        paddingTop: "88px",
        paddingBottom: "48px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ marginBottom: "32px" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                marginBottom: "16px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "8px",
                border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
                background: isDark ? "#1e293b" : "#ffffff",
                color: isDark ? "#e2e8f0" : "#111827",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ← Back
            </button>
          )}
          <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>
            Habit Tracker
          </h1>
          <p style={{ fontSize: "18px", opacity: 0.8 }}>
            Track your daily habits and build consistency
          </p>
        </header>

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "24px",
              background: "#fca5a5",
              color: "#7f1d1d",
              borderRadius: "8px",
            }}
          >
            {error}
          </div>
        )}

        {/* Create Habit Form */}
        <form
          onSubmit={handleCreateHabit}
          style={{
            marginBottom: "32px",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Enter habit name..."
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "16px",
              borderRadius: "8px",
              border: isDark ? "1px solid #334155" : "1px solid #d1d5db",
              background: isDark ? "#1e293b" : "#ffffff",
              color: isDark ? "#e2e8f0" : "#111827",
            }}
          />
          <button
            type="submit"
            disabled={!newHabitName.trim()}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              background: newHabitName.trim() ? "#6366f1" : "#9ca3af",
              color: "#ffffff",
              cursor: newHabitName.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            Add Habit
          </button>
        </form>

        {/* Habits List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {habits.length === 0 ? (
            <p style={{ textAlign: "center", opacity: 0.6, padding: "48px 0" }}>
              No habits yet. Create your first habit above!
            </p>
          ) : (
            habits.map((habit) => {
              const dates = generateDates(35);
              const weeks = organizeDatesIntoWeeks(dates);

              return (
                <div
                  key={habit.id}
                  style={{
                    padding: "24px",
                    borderRadius: "16px",
                    background: isDark ? "#1e293b" : "#ffffff",
                    boxShadow: isDark
                      ? "0 4px 6px rgba(0, 0, 0, 0.3)"
                      : "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h3 style={{ fontSize: "24px", marginBottom: "20px" }}>
                    {habit.name}
                  </h3>

                  {/* Completion Circles */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {weeks.map((week, weekIndex) => (
                      <div
                        key={weekIndex}
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        {week.map((date, dayIndex) => {
                          const completed = isCompleted(habit, date);
                          const today = isToday(date);

                          return (
                            <div
                              key={dayIndex}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "10px",
                                  opacity: 0.6,
                                  fontWeight: "500",
                                }}
                              >
                                {getDayLabel(date)}
                              </div>
                              <button
                                onClick={() => handleToggleCompletion(habit.id, formatDate(date))}
                                disabled={!today}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  border: completed
                                    ? "none"
                                    : isDark
                                    ? "2px solid #475569"
                                    : "2px solid #d1d5db",
                                  background: completed
                                    ? "#10b981"
                                    : "transparent",
                                  cursor: today ? "pointer" : "default",
                                  transition: "all 0.2s",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "relative",
                                }}
                                onMouseEnter={(e) => {
                                  if (today) {
                                    e.currentTarget.style.transform = "scale(1.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                              >
                                {completed && (
                                  <span style={{ color: "#ffffff", fontSize: "20px" }}>
                                    ✓
                                  </span>
                                )}
                                {today && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: "-2px",
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      width: "6px",
                                      height: "6px",
                                      borderRadius: "50%",
                                      background: "#6366f1",
                                    }}
                                  />
                                )}
                              </button>
                              <div
                                style={{
                                  fontSize: "10px",
                                  opacity: 0.5,
                                }}
                              >
                                {date.getDate()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
