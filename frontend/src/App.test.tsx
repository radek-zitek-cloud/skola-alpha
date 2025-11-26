import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows success message when backend is reachable", async () => {
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
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Backend unreachable/i)).toBeInTheDocument();
    });
  });
});
