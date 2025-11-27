import type { AuthResponse, User } from "./types";

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export const authService = {
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<AuthResponse> {
    console.log("[authService] Exchanging code for token...", { code: code.substring(0, 20) + "...", redirectUri });
    const response = await fetch(`${apiBase}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    if (!response.ok) {
      console.error("[authService] Failed to exchange code:", response.status, response.statusText);
      throw new Error("Failed to authenticate with Google");
    }

    const data = await response.json();
    console.log("[authService] Received auth response:", { access_token: data.access_token?.substring(0, 20) + "...", token_type: data.token_type });
    return data;
  },

  async getCurrentUser(token: string): Promise<User> {
    console.log("[authService] Fetching current user with token:", token?.substring(0, 20) + "...");
    console.log("[authService] Full Authorization header:", `Bearer ${token}`);
    const response = await fetch(`${apiBase}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[authService] /auth/me response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[authService] Failed to fetch user data:", response.status, errorText);
      throw new Error("Failed to fetch user data");
    }

    const data = await response.json();
    console.log("[authService] User data received:", data);
    return data;
  },

  async logout(token: string): Promise<void> {
    await fetch(`${apiBase}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
