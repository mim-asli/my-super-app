import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  LayoutDashboard, 
  NotebookPen, 
  Settings, 
  Cpu, 
  Trash2, 
  Save,
  KeyRound, // آیکون جدید برای پسورد
  Copy,     // آیکون کپی
  RefreshCw // آیکون رفرش
} from "lucide-react";
import "./App.css";

interface Note {
  id: number;
  title: string;
  content: string;
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // State های عمومی
  const [stats, setStats] = useState("Loading...");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");

  // State های مربوط به Password Generator
  const [password, setPassword] = useState("");
  const [passLength, setPassLength] = useState(12);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  useEffect(() => {
    checkSystem();
    fetchNotes();
    const interval = setInterval(checkSystem, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- توابع Rust ---
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

  // --- تابع تولید رمز ---
  async function generatePass() {
    const res = await invoke("generate_password", {
      length: passLength,
      hasNumbers: includeNumbers,
      hasSymbols: includeSymbols
    });
    setPassword(res as string);
  }

  // --- تابع کپی در کلیپ‌بورد ---
  function copyToClipboard() {
    if(!password) return;
    navigator.clipboard.writeText(password);
    alert("Password copied!");
  }

  // --- رندر صفحات ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6">System Overview</h2>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4">
        <div className="p-4 bg-blue-500/20 rounded-full text-blue-400"><Cpu size={40} /></div>
        <div>
          <h3 className="text-gray-400 text-sm font-medium">System Performance</h3>
          <p className="text-2xl font-mono text-white mt-1">{stats}</p>
        </div>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="h-full flex flex-col animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6">My Notes</h2>
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
          <Save size={20} /> Save
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {notes.map((note) => (
          <div key={note.id} className="group bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center shadow-sm">
            <p className="text-gray-200">{note.content}</p>
            <button onClick={() => deleteNote(note.id)} className="text-gray-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGenerator = () => (
    <div className="animate-fade-in max-w-2xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Password Generator</h2>
      
      {/* باکس نمایش پسورد */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6 flex items-center justify-between">
        <span className="text-2xl font-mono text-white tracking-wider break-all">
          {password || "Click Generate"}
        </span>
        <button onClick={copyToClipboard} className="text-gray-400 hover:text-white p-2 transition" title="Copy">
          <Copy size={24} />
        </button>
      </div>

      {/* تنظیمات */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-6">
        
        {/* اسلایدر طول */}
        <div>
          <div className="flex justify-between mb-2 text-gray-300">
            <label>Length</label>
            <span className="font-bold text-blue-400">{passLength}</span>
          </div>
          <input 
            type="range" min="6" max="32" 
            value={passLength} 
            onChange={(e) => setPassLength(Number(e.target.value))}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* چک‌باکس‌ها */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={includeNumbers} 
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="w-5 h-5 rounded accent-blue-600"
            />
            Include Numbers
          </label>
          <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={includeSymbols} 
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="w-5 h-5 rounded accent-blue-600"
            />
            Include Symbols
          </label>
        </div>

        {/* دکمه تولید */}
        <button 
          onClick={generatePass}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
        >
          <RefreshCw size={24} />
          Generate Secure Password
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">S</div>
          <h1 className="text-xl font-bold tracking-wide">Super App</h1>
        </div>
        <nav className="space-y-2 flex-1">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<NotebookPen size={20} />} label="Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          {/* دکمه جدید اینجاست 👇 */}
          <SidebarItem icon={<KeyRound size={20} />} label="Generator" active={activeTab === 'generator'} onClick={() => setActiveTab('generator')} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-900/50">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'generator' && renderGenerator()}
        {activeTab === 'settings' && <div className="text-center mt-20 text-gray-500">Settings coming soon...</div>}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-slate-800 hover:text-white"}`}>
      {icon} <span className="font-medium">{label}</span>
    </button>
  );
}

export default App;