import { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { playClickSound, playErrorSound } from "../utils/sound";

interface MathActivityProps {
  onBack: () => void;
}

interface MathStats {
  total_attempts: number;
  operations: Record<string, { attempts: number; false_attempts: number }>;
}

interface HistoryItem {
  id: number;
  equation: string;
  isCorrect: boolean;
}

type Operation = "+" | "-" | "*" | "/" | "/r";

export const MathActivity = ({ onBack }: MathActivityProps) => {
  const { token } = useAuth();
  const [gameState, setGameState] = useState<"config" | "playing">("config");
  const [operation, setOperation] = useState<Operation>("+");
  const [maxNumber, setMaxNumber] = useState<number>(20);
  const [stats, setStats] = useState<MathStats | null>(null);
  
  // Game state
  const [operand1, setOperand1] = useState(0);
  const [operand2, setOperand2] = useState(0);
  const [userResult, setUserResult] = useState("");
  const [userRemainder, setUserRemainder] = useState("");
  const [falseAttempts, setFalseAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect">("none");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gameState === "config") {
      fetchStats();
    } else {
      generateProblem();
      setHistory([]);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing" && inputRef.current && feedback !== "correct") {
      inputRef.current.focus();
    }
  }, [operand1, operand2, gameState, feedback]);

  // Spacebar listener for skipping delay
  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      if (feedback === "correct" && e.code === "Space") {
        e.preventDefault();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        generateProblem();
      }
    };

    window.addEventListener("keydown", handleSpacebar);
    return () => window.removeEventListener("keydown", handleSpacebar);
  }, [feedback]);

  const fetchStats = async () => {
    try {
      let apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      if (apiBase.endsWith("/")) apiBase = apiBase.slice(0, -1);

      const response = await fetch(`${apiBase}/math/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const generateProblem = () => {
    let op1 = 0;
    let op2 = 0;

    switch (operation) {
      case "+":
        // op1 + op2 <= maxNumber
        op1 = Math.floor(Math.random() * (maxNumber + 1));
        op2 = Math.floor(Math.random() * (maxNumber - op1 + 1));
        break;
      case "-":
        // op1 <= maxNumber, op1 - op2 >= 0
        op1 = Math.floor(Math.random() * (maxNumber + 1));
        op2 = Math.floor(Math.random() * (op1 + 1));
        break;
      case "*":
        // op1 * op2 <= maxNumber
        op1 = Math.floor(Math.random() * (maxNumber + 1));
        if (op1 === 0) {
            op2 = Math.floor(Math.random() * (maxNumber + 1));
        } else {
            op2 = Math.floor(Math.random() * (Math.floor(maxNumber / op1) + 1));
        }
        break;
      case "/":
        // op1 <= maxNumber, op1 % op2 == 0, op2 != 0
        // Easier to generate result and op2, then op1
        // result * op2 = op1 <= maxNumber
        const result = Math.floor(Math.random() * (maxNumber + 1));
        if (result === 0) {
             // if result is 0, op1 is 0. op2 can be anything > 0
             op2 = Math.floor(Math.random() * maxNumber) + 1;
             op1 = 0;
        } else {
             op2 = Math.floor(Math.random() * (Math.floor(maxNumber / result))) + 1;
             op1 = result * op2;
        }
        // Avoid division by zero just in case logic slips
        if (op2 === 0) op2 = 1;
        break;
      case "/r":
        // op1 <= maxNumber, op2 != 0
        op1 = Math.floor(Math.random() * (maxNumber + 1));
        op2 = Math.floor(Math.random() * (maxNumber - 1)) + 1; // 1 to maxNumber
        // Ensure op2 <= op1? Not necessarily, 3 / 5 = 0 r 3
        break;
    }

    setOperand1(op1);
    setOperand2(op2);
    setUserResult("");
    setUserRemainder("");
    setFalseAttempts(0);
    setFeedback("none");
  };

  const addToHistory = (isCorrect: boolean) => {
    const opSymbol = operation === "/r" ? "÷" : operation === "/" ? "÷" : operation === "*" ? "×" : operation;
    let equation = `${operand1} ${opSymbol} ${operand2} = ${userResult}`;
    if (operation === "/r") {
      equation += ` (rem ${userRemainder || 0})`;
    }
    
    setHistory(prev => {
      const newItem: HistoryItem = {
        id: Date.now(),
        equation,
        isCorrect
      };
      return [newItem, ...prev].slice(0, 5);
    });
  };

  const checkAnswer = async () => {
    let correct = false;
    let expectedResult = 0;
    let expectedRemainder = 0;

    switch (operation) {
      case "+":
        expectedResult = operand1 + operand2;
        correct = parseInt(userResult) === expectedResult;
        break;
      case "-":
        expectedResult = operand1 - operand2;
        correct = parseInt(userResult) === expectedResult;
        break;
      case "*":
        expectedResult = operand1 * operand2;
        correct = parseInt(userResult) === expectedResult;
        break;
      case "/":
        expectedResult = operand1 / operand2;
        correct = parseInt(userResult) === expectedResult;
        break;
      case "/r":
        expectedResult = Math.floor(operand1 / operand2);
        expectedRemainder = operand1 % operand2;
        correct = parseInt(userResult) === expectedResult && parseInt(userRemainder) === expectedRemainder;
        break;
    }

    addToHistory(correct);

    if (correct) {
      playClickSound();
      setFeedback("correct");
      // Record attempt
      try {
        let apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        if (apiBase.endsWith("/")) apiBase = apiBase.slice(0, -1);

        await fetch(`${apiBase}/math/attempt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            operation,
            operand1,
            operand2,
            result: parseInt(userResult), // Note: for /r this only sends quotient. Schema has remainder field.
            remainder: operation === "/r" ? parseInt(userRemainder) : null,
            max_number: maxNumber,
            false_attempts: falseAttempts,
          }),
        });
      } catch (error) {
        console.error("Failed to record attempt", error);
      }

      timeoutRef.current = setTimeout(() => {
        generateProblem();
      }, 5000);
    } else {
      playErrorSound();
      setFeedback("incorrect");
      setFalseAttempts((prev) => prev + 1);
      // Focus back on input
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      checkAnswer();
    }
  };

  if (gameState === "config") {
    return (
      <div style={{ padding: "2rem", paddingTop: "88px", maxWidth: "800px", margin: "0 auto", color: "#e2e8f0" }}>
        <button 
          onClick={onBack} 
          style={{ 
            marginBottom: "2rem", 
            padding: "0.5rem 1rem",
            background: "#1e293b", 
            border: "1px solid #334155", 
            borderRadius: "0.5rem",
            color: "#94a3b8", 
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Math Activity Configuration</h1>
        
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Select Operation</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {(["+", "-", "*", "/", "/r"] as Operation[]).map((op) => (
              <button
                key={op}
                onClick={() => setOperation(op)}
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.5rem",
                  background: operation === op ? "#3b82f6" : "#1e293b",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                {op === "/r" ? "÷ (rem)" : op === "/" ? "÷" : op === "*" ? "×" : op}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Max Number</h2>
          <div style={{ display: "flex", gap: "1rem" }}>
            {[10, 20, 50, 100, 1000].map((num) => (
              <button
                key={num}
                onClick={() => setMaxNumber(num)}
                style={{
                  padding: "0.5rem 1rem",
                  background: maxNumber === num ? "#3b82f6" : "#1e293b",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div style={{ marginBottom: "2rem", background: "#1e293b", padding: "1rem", borderRadius: "0.5rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>Statistics</h2>
            <p>Total Attempts: {stats.total_attempts}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              {Object.entries(stats.operations).map(([op, stat]) => (
                <div key={op} style={{ background: "#0f172a", padding: "0.5rem", borderRadius: "0.25rem" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{op === "/r" ? "÷ (rem)" : op === "/" ? "÷" : op === "*" ? "×" : op}</div>
                  <div style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                    Attempts: {stat.attempts}<br/>
                    Mistakes: {stat.false_attempts}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setGameState("playing")}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.25rem",
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "#0f172a", 
      color: "#e2e8f0",
      fontFamily: "Inter, sans-serif"
    }}>
      {/* History Display */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column-reverse", 
        gap: "0.5rem", 
        marginBottom: "2rem",
        height: "150px",
        justifyContent: "flex-start",
        opacity: 0.8
      }}>
        {history.map((item) => (
          <div 
            key={item.id} 
            style={{ 
              fontSize: "1.5rem", 
              color: item.isCorrect ? "#22c55e" : "#ef4444",
              textAlign: "center"
            }}
          >
            {item.equation}
          </div>
        ))}
      </div>

      <div style={{ fontSize: "4rem", marginBottom: "2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "1rem" }}>
        <span>{operand1}</span>
        <span style={{ color: "#3b82f6" }}>
          {operation === "/r" ? "÷" : operation === "/" ? "÷" : operation === "*" ? "×" : operation}
        </span>
        <span>{operand2}</span>
        <span>=</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
            ref={inputRef}
            type="number"
            value={userResult}
            onChange={(e) => setUserResult(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
                width: "120px",
                fontSize: "4rem",
                background: "transparent",
                border: "none",
                borderBottom: `4px solid ${feedback === "incorrect" ? "#ef4444" : feedback === "correct" ? "#22c55e" : "#e2e8f0"}`,
                color: "#e2e8f0",
                textAlign: "center",
                outline: "none",
            }}
            />
            {operation === "/r" && (
                <>
                    <span style={{ fontSize: "2rem", color: "#94a3b8" }}>rem</span>
                    <input
                    type="number"
                    value={userRemainder}
                    onChange={(e) => setUserRemainder(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: "100px",
                        fontSize: "3rem",
                        background: "transparent",
                        border: "none",
                        borderBottom: `4px solid ${feedback === "incorrect" ? "#ef4444" : feedback === "correct" ? "#22c55e" : "#e2e8f0"}`,
                        color: "#e2e8f0",
                        textAlign: "center",
                        outline: "none",
                    }}
                    placeholder="0"
                    />
                </>
            )}
            <button
              onClick={checkAnswer}
              style={{
                marginLeft: "1rem",
                width: "80px",
                height: "80px",
                fontSize: "2.5rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              }}
            >
              ↵
            </button>
        </div>
      </div>

      {feedback === "incorrect" && (
        <div style={{ color: "#ef4444", fontSize: "1.5rem", marginTop: "1rem" }}>
          Try again!
        </div>
      )}
      
      {feedback === "correct" && (
        <div style={{ color: "#22c55e", fontSize: "1.5rem", marginTop: "1rem" }}>
          Correct!
        </div>
      )}

      <button
        onClick={() => setGameState("config")}
        style={{
          marginTop: "4rem",
          padding: "0.75rem 1.5rem",
          background: "#1e293b",
          color: "#94a3b8",
          border: "1px solid #334155",
          borderRadius: "0.5rem",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        End Session
      </button>
    </div>
  );
};
