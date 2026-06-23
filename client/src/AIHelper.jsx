import React, { useState } from "react";

const AIHelper = () => {
  const [userInput, setUserInput] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const getAIAdvice = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    setSuggestion("");

    try {
      const res = await fetch(
        "https://tastytreats.onrender.com/api/ai/recommend",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userInput }),
        },
      );

      const data = await res.json();
      setSuggestion(data.response);
    } catch (err) {
      setSuggestion("AI is taking a break! Please try again later.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        margin: "20px",
        padding: "15px",
        border: "1px solid #6200ea",
        borderRadius: "8px",
      }}
    >
      <h4>TastyTreats AI Chef</h4>
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Ask about recipes or feedback..."
        style={{ width: "70%", padding: "5px", marginRight: "5px" }}
      />

      <button onClick={getAIAdvice} disabled={loading}>
        {loading ? "Thinking..." : "Ask"}
      </button>

      {suggestion && (
        <p style={{ marginTop: "10px", fontStyle: "italic" }}>{suggestion}</p>
      )}
    </div>
  );
};

export default AIHelper;
