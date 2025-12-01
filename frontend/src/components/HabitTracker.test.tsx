import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const mockUseAuth = vi.fn();

vi.mock("../AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../habitService", () => ({
  habitService: {
    getHabits: vi.fn().mockResolvedValue([]),
    getHabitHistory: vi.fn().mockResolvedValue({
      habit_id: 1,
      habit_name: "Test Habit",
      completions: [],
    }),
    createHabit: vi.fn(),
    toggleHabitCompletion: vi.fn(),
  },
}));

import { HabitTracker } from "./HabitTracker";

describe("HabitTracker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReset();
  });

  const createAuthState = () => ({
    user: {
      id: 1,
      google_id: "google-123",
      email: "user@example.com",
      name: "Test User",
      picture: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    token: "test-token",
    theme: "dark" as const,
    isLoading: false,
    googleClientId: "client-id",
    login: vi.fn(),
    logout: vi.fn(),
    toggleTheme: vi.fn(),
  });

  it("renders the habit tracker component", async () => {
    mockUseAuth.mockReturnValue(createAuthState());

    render(<HabitTracker />);

    await waitFor(() => {
      expect(screen.getByText("Habit Tracker")).toBeInTheDocument();
    });
  });

  it("shows create habit form", async () => {
    mockUseAuth.mockReturnValue(createAuthState());

    render(<HabitTracker />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter habit name...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Habit" })).toBeInTheDocument();
    });
  });

  it("shows message when no habits exist", async () => {
    mockUseAuth.mockReturnValue(createAuthState());

    render(<HabitTracker />);

    await waitFor(() => {
      expect(screen.getByText(/No habits yet/i)).toBeInTheDocument();
    });
  });
});
