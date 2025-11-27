import { useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../AuthContext";

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login } = useAuth();

  useEffect(() => {
    // Check if we're returning from Google OAuth with a code
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      login(code, redirectUri)
        .then(() => {
          // Clear the code from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          onSuccess?.();
        })
        .catch((error) => {
          console.error("OAuth login failed:", error);
        });
    }
  }, [login, onSuccess]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      login(codeResponse.code, redirectUri).catch((error) => {
        console.error("OAuth login failed:", error);
      });
    },
    onError: () => {
      console.error("Google login failed");
    },
    flow: "auth-code",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "12px",
          padding: "48px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 15px 50px rgba(0,0,0,0.35)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "28px", margin: "0 0 12px" }}>skola-alpha</h1>
        <p style={{ margin: "0 0 32px", color: "#94a3b8" }}>Sign in to continue</p>

        <button
          onClick={() => handleGoogleLogin()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 24px",
            background: "#ffffff",
            color: "#1f1f1f",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
          }}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                fill="#EA4335"
              />
            </g>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};
