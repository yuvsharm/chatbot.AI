import React, { useState } from "react";
import axios from "axios"; // Axios import

function Chatbot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const generateAnswer = async () => {
    if (!question.trim()) return alert("Please enter a question!");

    setLoading(true);
    setAnswer(""); 

    try {
      const response = await axios.post("GEN_AI_API_ENDPOINT_HERE", {
        query: question, // API ke format ke hisaab se update karo
        key: "YOUR_GEN_AI_API_KEY", // Actual API key replace karo
      });

      setAnswer(response.data.answer || "No response received.");
    } catch (error) {
      console.error("Error:", error);
      setAnswer("Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Chatbot AI</h2>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your question..."
      />
      <button onClick={generateAnswer} disabled={loading}>
        {loading ? "Loading..." : "Get Answer"}
      </button>
      <p>AI Answer: {answer}</p>
    </div>
  );
}

export default Chatbot;