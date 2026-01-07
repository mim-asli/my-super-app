import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { Cast, Copy, Monitor, Wifi, Power } from "lucide-react";
import { toast } from "sonner";
import { GlassButton, GlassInput, pageVariants } from "./Shared";

export default function Remote() {
  const [myIp, setMyIp] = useState("Loading IP...");
  const [targetIp, setTargetIp] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");

  useEffect(() => {
    getMyIp();
  }, []);

  async function getMyIp() {
    const ip = await invoke("get_my_ip");
    setMyIp(ip as string);
  }

  function copyIp() {
    navigator.clipboard.writeText(myIp);
    toast.success("IP Address copied!");
  }

  function handleConnect() {
    if (!targetIp) {
      toast.error("Please enter Target IP");
      return;
    }
    // فعلاً فقط استایل اتصال رو شبیه‌سازی می‌کنیم (فاز بعدی واقعی میشه)
    setStatus("connecting");
    setTimeout(() => {
      setStatus("connected");
      toast.success(`Connected to ${targetIp}`);
    }, 2000);
  }

  function handleDisconnect() {
    setStatus("idle");
    toast.info("Disconnected");
  }

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} className="space-y-8 max-w-3xl mx-auto mt-4">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Remote Access
        </h2>
        <p className="text-gray-400">Control other devices or share your screen.</p>
      </div>

      {/* 1. کارت مشخصات من (Server Mode) */}
      <div className="glass-card p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Wifi size={80}/></div>
        
        <h3 className="text-lg font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Monitor className="text-blue-400"/> Your Device Address
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/30 p-4 rounded-xl border border-white/5">
          <div className="text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Local IP Address</p>
            <p className="text-3xl font-mono text-white tracking-wide font-bold">{myIp}</p>
          </div>
          <GlassButton onClick={copyIp} className="w-full md:w-auto">
            <Copy size={18}/> Copy IP
          </GlassButton>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Share this IP with the person who wants to control your computer.
        </p>
      </div>

      {/* خط جداکننده */}
      <div className="flex items-center gap-4">
        <div className="h-px bg-white/10 flex-1"></div>
        <span className="text-gray-500 text-sm">OR</span>
        <div className="h-px bg-white/10 flex-1"></div>
      </div>

      {/* 2. کارت اتصال (Client Mode) */}
      <div className="glass-card p-8 rounded-3xl border border-green-500/10">
        <h3 className="text-lg font-medium text-gray-300 mb-6 flex items-center gap-2">
          <Cast className="text-green-400"/> Connect to Partner
        </h3>

        {status === "idle" ? (
          <div className="flex flex-col md:flex-row gap-3">
             <GlassInput 
               placeholder="Enter Partner IP (e.g. 192.168.1.10)" 
               value={targetIp}
               onChange={(e:any) => setTargetIp(e.target.value)}
               className="text-lg tracking-wide font-mono"
             />
             <button 
               onClick={handleConnect}
               className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
             >
               <Power size={20}/> Connect
             </button>
          </div>
        ) : (
          // حالت متصل شده (نمایشی)
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-4 animate-pulse">
             <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                <Wifi size={32} className="text-white"/>
             </div>
             <div>
               <h3 className="text-xl font-bold text-white">Connected to {targetIp}</h3>
               <p className="text-green-400 text-sm">Waiting for video stream...</p>
             </div>
             <GlassButton onClick={handleDisconnect} className="bg-red-500/20 hover:bg-red-600/40 text-red-200 w-full max-w-xs mx-auto">
               Disconnect
             </GlassButton>
          </div>
        )}
      </div>

    </motion.div>
  );
}