import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { 
  LayoutDashboard, 
  NotebookPen, 
  KeyRound, 
  ShieldCheck, 
  Settings, 
  Cast // آیکون جدید برای ریموت
} from "lucide-react";
import "./App.css";

// ایمپورت کردن تمام صفحات (ماژول‌ها)
import Dashboard from "./components/Dashboard";
import Notes from "./components/Notes";
import Generator from "./components/Generator";
import Vault from "./components/Vault";
import Remote from "./components/Remote"; // صفحه جدید ریموت
import { pageVariants } from "./components/Shared";

function App() {
  // این متغیر مشخص می‌کنه الان کدوم صفحه بازه
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex h-screen bg-[#030712] text-gray-100 overflow-hidden font-sans selection:bg-blue-500/30 relative">
      {/* افکت نویز روی پس‌زمینه */}
      <div className="bg-noise"></div>
      
      {/* سیستم نمایش پیام‌ها (نوتیفیکیشن) */}
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* --- ستون کناری (Sidebar) --- */}
      <aside className="w-20 lg:w-64 glass border-r-0 flex flex-col py-6 items-center lg:items-stretch z-20">
        {/* لوگو */}
        <div className="flex items-center gap-3 px-4 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
            S
          </div>
          <h1 className="text-xl font-bold tracking-wide hidden lg:block">Super App</h1>
        </div>
        
        {/* منوی اصلی */}
        <nav className="space-y-2 px-2 flex-1">
          <SidebarItem 
            icon={<LayoutDashboard size={22} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<NotebookPen size={22} />} 
            label="Notes" 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')} 
          />
          <SidebarItem 
            icon={<KeyRound size={22} />} 
            label="Generator" 
            active={activeTab === 'generator'} 
            onClick={() => setActiveTab('generator')} 
          />
          <SidebarItem 
            icon={<ShieldCheck size={22} />} 
            label="Vault" 
            active={activeTab === 'vault'} 
            onClick={() => setActiveTab('vault')} 
          />
          {/* دکمه جدید ریموت 👇 */}
          <SidebarItem 
            icon={<Cast size={22} />} 
            label="Remote" 
            active={activeTab === 'remote'} 
            onClick={() => setActiveTab('remote')} 
          />
        </nav>

        {/* دکمه تنظیمات (پایین) */}
        <div className="px-2">
          <SidebarItem 
            icon={<Settings size={22} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>
      </aside>

      {/* --- محتوای اصلی (Main Content) --- */}
      <main className="flex-1 relative overflow-hidden z-10">
        {/* نورهای پس‌زمینه (Gradients) */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        {/* کانتینر صفحات */}
        <div className="relative h-full p-8 lg:p-12 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {activeTab === 'dashboard' && <Dashboard key="dash" />}
            
            {activeTab === 'notes' && <Notes key="notes" />}
            
            {activeTab === 'generator' && <Generator key="gen" />}
            
            {activeTab === 'vault' && <Vault key="vault" />}
            
            {/* صفحه جدید ریموت 👇 */}
            {activeTab === 'remote' && <Remote key="remote" />}
            
            {activeTab === 'settings' && (
              <motion.div 
                key="settings" 
                initial="initial" animate="in" exit="out" variants={pageVariants} 
                className="text-center mt-20"
              >
                <Settings size={64} className="mx-auto text-gray-700 mb-4"/>
                <p className="text-gray-500">Settings Coming Soon...</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// کامپوننت دکمه‌های منو
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden ${
        active ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {/* پس‌زمینه آبی وقتی فعاله */}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-xl"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10 font-medium hidden lg:block">{label}</span>
      
      {/* خط آبی سمت چپ وقتی فعاله */}
      {active && <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
    </button>
  );
}

export default App;