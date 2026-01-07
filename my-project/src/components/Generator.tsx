import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GlassButton, pageVariants } from "./Shared";

export default function Generator() {
  const [genPass, setGenPass] = useState("");
  const [passLength, setPassLength] = useState(16);

  async function generatePass() {
    setGenPass(await invoke("generate_password", { length: passLength, hasNumbers: true, hasSymbols: true }) as string);
    toast.info("Generated!");
  }

  function copyText() { if(genPass) { navigator.clipboard.writeText(genPass); toast.success("Copied!"); } }

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} className="max-w-xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Password Generator</h2>
      <div className="glass-card p-8 rounded-3xl space-y-8">
        <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer" onClick={copyText}>
          <span className="font-mono text-2xl text-white tracking-wide break-all">{genPass || "Generate..."}</span>
          <Copy className="text-gray-500 group-hover:text-white transition"/>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400"><span>Length</span><span>{passLength}</span></div>
            <input type="range" min="8" max="64" value={passLength} onChange={(e) => setPassLength(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg accent-blue-500" />
        </div>
        <GlassButton onClick={generatePass} className="w-full py-4 text-lg"><RefreshCw size={24}/> Generate</GlassButton>
      </div>
    </motion.div>
  );
}