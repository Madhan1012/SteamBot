import React, { useState, useRef, useEffect } from "react";

export default function App() {
  // Application & Theme States
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Interactive UI States
  const [showSqlMap, setShowSqlMap] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Default suggestions shown on empty state
  const quickSuggestions = [
    "Show top 5 highest order values in last 60 days",
    "List active games under $20",
    "Get total counts grouped by category"
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-size input box based on content
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Toggle SQL Visibility per message
  const toggleSql = (id) => {
    setShowSqlMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Export Table Data to CSV
  const exportToCSV = (data, filename = "query_results.csv") => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy helper with feedback timer
  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Send message API trigger
  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim() || isLoading) return;

    const userMsgId = `usr_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      content: queryText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText })
      });

      if (!res.ok) {
        throw new Error(`Server status: ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg = {
        id: `ast_${Date.now()}`,
        role: "assistant",
        content:
          data.results && data.results.length > 0
            ? `Retrieved ${data.results.length} result(s) matching your request:`
            : "No records found matching your query parameters.",
        sql: data.sql_query || null,
        tableData: Array.isArray(data.results) ? data.results : []
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Database Engine API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Error communicating with database API engine. Please check your connection."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`w-full h-screen flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? "bg-[#09090b] text-[#f4f4f5]" : "bg-white text-[#18181b]"}`}>
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>

      {/* Header Bar */}
      <header className={`h-14 border-b px-6 flex items-center justify-between shrink-0 z-10 transition-colors duration-300 ${darkMode ? "border-[#27272a] bg-[#09090b]" : "border-[#e4e4e7] bg-white"}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center shadow-xs ${darkMode ? "bg-[#f4f4f5] text-[#09090b]" : "bg-[#18181b] text-white"}`}>
            <span className="material-symbols-outlined text-[18px]">database</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">
            Database Chat Engine
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg border transition-all active:scale-95 ${
            darkMode
              ? "border-[#27272a] bg-[#18181b] text-[#f4f4f5] hover:bg-[#27272a]"
              : "border-[#e4e4e7] bg-[#f4f4f5] text-[#18181b] hover:bg-[#e4e4e7]"
          }`}
          title="Toggle Dark/Light Mode"
        >
          <span className="material-symbols-outlined text-[18px]">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-7">
        <div className="max-w-4xl mx-auto space-y-7">
          {messages.length === 0 ? (
            /* Empty State with Quick Suggestions */
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 animate-fade-in">
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${darkMode ? "bg-[#18181b] border-[#27272a] text-[#a1a1aa]" : "bg-[#f4f4f5] border-[#e4e4e7] text-[#71717a]"}`}>
                <span className="material-symbols-outlined text-[24px]">chat</span>
              </div>
              <div>
                <h2 className="text-base font-semibold">Database Query Assistant</h2>
                <p className={`text-xs mt-1 max-w-sm ${darkMode ? "text-[#a1a1aa]" : "text-[#71717a]"}`}>
                  Ask questions in plain English to execute database queries and render results in real time.
                </p>
              </div>

              {/* Quick Suggestions Chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg pt-2">
                {quickSuggestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className={`text-xs px-3 py-1.5 rounded-lg border text-left transition-all active:scale-95 ${
                      darkMode
                        ? "border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[#e4e4e7]"
                        : "border-[#e4e4e7] bg-[#fafafa] hover:bg-[#f4f4f5] text-[#3f3f46]"
                    }`}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages Stream */
            messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold tracking-wider uppercase">User</span>
                      <span className={`text-[11px] font-mono ${darkMode ? "text-[#71717a]" : "text-[#a1a1aa]"}`}>{msg.time}</span>
                    </div>
                    {/* User Text Bubble with Subtle Monochrome Tint */}
                    <div className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
                      darkMode
                        ? "bg-[#18181b]/70 border-[#27272a] text-[#f4f4f5]"
                        : "bg-[#f4f4f5]/80 border-[#e4e4e7] text-[#18181b]"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="space-y-3.5 pt-1 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-blue-500">Assistant</span>
                  </div>
                  <div className="text-sm leading-relaxed">{msg.content}</div>

                  {/* SQL Accordion Toggle */}
                  {msg.sql && (
                    <div className={`rounded-lg border overflow-hidden transition-all duration-200 ${darkMode ? "border-[#27272a] bg-[#121215]" : "border-[#e4e4e7] bg-[#fafafa]"}`}>
                      <div
                        onClick={() => toggleSql(msg.id)}
                        className={`px-3.5 py-2 flex items-center justify-between transition-colors select-none cursor-pointer ${darkMode ? "hover:bg-[#18181b]" : "hover:bg-[#f4f4f5]"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-[16px] transition-transform duration-200"
                            style={{ transform: showSqlMap[msg.id] ? "rotate(0deg)" : "rotate(-90deg)" }}
                          >
                            expand_more
                          </span>
                          <span className="text-[11px] font-mono font-medium uppercase tracking-wider">
                            Generated SQL Query
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(msg.sql, `sql_${msg.id}`);
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono transition-all ${
                            darkMode
                              ? "border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-[#e4e4e7]"
                              : "border-[#e4e4e7] bg-white hover:bg-[#f4f4f5] text-[#52525b]"
                          }`}
                          type="button"
                        >
                          <span className={`material-symbols-outlined text-[13px] ${copiedId === `sql_${msg.id}` ? "text-emerald-500" : ""}`}>
                            {copiedId === `sql_${msg.id}` ? "check" : "content_copy"}
                          </span>
                          <span>{copiedId === `sql_${msg.id}` ? "Copied SQL" : "Copy SQL"}</span>
                        </button>
                      </div>

                      {showSqlMap[msg.id] && (
                        <div className={`p-3.5 border-t overflow-x-auto font-mono text-xs leading-relaxed select-all ${
                          darkMode ? "border-[#27272a] bg-[#09090b] text-emerald-400" : "border-[#e4e4e7] bg-[#f4f4f5] text-[#18181b]"
                        }`}>
                          <pre><code>{msg.sql}</code></pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic Results Table */}
                  {msg.tableData && msg.tableData.length > 0 && (
                    <div className={`rounded-lg border overflow-hidden shadow-xs ${darkMode ? "border-[#27272a] bg-[#121215]" : "border-[#e4e4e7] bg-white"}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className={`border-b uppercase tracking-wider text-[10px] ${darkMode ? "bg-[#18181b] border-[#27272a] text-[#a1a1aa]" : "bg-[#fafafa] border-[#e4e4e7] text-[#71717a]"}`}>
                              {Object.keys(msg.tableData[0]).map((colName) => (
                                <th key={colName} className="py-2.5 px-3.5 font-medium">
                                  {colName}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${darkMode ? "divide-[#27272a]" : "divide-[#e4e4e7]"}`}>
                            {msg.tableData.map((row, rIdx) => (
                              <tr key={rIdx} className={`transition-colors duration-150 ${darkMode ? "hover:bg-[#18181b]/60" : "hover:bg-[#f4f4f5]/70"}`}>
                                {Object.keys(msg.tableData[0]).map((colName, cIdx) => (
                                  <td key={cIdx} className="py-2.5 px-3.5 whitespace-nowrap">
                                    {row[colName] !== null && row[colName] !== undefined ? String(row[colName]) : "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Export & Copy Toolbar */}
                      <div className={`px-3 py-2 border-t flex items-center justify-end gap-2 text-xs ${darkMode ? "bg-[#18181b] border-[#27272a]" : "bg-[#fafafa] border-[#e4e4e7]"}`}>
                        <button
                          onClick={() => exportToCSV(msg.tableData)}
                          className={`px-2.5 py-1 rounded border transition-all flex items-center gap-1.5 text-[11px] font-mono ${
                            darkMode
                              ? "border-[#27272a] bg-[#09090b] hover:bg-[#27272a] text-[#e4e4e7]"
                              : "border-[#e4e4e7] bg-white hover:bg-[#f4f4f5] text-[#52525b]"
                          }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          <span>Export CSV</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(JSON.stringify(msg.tableData, null, 2), `json_${msg.id}`)}
                          className={`px-2.5 py-1 rounded border transition-all flex items-center gap-1.5 text-[11px] font-mono ${
                            darkMode
                              ? "border-[#27272a] bg-[#09090b] hover:bg-[#27272a] text-[#e4e4e7]"
                              : "border-[#e4e4e7] bg-white hover:bg-[#f4f4f5] text-[#52525b]"
                          }`}
                          type="button"
                        >
                          <span className={`material-symbols-outlined text-[14px] ${copiedId === `json_${msg.id}` ? "text-emerald-500" : ""}`}>
                            {copiedId === `json_${msg.id}` ? "check" : "data_object"}
                          </span>
                          <span>{copiedId === `json_${msg.id}` ? "Copied JSON" : "Copy JSON"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Processing Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs font-mono text-[#a1a1aa] py-2 animate-fade-in">
              <span className="material-symbols-outlined text-[18px] animate-spin text-blue-500">progress_activity</span>
              Executing SQL query on engine...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Dynamic Auto-Sizing Input Footer */}
      <footer className="p-4 md:px-8 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`relative rounded-xl border p-2.5 transition-all duration-200 shadow-xs focus-within:ring-2 ${
              darkMode
                ? "bg-[#121215] border-[#27272a] focus-within:border-[#52525b] focus-within:ring-white/5"
                : "bg-white border-[#d4d4d8] focus-within:border-[#18181b] focus-within:ring-black/5"
            }`}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={`w-full bg-transparent text-sm pr-12 pl-1 py-1 leading-relaxed max-h-44 min-h-[32px] border-none outline-none focus:outline-none focus:ring-0 resize-none ${
                darkMode ? "text-white placeholder-[#71717a]" : "text-[#18181b] placeholder-[#a1a1aa]"
              }`}
              placeholder="Ask your database in plain English..."
              rows="1"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-2.5 bottom-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                inputValue.trim() && !isLoading
                  ? darkMode
                    ? "bg-white text-[#09090b] hover:bg-[#e4e4e7] cursor-pointer active:scale-95"
                    : "bg-[#18181b] text-white hover:bg-[#27272a] cursor-pointer active:scale-95"
                  : "bg-gray-500/20 text-gray-400 cursor-not-allowed"
              }`}
              title="Send Message"
            >
              <span className="material-symbols-outlined text-[16px] font-semibold">
                arrow_upward
              </span>
            </button>
          </form>

          <div className={`text-center text-[11px] font-mono mt-2 select-none ${darkMode ? "text-[#71717a]" : "text-[#a1a1aa]"}`}>
            Press{" "}
            <kbd className={`px-1 py-0.5 rounded border text-[10px] ${darkMode ? "bg-[#18181b] border-[#27272a] text-[#a1a1aa]" : "bg-[#f4f4f5] border-[#e4e4e7] text-[#71717a]"}`}>
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className={`px-1 py-0.5 rounded border text-[10px] ${darkMode ? "bg-[#18181b] border-[#27272a] text-[#a1a1aa]" : "bg-[#f4f4f5] border-[#e4e4e7] text-[#71717a]"}`}>
              Shift + Enter
            </kbd>{" "}
            for new line
          </div>
        </div>
      </footer>
    </div>
  );
}