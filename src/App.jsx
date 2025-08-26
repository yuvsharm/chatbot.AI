import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function App() {
  const [question, setQuestion] = useState("");
  const [typingAnswer, setTypingAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("chatbot-theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("chatbot-theme", theme);
  }, [theme]);

  function formatAnswerToHTML(text) {
    // Add emojis, bold, italic, underline, and color spans
    return text
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.*?)\*/g, "<i>$1</i>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/\[red\](.*?)\[\/red\]/g, "<span class='red'>$1</span>")
      .replace(/\[blue\](.*?)\[\/blue\]/g, "<span class='blue'>$1</span>")
      .replace(/\[green\](.*?)\[\/green\]/g, "<span class='green'>$1</span>");
  }

  async function generateAnswer(customQuestion = null) {
    const q = (customQuestion || question).trim();
    if (!q) {
      alert("Please enter a question.");
      return;
    }

    setLoading(true);
    setTypingAnswer("");

    const shouldBeBrief =
      q.length < 30 &&
      !q.toLowerCase().includes("essay") &&
      !q.toLowerCase().includes("explain") &&
      !q.toLowerCase().includes("describe");

    const finalPrompt = shouldBeBrief
      ? `Answer this briefly and to the point: ${q}`
      : q;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCjG7aHcZSvFhWyLbqKE6_a09orDc8YRIA`,
        {
          contents: [{ parts: [{ text: finalPrompt }] }],
        }
      );

      let result = response.data.candidates[0].content.parts[0].text;

      if (shouldBeBrief && result.length > 300) {
        result = result.slice(0, 300) + "...";
      }

      const formattedHTML = formatAnswerToHTML(result);
      setTypingAnswer(formattedHTML);

      setHistory((prev) => [...prev, { question: q, answer: formattedHTML }]);
      fetchSuggestedQuestions(result);
    } catch (error) {
      console.error("Error:", error);
      setTypingAnswer("<i>Something went wrong while fetching the answer.</i>");
    }

    setLoading(false);
  }

  async function fetchSuggestedQuestions(answerText) {
    try {
      const followUpPrompt = `Suggest 3 short and simple follow-up questions only in 4-6 words each for this answer: "${answerText}". Give them as a plain list.`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCjG7aHcZSvFhWyLbqKE6_a09orDc8YRIA`,
        {
          contents: [{ parts: [{ text: followUpPrompt }] }],
        }
      );

      const suggestionText = res.data.candidates[0].content.parts[0].text;

      const parsed = suggestionText
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);

      setSuggestedQuestions(parsed);
    } catch (err) {
      console.error("Error getting suggestions:", err);
    }
  }

  function handleVoiceInput() {
    try {
      const recognition = new window.SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const speech = event.results[0][0].transcript;
        setQuestion(speech);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert("Voice input error: " + event.error);
      };

      recognition.start();
    } catch (err) {
      alert("Your browser does not support voice input.");
    }
  }

  function handleSuggestedQuestionClick(q) {
    setQuestion(q);
    generateAnswer(q);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      generateAnswer();
    }
  }

  return (
    <div className="app-container">
      <h1>Chatbot-AI</h1>

      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="theme-toggle">
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>

      {suggestedQuestions.length > 0 && (
        <div className="suggested-container">
          {suggestedQuestions.map((q, i) => (
            <button key={i} className="suggested-btn" onClick={() => handleSuggestedQuestionClick(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask your question here..."
        className="input-field"
      />

      <div className="button-group">
        <button onClick={handleVoiceInput}>🎤 Speak</button>
        <button onClick={() => generateAnswer()} disabled={loading}>
          {loading ? "Loading..." : "Ask Gemini"}
        </button>
        <button onClick={() => {
          setQuestion("");
          setTypingAnswer("");
          setHistory([]);
          setSuggestedQuestions([]);
        }}>
          Clear
        </button>
      </div>

      {typingAnswer && (
        <p className="ai-answer" dangerouslySetInnerHTML={{ __html: "🤖 <b>AI Answer:</b><br/>" + typingAnswer }} />
      )}

      {history.length > 0 && (
        <div className="history">
          <h2>🧠 Previous Q&A</h2>
          <ul>
            {history.map((entry, index) => (
              <li key={index}>
                <strong>🔹 You:</strong> {entry.question}<br />
                <strong>🤖 Gemini:</strong> <span dangerouslySetInnerHTML={{ __html: entry.answer }} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
