import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService } from "./authService";
import type { User, Theme } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  theme: Theme;
  isLoading: boolean;
  login: (code: string, redirectUri: string) => Promise<void>;
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

  // Load saved auth and theme from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedToken) {
      authService
        .getCurrentUser(savedToken)
        .then((userData) => {
          setUser(userData);
          setToken(savedToken);
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem("auth_token");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (code: string, redirectUri: string) => {
    try {
      const authResponse = await authService.exchangeCodeForToken(code, redirectUri);
      const userData = await authService.getCurrentUser(authResponse.access_token);

      setToken(authResponse.access_token);
      setUser(userData);
      localStorage.setItem("auth_token", authResponse.access_token);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
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
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <AuthContext.Provider value={{ user, token, theme, isLoading, login, logout, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};
