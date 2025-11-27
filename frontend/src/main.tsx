import React from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./AuthContext";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container missing");
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

if (!googleClientId) {
  console.error("VITE_GOOGLE_CLIENT_ID is not set in environment variables");
}

createRoot(container).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
