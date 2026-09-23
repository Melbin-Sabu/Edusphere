import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";

const AIChatbot = ({ documentContext, onCloseContext, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([
    { role: "model", text: "Hello! I am your AI Academic Assistant. I can help you with NEET and JEE topics like Physics, Chemistry, Biology, and Mathematics. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (documentContext && !isOpen) {
      setIsOpen(true);
    }
  }, [documentContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/ai/chat",
        {
          message: userMessage,
          noteId: documentContext?._id || null,
          history: history.filter(h => h.role !== "model" || h.text !== "Hello! I am your AI Academic Assistant. I can help you with NEET and JEE topics like Physics, Chemistry, Biology, and Mathematics. How can I help you today?")
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory((prev) => [...prev, { role: "model", text: res.data.answer }]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMsg = err.response?.data?.message || "Sorry, I encountered an error processing your request. Please try again.";
      setHistory((prev) => [
        ...prev,
        { role: "model", text: errorMsg }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && !inline && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50 flex items-center justify-center"
        >
          <FaRobot size={24} />
        </button>
      )}

      {/* Chat Window */}
      {(isOpen || inline) && (
        <div className={inline ? "w-full h-full bg-white flex flex-col" : "fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200"} style={inline ? {} : { height: "500px" }}>
          {/* Header */}
          <div className="bg-purple-600 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-2">
              <FaRobot size={20} />
              <div>
                <h3 className="font-bold">AI Academic Assistant</h3>
                <p className="text-xs text-purple-200">NEET & JEE Support</p>
              </div>
            </div>
            {!inline && (
              <button 
                onClick={() => {
                  setIsOpen(false);
                  if (onCloseContext) onCloseContext();
                }} 
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Document Context Banner */}
          {documentContext && (
            <div className="bg-blue-50 border-b border-blue-100 p-2 text-xs text-blue-800 flex justify-between items-center shrink-0">
              <span className="truncate">Asking about: <strong>{documentContext.title}</strong></span>
              {!inline && (
                <button 
                  onClick={onCloseContext}
                  className="ml-2 text-blue-500 hover:text-blue-700 font-bold"
                  title="Clear Context"
                >
                  &times;
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
            {history.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white self-end rounded-br-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 self-start rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bg-white border border-gray-200 text-gray-500 self-start rounded-2xl rounded-bl-sm p-3 text-sm shadow-sm max-w-[85%]">
                <div className="flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200 shrink-0">
            <form onSubmit={handleSend} className="flex relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={documentContext ? "Ask about this document..." : "Ask a NEET/JEE question..."}
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={!message.trim() || loading}
                className="absolute right-1 top-1 bottom-1 p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaPaperPlane size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
