import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../AuthContext";

interface WordPair {
  czech: string;
  english: string;
}

interface SpellingActivityProps {
  onBack: () => void;
}

export const SpellingActivity: React.FC<SpellingActivityProps> = ({ onBack }) => {
  const { theme, token } = useAuth();
  const isDark = theme === "dark";
  
  const [currentWord, setCurrentWord] = useState<WordPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchNewWord = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      let apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      // Remove trailing slash if present to avoid double slashes
      if (apiBase.endsWith("/")) {
        apiBase = apiBase.slice(0, -1);
      }
      
      const response = await fetch(`${apiBase}/vocabulary/random`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch word");
      }
      
      const data = await response.json();
      setCurrentWord(data);
      setUserInput("");
      setShowAnswer(false);
    } catch (error) {
      console.error("Error fetching word:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    fetchNewWord();
  }, [fetchNewWord]);

  // Focus input when word changes
  useEffect(() => {
    if (inputRef.current && !loading) {
      inputRef.current.focus();
    }
  }, [currentWord, showAnswer, loading]);

  const handleNext = useCallback(() => {
    fetchNewWord();
  }, [fetchNewWord]);

  const targetWord = currentWord?.english.toLowerCase() || "";
  const isComplete = targetWord.length > 0 && userInput.toLowerCase() === targetWord;

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        handleNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, handleNext]);

  if (loading || !currentWord) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: isDark ? "#0f172a" : "#f9fafb",
        color: isDark ? "#e2e8f0" : "#111827"
      }}>
        Loading...
      </div>
    );
  }

  const maxLength = targetWord.length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, maxLength);

    // Score logic: +1 for correct letter, -1 for incorrect
    if (val.length > userInput.length) {
      const charIndex = (e.target.selectionStart || val.length) - 1;
      if (charIndex >= 0 && charIndex < targetWord.length) {
        const char = val[charIndex];
        if (char.toLowerCase() === targetWord[charIndex].toLowerCase()) {
          setScore(s => s + 1);
        } else {
          setScore(s => s - 1);
        }
      }
    }

    setUserInput(val);
  };

  const handleShowAnswer = () => {
    setScore(s => s - 10);
    setShowAnswer(true);
    setUserInput(targetWord);
    inputRef.current?.focus();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#0f172a" : "#f9fafb",
        color: isDark ? "#e2e8f0" : "#111827",
        padding: "24px",
        paddingTop: "88px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div style={{ 
        width: "100%", 
        maxWidth: "800px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "48px"
      }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
            color: isDark ? "#e2e8f0" : "#1e293b",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          ← Dashboard
        </button>
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
          Score: {score}
        </div>
      </div>

      {/* Game Area */}
      <div style={{
        background: isDark ? "#1e293b" : "#ffffff",
        padding: "48px",
        borderRadius: "24px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        maxWidth: "600px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px"
      }}>
        
        {/* Czech Word */}
        <div>
          <div style={{ fontSize: "16px", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.7, marginBottom: "8px" }}>
            Translate to English
          </div>
          <div style={{ fontSize: "48px", fontWeight: "bold" }}>
            {currentWord.czech}
          </div>
        </div>

        {/* Input Placeholders */}
        <div 
          style={{ 
            display: "flex", 
            gap: "12px", 
            justifyContent: "center",
            position: "relative",
            cursor: "text"
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Hidden Input */}
          <input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            style={{
              position: "absolute",
              opacity: 0,
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              cursor: "text"
            }}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {/* Visual Boxes */}
          {targetWord.split("").map((char, index) => {
            const userChar = userInput[index] || "";
            const isCorrect = userChar.toLowerCase() === char.toLowerCase();
            const hasChar = userChar !== "";
            
            let borderColor = isDark ? "#475569" : "#cbd5e1";
            let bgColor = isDark ? "#0f172a" : "#f8fafc";
            let textColor = isDark ? "#e2e8f0" : "#1e293b";

            if (hasChar) {
              if (isCorrect) {
                borderColor = "#10b981"; // Green
                bgColor = "rgba(16, 185, 129, 0.1)";
                textColor = "#10b981";
              } else {
                borderColor = "#ef4444"; // Red
                bgColor = "rgba(239, 68, 68, 0.1)";
                textColor = "#ef4444";
              }
            } else if (index === userInput.length) {
               // Current active cursor position
               borderColor = "#6366f1"; // Indigo
            }

            return (
              <div
                key={index}
                style={{
                  width: "48px",
                  height: "64px",
                  border: `2px solid ${borderColor}`,
                  borderRadius: "12px",
                  background: bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: textColor,
                  transition: "all 0.2s ease",
                  textTransform: "uppercase"
                }}
              >
                {userChar}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
          <button
            onClick={handleShowAnswer}
            disabled={showAnswer || isComplete}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              background: isDark ? "#334155" : "#e2e8f0",
              color: isDark ? "#e2e8f0" : "#475569",
              fontSize: "16px",
              fontWeight: "600",
              cursor: (showAnswer || isComplete) ? "not-allowed" : "pointer",
              opacity: (showAnswer || isComplete) ? 0.5 : 1
            }}
          >
            Show Answer
          </button>
          
          <button
            onClick={handleNext}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              border: "none",
              background: "#6366f1",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            Next Word →
          </button>
        </div>

      </div>
    </div>
  );
};
