import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { pageVariants } from "./Shared";

export default function Dashboard() {
  const [stats, setStats] = useState("Loading...");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalSys = setInterval(async () => setStats(await invoke("get_system_stats") as string), 2000);
    const intervalClock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(intervalSys); clearInterval(intervalClock); };
  }, []);

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Dashboard</h1>
           <p className="text-gray-400 mt-1">System Overview</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-white font-mono-digits tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-blue-400 font-medium text-sm">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      
      <motion.div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Cpu size={100} /></div>
        <h3 className="text-gray-400 font-medium mb-1 flex items-center gap-2"><Cpu size={18}/> System RAM</h3>
        <p className="text-2xl font-mono text-white">{stats}</p>
      </motion.div>
    </motion.div>
  );
}