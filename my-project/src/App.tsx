import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  LayoutDashboard, 
  NotebookPen, 
  Settings, 
  Cpu, 
  Trash2, 
  Save 
} from "lucide-react"; // ایمپورت آیکون‌ها
import "./App.css";

// تعریف نوع داده یادداشت
interface Note {
  id: number;
  title: string;
  content: string;
}

function App() {
  // این متغیر تعیین می‌کنه الان کدوم صفحه بازه
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // State های مربوط به برنامه
  const [stats, setStats] = useState("Loading...");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");

  // لود اولیه
  useEffect(() => {
    checkSystem();
    fetchNotes();
    // تایمر برای آپدیت خودکار رم هر ۲ ثانیه
    const interval = setInterval(checkSystem, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- توابع ارتباط با Rust ---
  async function checkSystem() {
    const result = await invoke("get_system_stats");
    setStats(result as string);
  }

  async function fetchNotes() {
    try {
      const result = await invoke("get_notes");
      setNotes(result as Note[]);
    } catch (e) { console.error(e); }
  }

  async function saveNote() {
    if (!noteText) return;
    await invoke("add_note", { text: noteText });
    setNoteText("");
    fetchNotes();
  }

  async function deleteNote(id: number) {
    await invoke("delete_note", { id });
    fetchNotes();
  }

  // --- رندر کردن صفحه Dashboard ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6">System Overview</h2>
      
      {/* کارت وضعیت سیستم */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4">
        <div className="p-4 bg-blue-500/20 rounded-full text-blue-400">
          <Cpu size={40} />
        </div>
        <div>
          <h3 className="text-gray-400 text-sm font-medium">System Performance</h3>
          <p className="text-2xl font-mono text-white mt-1">{stats}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-gray-400 mb-2">Total Notes</h3>
          <p className="text-4xl font-bold text-white">{notes.length}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-gray-400 mb-2">App Status</h3>
          <p className="text-green-400 font-bold">● Running Smoothly</p>
        </div>
      </div>
    </div>
  );

  // --- رندر کردن صفحه Notes ---
  const renderNotes = () => (
    <div className="h-full flex flex-col animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6">My Notes</h2>
      
      {/* ورودی یادداشت */}
      <div className="bg-slate-800 p-4 rounded-xl mb-6 shadow-lg border border-slate-700 flex gap-2">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Type a new idea..."
          className="bg-slate-900 text-white flex-1 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
          onKeyDown={(e) => e.key === 'Enter' && saveNote()}
        />
        <button onClick={saveNote} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition shadow-lg flex items-center gap-2">
          <Save size={20} />
          Save
        </button>
      </div>

      {/* لیست یادداشت‌ها */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <NotebookPen size={48} className="mx-auto mb-4 opacity-50" />
            <p>No notes yet. Start writing!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="group bg-slate-800 hover:bg-slate-750 p-4 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all flex justify-between items-center shadow-sm">
              <p className="text-gray-200">{note.content}</p>
              <button 
                onClick={() => deleteNote(note.id)}
                className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                title="Delete Note"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-gray-100 overflow-hidden font-sans">
      
      {/* --- Sidebar (چپ) --- */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">S</div>
          <h1 className="text-xl font-bold tracking-wide">Super App</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<NotebookPen size={20} />} 
            label="Notes" 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')} 
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="text-xs text-gray-600 px-2">
          v0.1.0 Beta
        </div>
      </aside>

      {/* --- Main Content (راست) --- */}
      <main className="flex-1 p-8 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-900/50">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'settings' && <div className="text-center mt-20 text-gray-500">Settings coming soon...</div>}
      </main>

    </div>
  );
}

// کامپوننت کوچک برای دکمه‌های سایدبار
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
          : "text-gray-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default App;