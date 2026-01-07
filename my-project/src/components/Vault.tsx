import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Copy, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { GlassButton, GlassInput, pageVariants } from "./Shared";

interface PassEntry { id: number; service: string; username: string; password: string; }

export default function Vault() {
  const [vaultEntries, setVaultEntries] = useState<PassEntry[]>([]);
  const [newService, setNewService] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [visiblePassId, setVisiblePassId] = useState<number | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  useEffect(() => { fetchVault(); }, []);

  async function fetchVault() { setVaultEntries(await invoke("get_password_entries") as PassEntry[]); }
  
  async function saveVaultEntry() {
    if(!newService || !newPass) return;
    await invoke("add_password_entry", { service: newService, username: newUser, password: newPass });
    setNewService(""); setNewUser(""); setNewPass(""); setIsVaultModalOpen(false);
    fetchVault();
    toast.success("Saved to Vault");
  }
  
  async function deleteVaultEntry(id: number) { 
    await invoke("delete_password_entry", { id }); 
    fetchVault();
    toast.error("Entry removed");
  }

  function copyText(text: string) { navigator.clipboard.writeText(text); toast.success("Copied!"); }

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} className="h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Vault</h2>
        <GlassButton onClick={() => setIsVaultModalOpen(true)}><Plus size={18}/> New</GlassButton>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
        {vaultEntries.map((entry) => (
          <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">{entry.service.charAt(0).toUpperCase()}</div>
              <div><h3 className="font-bold text-white">{entry.service}</h3><p className="text-sm text-gray-400">{entry.username}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 min-w-[100px] text-center hidden md:block">
                <span className="font-mono text-gray-300 text-sm">{visiblePassId === entry.id ? entry.password : "••••••"}</span>
              </div>
              <button onClick={() => setVisiblePassId(visiblePassId === entry.id ? null : entry.id)} className="text-gray-400 hover:text-white transition"><Eye size={18}/></button>
              <button onClick={() => copyText(entry.password)} className="text-gray-400 hover:text-blue-400 transition"><Copy size={18}/></button>
              <button onClick={() => deleteVaultEntry(entry.id)} className="text-gray-400 hover:text-red-400 transition ml-2"><Trash2 size={18}/></button>
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {isVaultModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card p-6 rounded-3xl w-full max-w-md bg-[#0f172a] border border-white/20">
              <div className="flex justify-between mb-6"><h3 className="text-xl font-bold text-white">Add Entry</h3><button onClick={() => setIsVaultModalOpen(false)}><X className="text-gray-400 hover:text-white"/></button></div>
              <div className="space-y-4">
                <GlassInput value={newService} onChange={(e:any) => setNewService(e.target.value)} placeholder="Service" autoFocus />
                <GlassInput value={newUser} onChange={(e:any) => setNewUser(e.target.value)} placeholder="Username" />
                <GlassInput value={newPass} onChange={(e:any) => setNewPass(e.target.value)} placeholder="Password" type="password" />
                <GlassButton onClick={saveVaultEntry} className="w-full py-3 mt-2">Save</GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}