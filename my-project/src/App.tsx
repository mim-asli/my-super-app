import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [stats, setStats] = useState("System ready...");
  const [noteText, setNoteText] = useState(""); // متنی که کاربر تایپ می‌کنه

  // تابع چک کردن رم
  async function checkSystem() {
    const result = await invoke("get_system_stats");
    setStats(result as string);
  }

  // تابع ذخیره یادداشت
  async function saveNote() {
    if (!noteText) return; // اگه خالی بود کاری نکن
    try {
      // دستور add_note رو صدا می‌زنیم و متن رو بهش میدیم
      const result = await invoke("add_note", { text: noteText });
      setStats(result as string); // پیام موفقیت رو نشون بده
      setNoteText(""); // کادر رو خالی کن
    } catch (error) {
      setStats("Error: " + error);
    }
  }

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Super App Database</h1>

      {/* بخش مانیتورینگ */}
      <div className="card mb-8">
        <p className="mb-2 text-yellow-300">{stats}</p>
        <button onClick={checkSystem} className="btn">Check RAM</button>
      </div>

      {/* بخش یادداشت نویسی */}
      <div className="card flex flex-col gap-3">
        <input
          type="text"
          placeholder="Write something here..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="p-3 rounded text-black"
        />
        <button onClick={saveNote} className="btn bg-green-600 hover:bg-green-700">
          Save to Database
        </button>
      </div>
    </div>
  );
}

export default App;