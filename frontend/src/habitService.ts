import type { Habit, HabitCompletionToggle, HabitHistoryResponse } from "./types";

const normalizeBaseUrl = (baseUrl: string): string => {
  if (!baseUrl) {
    return "http://localhost:8000";
  }

  const trimmed = baseUrl.trim();
  if (trimmed.length <= 1) {
    return trimmed || "http://localhost:8000";
  }

  return trimmed.replace(/\/+$/, "");
};

const apiBase = normalizeBaseUrl((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000");

export const habitService = {
  async createHabit(token: string, name: string): Promise<Habit> {
    const response = await fetch(`${apiBase}/habits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error("Failed to create habit");
    }

    return response.json();
  },

  async getHabits(token: string): Promise<Habit[]> {
    const response = await fetch(`${apiBase}/habits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch habits");
    }

    return response.json();
  },

  async toggleHabitCompletion(
    token: string,
    habitId: number,
    completionDate: string
  ): Promise<{ status: string; date: string }> {
    const response = await fetch(`${apiBase}/habits/${habitId}/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completion_date: completionDate } as HabitCompletionToggle),
    });

    if (!response.ok) {
      throw new Error("Failed to toggle habit completion");
    }

    return response.json();
  },

  async getHabitHistory(token: string, habitId: number, days: number = 35): Promise<HabitHistoryResponse> {
    const response = await fetch(`${apiBase}/habits/${habitId}/history?days=${days}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch habit history");
    }

    return response.json();
  },
};
