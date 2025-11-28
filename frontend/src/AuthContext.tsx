import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { authService } from "./authService";
import type { User, Theme } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  theme: Theme;
  isLoading: boolean;
  googleClientId: string | null;
  login: (code: string, redirectUri: string, codeVerifier?: string) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [isLoading, setIsLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  // Load saved auth and theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedToken = localStorage.getItem("auth_token");
    let cancelled = false;

    const load = async () => {
      const configPromise = authService
        .getOAuthConfig()
        .then((config) => {
          if (!cancelled) {
            setGoogleClientId(config.google_client_id);
          }
        })
        .catch((error) => {
          console.error("[AuthContext] Failed to load OAuth config", error);
          throw error;
        });

      const userPromise = savedToken
        ? authService
            .getCurrentUser(savedToken)
            .then((userData) => {
              if (!cancelled) {
                setUser(userData);
                setToken(savedToken);
              }
            })
            .catch((error) => {
              console.error("[AuthContext] Failed to load current user", error);
              localStorage.removeItem("auth_token");
            })
        : Promise.resolve();

      try {
        await Promise.all([configPromise, userPromise]);
      } catch (error) {
        console.error("[AuthContext] Initialization failed", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (code: string, redirectUri: string, codeVerifier?: string) => {
    console.log("[AuthContext] login() called");
    console.log("[AuthContext] Code:", code?.substring(0, 20) + "...");
    console.log("[AuthContext] Redirect URI:", redirectUri);
    try {
      setIsLoading(true);
      console.log("[AuthContext] Exchanging code for token...");
      const authResponse = await authService.exchangeCodeForToken(code, redirectUri, codeVerifier);
      console.log("[AuthContext] Got auth response:", authResponse);
      console.log("[AuthContext] Access token:", authResponse.access_token?.substring(0, 30) + "...");

      console.log("[AuthContext] Fetching current user...");
      const userData = await authService.getCurrentUser(authResponse.access_token);
      console.log("[AuthContext] Got user data:", userData);

      localStorage.setItem("auth_token", authResponse.access_token);
      setToken(authResponse.access_token);
      setUser(userData);
      console.log("[AuthContext] Login complete!");
    } catch (error) {
      console.error("[AuthContext] Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await authService.logout(token);
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  }, [token]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }, [theme]);

  return (
    <AuthContext.Provider
      value={{ user, token, theme, isLoading, googleClientId, login, logout, toggleTheme }}
    >
      {children}
    </AuthContext.Provider>
  );
};
