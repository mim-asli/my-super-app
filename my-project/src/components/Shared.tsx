import { motion } from "framer-motion";

export const GlassButton = ({ onClick, children, className, variant = "primary" }: any) => (
  <motion.button 
    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}
    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
      variant === "primary" ? "bg-blue-600/80 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md" : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
    } ${className}`}
  >
    {children}
  </motion.button>
);

export const GlassInput = (props: any) => (
  <input {...props} className={`bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all w-full ${props.className}`} />
);

export const pageVariants = {
  initial: { opacity: 0, y: 10, filter: "blur(5px)" },
  in: { opacity: 1, y: 0, filter: "blur(0px)" },
  out: { opacity: 0, y: -10, filter: "blur(5px)" }
};