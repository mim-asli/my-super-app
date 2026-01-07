import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  // این متغیر مثل یک ظرف هست که متن رم توش قرار میگیره
  const [stats, setStats] = useState("Click the button...");

  // این تابع وقتی دکمه کلیک بشه اجرا میشه
  async function checkSystem() {
    setStats("Loading..."); // اول بزن لودینگ تا کاربر بفهمه یه خبریه
    // اینجا به Rust دستور میدیم و منتظر جواب میمونیم
    const result = await invoke("get_system_stats");
    // جواب رو میریزیم تو متغیر
    setStats(result as string);
  }

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-4">Super App Monitor</h1>
      
      <div className="p-6 bg-slate-800 rounded-xl shadow-lg text-white">
        <p className="mb-4 text-xl">{stats}</p>
        
        <button 
          onClick={checkSystem}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
        >
          Check RAM Usage
        </button>
      </div>
    </div>
  );
}

export default App;