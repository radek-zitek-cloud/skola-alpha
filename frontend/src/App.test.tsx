import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const mockUseAuth = vi.fn();

vi.mock("./AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

import App from "./App";

describe("App", () => {
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
    token: "token",
    theme: "dark" as const,
    isLoading: false,
    googleClientId: "client-id",
    login: vi.fn(),
    logout: vi.fn(),
    toggleTheme: vi.fn(),
  });

  it("shows success message when backend is reachable", async () => {
    mockUseAuth.mockReturnValue(createAuthState());
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Backend is reachable/i)).toBeInTheDocument();
    });
  });

  it("shows failure message when backend is unreachable", async () => {
    mockUseAuth.mockReturnValue(createAuthState());
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Backend unreachable/i)).toBeInTheDocument();
    });
  });
});
