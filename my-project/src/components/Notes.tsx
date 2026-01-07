import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GlassButton, GlassInput, pageVariants } from "./Shared";

interface Note { id: number; content: string; }

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");

  useEffect(() => { fetchNotes(); }, []);

  async function fetchNotes() { setNotes(await invoke("get_notes") as Note[]); }
  
  async function saveNote() { 
    if(!noteText) return; 
    await invoke("add_note", { text: noteText }); 
    setNoteText(""); 
    fetchNotes(); 
    toast.success("Note saved"); 
  }
  
  async function deleteNote(id: number) { 
    await invoke("delete_note", { id }); 
    fetchNotes(); 
    toast.error("Note deleted");
  }

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6">Notes</h2>
      <div className="glass p-2 rounded-2xl mb-6 flex gap-2">
        <GlassInput value={noteText} onChange={(e:any) => setNoteText(e.target.value)} placeholder="Type something..." className="border-none bg-transparent focus:bg-transparent" onKeyDown={(e:any) => e.key === 'Enter' && saveNote()} />
        <GlassButton onClick={saveNote}><Save size={18}/></GlassButton>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-20 custom-scrollbar">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="glass-card p-5 rounded-2xl group hover:border-blue-500/30 transition-all">
              <p className="text-gray-200 leading-relaxed">{note.content}</p>
              <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-500">#{note.id}</span>
                <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition"><Trash2 size={16}/></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}