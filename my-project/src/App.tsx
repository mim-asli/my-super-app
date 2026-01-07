import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// تعریف می‌کنیم که یادداشت چه شکلیه
interface Note {
  id: number;
  title: string;
  content: string;
}

function App() {
  const [stats, setStats] = useState("System ready...");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]); // لیست یادداشت‌ها

  // وقتی برنامه لود میشه، این تابع اجرا میشه
  useEffect(() => {
    fetchNotes();
  }, []);

  async function checkSystem() {
    const result = await invoke("get_system_stats");
    setStats(result as string);
  }

  // تابع گرفتن لیست از Rust
  async function fetchNotes() {
    try {
      const result = await invoke("get_notes");
      setNotes(result as Note[]);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  }

  async function saveNote() {
    if (!noteText) return;
    try {
      await invoke("add_note", { text: noteText });
      setNoteText(""); 
      fetchNotes(); // بعد از ذخیره، لیست رو دوباره بگیر تا آپدیت بشه
    } catch (error) {
      setStats("Error: " + error);
    }
  }

  return (
    <div className="container p-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Super App Notes</h1>

      {/* بخش ورودی */}
      <div className="card mb-8 flex gap-2">
        <input
          type="text"
          placeholder="Write a new note..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="p-3 rounded text-black flex-grow"
        />
        <button onClick={saveNote} className="btn bg-green-600">Save</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {/* ستون چپ: لیست یادداشت‌ها */}
        <div className="bg-slate-800 p-4 rounded-xl h-96 overflow-y-auto">
          <h2 className="text-xl mb-4 text-gray-300">Your Notes</h2>
          {notes.length === 0 ? (
            <p className="text-gray-500">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-slate-700 p-3 mb-2 rounded border-l-4 border-blue-500 text-left">
                <p className="text-white">{note.content}</p>
                <span className="text-xs text-gray-400">ID: {note.id}</span>
              </div>
            ))
          )}
        </div>

        {/* ستون راست: وضعیت سیستم */}
        <div className="bg-slate-800 p-4 rounded-xl h-fit">
          <h2 className="text-xl mb-4 text-gray-300">System Status</h2>
          <p className="mb-4 text-yellow-300 font-mono">{stats}</p>
          <button onClick={checkSystem} className="btn w-full">Update RAM</button>
        </div>
      </div>
    </div>
  );
}

export default App;