import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../AuthContext";
import { VocabularyFilters, VocabularyStatistics } from "../types";
import { playClickSound, playErrorSound, speakText } from "../utils/sound";

interface WordPair {
  id: number;
  czech: string;
  english: string;
}

interface SpellingActivityProps {
  onBack: () => void;
}

type Phase = "config" | "playing";

export const SpellingActivity: React.FC<SpellingActivityProps> = ({ onBack }) => {
  const { theme, token } = useAuth();
  const isDark = theme === "dark";
  
  const [phase, setPhase] = useState<Phase>("config");
  const [filters, setFilters] = useState<VocabularyFilters | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState<VocabularyStatistics | null>(null);

  const [currentWord, setCurrentWord] = useState<WordPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [typoCount, setTypoCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch filters on mount
  useEffect(() => {
    const fetchFilters = async () => {
      if (!token) return;
      try {
        let apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        if (apiBase.endsWith("/")) apiBase = apiBase.slice(0, -1);
        
        const response = await fetch(`${apiBase}/vocabulary/filters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFilters(data);
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
  }, [token]);

  const fetchStatistics = useCallback(async () => {
    if (!token) return;
    try {
      let apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      if (apiBase.endsWith("/")) apiBase = apiBase.slice(0, -1);
      
      const params = new URLSearchParams();
      selectedCategories.forEach(c => params.append("categories", c));
      selectedLevels.forEach(l => params.append("levels", l));
      
      const response = await fetch(`${apiBase}/vocabulary/statistics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, [token, selectedCategories, selectedLevels]);

  useEffect(() => {
    if (showStatistics && phase === "config") {
      fetchStatistics();
    }
  }, [showStatistics, phase, fetchStatistics]);

  const fetchNewWord = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      let apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      if (apiBase.endsWith("/")) {
        apiBase = apiBase.slice(0, -1);
      }
      
      const params = new URLSearchParams();
      selectedCategories.forEach(c => params.append("categories", c));
      selectedLevels.forEach(l => params.append("levels", l));
      
      const response = await fetch(`${apiBase}/vocabulary/random?${params.toString()}`, {
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
      setTypoCount(0);
      setShowAnswer(false);
    } catch (error) {
      console.error("Error fetching word:", error);
    } finally {
      setLoading(false);
    }
  }, [token, selectedCategories, selectedLevels]);

  // Initial fetch when entering playing phase
  useEffect(() => {
    if (phase === "playing") {
      fetchNewWord();
    }
  }, [phase, fetchNewWord]);

  // Focus input when word changes
  useEffect(() => {
    if (phase === "playing" && inputRef.current && !loading) {
      inputRef.current.focus();
    }
  }, [currentWord, showAnswer, loading, phase]);

  // Speak Czech word when it loads
  useEffect(() => {
    if (phase === "playing" && currentWord && !loading) {
      // speakText(currentWord.czech, 'cs-CZ');
    }
  }, [currentWord, phase, loading]);

  const handleNext = useCallback(() => {
    fetchNewWord();
  }, [fetchNewWord]);

  const targetWord = currentWord?.english.toLowerCase() || "";
  const isComplete = targetWord.length > 0 && userInput.toLowerCase() === targetWord;

  useEffect(() => {
    if (isComplete && currentWord && token) {
      // Speak English word on completion
      speakText(currentWord.english, 'en-US');

      // Send attempt data
      const sendAttempt = async () => {
        try {
          let apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
          if (apiBase.endsWith("/")) {
            apiBase = apiBase.slice(0, -1);
          }
          
          await fetch(`${apiBase}/vocabulary/attempt`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              word_id: currentWord.id,
              typo_count: typoCount
            })
          });
        } catch (error) {
          console.error("Error sending attempt:", error);
        }
      };
      
      sendAttempt();

      const timer = setTimeout(() => {
        handleNext();
      }, 5000);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault();
          handleNext();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isComplete, handleNext, currentWord, token, typoCount]);

  const handleStartSession = () => {
    setPhase("playing");
  };

  const handleEndSession = () => {
    setPhase("config");
    setScore(0);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleLevel = (level: string) => {
    if (!filters) return;

    const isSelecting = !selectedLevels.includes(level);
    
    // Update levels
    const newLevels = isSelecting
      ? [...selectedLevels, level]
      : selectedLevels.filter(l => l !== level);
    
    setSelectedLevels(newLevels);

    if (isSelecting) {
      // When selecting a level, add all its categories
      const categoriesToAdd = filters.combinations
        .filter(c => c.level === level)
        .map(c => c.category);
      
      setSelectedCategories(prev => {
        const unique = new Set([...prev, ...categoriesToAdd]);
        return Array.from(unique);
      });
    } else {
      // When unselecting a level, remove categories that are no longer available
      // A category is available if it exists in ANY of the remaining selected levels
      const availableCategories = new Set(
        filters.combinations
          .filter(c => newLevels.includes(c.level))
          .map(c => c.category)
      );

      setSelectedCategories(prev => 
        prev.filter(cat => availableCategories.has(cat))
      );
    }
  };

  if (loading && !filters && phase === "config") {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: isDark ? "#0f172a" : "#f9fafb",
        color: isDark ? "#e2e8f0" : "#111827"
      }}>
        Loading configuration...
      </div>
    );
  }

  if (phase === "config") {
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
        <div style={{ width: "100%", maxWidth: "800px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "32px", textAlign: "center" }}>
            Configure Session
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "48px" }}>
            {/* Levels */}
            <div style={{ 
              background: isDark ? "#1e293b" : "#ffffff", 
              padding: "24px", 
              borderRadius: "16px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Levels</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {filters?.levels
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(level => (
                  <label 
                    key={level} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      cursor: "pointer",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: selectedLevels.includes(level) 
                        ? (isDark ? "#3b82f6" : "#eff6ff") 
                        : (isDark ? "#334155" : "#f1f5f9"),
                      border: `1px solid ${selectedLevels.includes(level) ? "#3b82f6" : "transparent"}`,
                      color: selectedLevels.includes(level) 
                        ? (isDark ? "#ffffff" : "#1d4ed8") 
                        : (isDark ? "#e2e8f0" : "#475569"),
                      transition: "all 0.2s"
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedLevels.includes(level)}
                      onChange={() => toggleLevel(level)}
                      style={{ display: "none" }}
                    />
                    <span style={{ fontWeight: "600" }}>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div style={{ 
              background: isDark ? "#1e293b" : "#ffffff", 
              padding: "24px", 
              borderRadius: "16px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Categories</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {filters?.categories.sort().map(category => {
                  // Determine if category is enabled based on selected levels
                  // If no levels are selected, ALL categories are disabled
                  const isEnabled = selectedLevels.length > 0 && filters.combinations.some(
                    c => c.category === category && selectedLevels.includes(c.level)
                  );

                  return (
                    <label 
                      key={category} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        cursor: isEnabled ? "pointer" : "not-allowed",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        background: selectedCategories.includes(category)
                          ? (isDark ? "#10b981" : "#ecfdf5")
                          : (isDark ? "#334155" : "#f1f5f9"),
                        border: `1px solid ${selectedCategories.includes(category) ? "#10b981" : "transparent"}`,
                        color: selectedCategories.includes(category)
                          ? (isDark ? "#ffffff" : "#047857")
                          : (isDark ? "#e2e8f0" : "#475569"),
                        opacity: isEnabled ? 1 : 0.4,
                        transition: "all 0.2s",
                        fontSize: "14px"
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(category)}
                        onChange={() => isEnabled && toggleCategory(category)}
                        disabled={!isEnabled}
                        style={{ display: "none" }}
                      />
                      <span style={{ textTransform: "capitalize" }}>{category}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <button
              onClick={onBack}
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                background: "transparent",
                color: isDark ? "#e2e8f0" : "#1e293b",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleStartSession}
              style={{
                padding: "12px 32px",
                borderRadius: "12px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
              }}
            >
              Start Session
            </button>
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                background: showStatistics ? (isDark ? "#334155" : "#e2e8f0") : "transparent",
                color: isDark ? "#e2e8f0" : "#1e293b",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {showStatistics ? "Hide Statistics" : "Show Statistics"}
            </button>
          </div>

          {showStatistics && statistics && (
            <div style={{ 
              marginTop: "48px", 
              width: "100%", 
              background: isDark ? "#1e293b" : "#ffffff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>Statistics</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "32px" }}>
                <div style={{ padding: "16px", background: isDark ? "#0f172a" : "#f8fafc", borderRadius: "12px" }}>
                  <div style={{ fontSize: "14px", opacity: 0.7 }}>Total Attempts</div>
                  <div style={{ fontSize: "32px", fontWeight: "bold", color: "#3b82f6" }}>{statistics.total_attempts}</div>
                </div>
                <div style={{ padding: "16px", background: isDark ? "#0f172a" : "#f8fafc", borderRadius: "12px" }}>
                  <div style={{ fontSize: "14px", opacity: 0.7 }}>Total Typos</div>
                  <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ef4444" }}>{statistics.total_typos}</div>
                </div>
                <div style={{ padding: "16px", background: isDark ? "#0f172a" : "#f8fafc", borderRadius: "12px" }}>
                  <div style={{ fontSize: "14px", opacity: 0.7 }}>Words Learned</div>
                  <div style={{ fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>
                    {statistics.words_learned} <span style={{ fontSize: "16px", opacity: 0.5 }}>/ {statistics.total_words}</span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: isDark ? "#334155" : "#e2e8f0", marginTop: "8px", borderRadius: "2px" }}>
                    <div style={{ 
                      width: `${statistics.total_words > 0 ? (statistics.words_learned / statistics.total_words) * 100 : 0}%`, 
                      height: "100%", 
                      background: "#10b981", 
                      borderRadius: "2px" 
                    }} />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
                {/* Absolute Worst */}
                {statistics.top_typo_words.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Most Typos (Absolute)</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {statistics.top_typo_words.map((word, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ width: "120px", fontWeight: "500" }}>{word.english}</div>
                          <div style={{ flex: 1, height: "24px", background: isDark ? "#0f172a" : "#f1f5f9", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                            <div style={{ 
                              width: `${Math.min((word.typos / Math.max(...statistics.top_typo_words.map(w => w.typos))) * 100, 100)}%`, 
                              height: "100%", 
                              background: "#ef4444",
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: "8px"
                            }} />
                            <div style={{ position: "absolute", top: 0, left: "8px", height: "100%", display: "flex", alignItems: "center", fontSize: "12px", fontWeight: "bold", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                              {word.typos} typos
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relative Worst */}
                {statistics.top_ratio_words && statistics.top_ratio_words.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Highest Error Rate</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {statistics.top_ratio_words.map((word, idx) => {
                        const ratio = word.typos / word.attempts;
                        const maxRatio = Math.max(...statistics.top_ratio_words.map(w => w.typos / w.attempts));
                        
                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "120px", fontWeight: "500" }}>{word.english}</div>
                            <div style={{ flex: 1, height: "24px", background: isDark ? "#0f172a" : "#f1f5f9", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                              <div style={{ 
                                width: `${Math.min((ratio / maxRatio) * 100, 100)}%`, 
                                height: "100%", 
                                background: "#f59e0b",
                                display: "flex",
                                alignItems: "center",
                                paddingLeft: "8px"
                              }} />
                              <div style={{ position: "absolute", top: 0, left: "8px", height: "100%", display: "flex", alignItems: "center", fontSize: "12px", fontWeight: "bold", color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                {ratio.toFixed(2)} ratio ({word.attempts} att)
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
        Loading word...
      </div>
    );
  }

  const maxLength = targetWord.length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Handle deletion (Backspace)
    if (rawVal.length < userInput.length) {
      let newVal = rawVal;
      // If we deleted a char, and the new end is a space, delete spaces too
      while (newVal.length > 0 && newVal.endsWith(" ")) {
        newVal = newVal.slice(0, -1);
      }
      setUserInput(newVal);
      return;
    }

    // Handle addition (Typing)
    const newChar = rawVal.slice(-1);
    
    // If user typed space, ignore it (we auto-fill spaces)
    if (newChar === ' ') {
      return;
    }

    // Determine the position we are trying to fill
    let targetIndex = userInput.length;
    
    // If we are not at the start, check if the previous character was correct
    if (userInput.length > 0) {
      const lastIndex = userInput.length - 1;
      const lastChar = userInput[lastIndex];
      const expectedLastChar = targetWord[lastIndex];
      
      // If the last character was wrong, we want to overwrite it (stay at same position)
      if (lastChar.toLowerCase() !== expectedLastChar.toLowerCase()) {
        targetIndex = lastIndex;
      }
    }

    // Check for spaces at current targetIndex (only if appending)
    let prefix = "";
    if (targetIndex === userInput.length) {
        let tempIndex = targetIndex;
        while (tempIndex < targetWord.length && targetWord[tempIndex] === ' ') {
            prefix += ' ';
            tempIndex++;
        }
        targetIndex = tempIndex;
    }

    // If we are beyond the word length (and not overwriting the last char), ignore
    if (targetIndex >= targetWord.length) {
      return;
    }

    // Calculate the new input string
    let newUserInput;
    if (targetIndex >= userInput.length) {
      // Appending (with potential spaces prefix)
      newUserInput = userInput + prefix + newChar;
    } else {
      // Replacing (overwriting the wrong character)
      newUserInput = userInput.slice(0, targetIndex) + newChar;
      
      // If we just filled up to the end, check for trailing spaces to auto-fill
      if (newUserInput.length === targetIndex + 1) {
          let nextIdx = newUserInput.length;
          while (nextIdx < targetWord.length && targetWord[nextIdx] === ' ') {
              newUserInput += ' ';
              nextIdx++;
          }
      }
    }

    // Update Score
    if (newChar.toLowerCase() === targetWord[targetIndex].toLowerCase()) {
      setScore(s => s + 1);
      playClickSound();
    } else {
      setScore(s => s - 1);
      setTypoCount(c => c + 1);
      playErrorSound();
    }

    setUserInput(newUserInput);
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
          onClick={handleEndSession}
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
          End Session
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
        maxWidth: "1200px",
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
            flexWrap: "wrap",
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
            if (char === " ") {
               return <div key={index} style={{ width: "24px" }}></div>; // Spacer
            }

            const userChar = userInput[index] || "";
            const isCorrect = userChar.toLowerCase() === char.toLowerCase();
            const hasChar = userChar !== "";
            
            // Determine active index
            let activeIndex = userInput.length;
            if (userInput.length > 0) {
              const lastIdx = userInput.length - 1;
              const lastChar = userInput[lastIdx];
              const expected = targetWord[lastIdx];
              if (lastChar.toLowerCase() !== expected.toLowerCase()) {
                activeIndex = lastIdx;
              }
            }
            
            // If active index is a space, move to next
            while (activeIndex < targetWord.length && targetWord[activeIndex] === ' ') {
                activeIndex++;
            }

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
            }
            
            if (index === activeIndex) {
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
          

        </div>

      </div>
    </div>
  );
};
