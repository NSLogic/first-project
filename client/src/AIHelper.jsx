import React, { useState } from "react";

const AIHelper = () => {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const getAIAdvice = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://tastytreats.onrender.com/api/ai/recommend",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt:
              "Give me a quick 1-sentence cooking tip for an amateur chef.",
          }),
        },
      );
      const data = await res.json();
      setSuggestion(data.response);
    } catch (err) {
      setSuggestion("AI is taking a break!");
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
      <button onClick={getAIAdvice} disabled={loading}>
        {loading ? "Thinking..." : "Ask for a Tip"}
      </button>
      {suggestion && (
        <p style={{ marginTop: "10px", fontStyle: "italic" }}>{suggestion}</p>
      )}
    </div>
  );
};

export default AIHelper;
