import { useState, useRef, useEffect } from "react";
import { 
  BrainCircuit, Send, Bot, User, Loader2, 
  Activity, Terminal as TerminalIcon, Sparkles
} from "lucide-react";
// Importa tu instancia de OpenAI o usa un fetch a tu API
// import { openai } from "../lib/openai"; 

export default function AIClinic() {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "SISTEMA DE DIAGNÓSTICO IA ACTIVO. Describe los síntomas, ruidos o códigos de error OBD-II para iniciar el análisis técnico." 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const callOpenAI = async (userText: string) => {
    setLoading(true);
    try {
      // Reemplaza esto con tu llamada real a la API (o Supabase Edge Function)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Eres un Ingeniero Mecánico experto. Diagnostica fallas de autos. Sé técnico, usa viñetas y sugiere repuestos específicos." },
            { role: "user", content: userText }
          ],
          temperature: 0.7,
        })
      });

      const data = await response.json();
      const aiReply = data.choices[0].message.content;
      
      setMessages(prev => [...prev, { role: "assistant", content: aiReply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "ERROR DE CONEXIÓN: No se pudo acceder al núcleo neuronal. Revisa tu conexión o API Key." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const text = input;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    callOpenAI(text);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-4">
      
      {/* PANEL SUPERIOR: STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] flex items-center gap-4 shadow-xl col-span-2">
          <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center border border-orange-500/30">
            <BrainCircuit className="text-orange-500 animate-pulse" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase italic text-white tracking-tighter">Neural Diagnostic Center</h1>
            <p className="text-[9px] font-bold text-orange-500/60 uppercase tracking-widest">IA Engine: GPT-4o Enterprise</p>
          </div>
        </div>
        
        <div className="bg-orange-600 p-5 rounded-[2rem] flex items-center justify-between shadow-lg shadow-orange-900/20">
          <Activity className="text-white/80 animate-bounce" size={24} />
          <div className="text-right">
            <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Estado</p>
            <p className="text-xl font-black text-white italic">OPERATIVO</p>
          </div>
        </div>
      </div>

      {/* CHAT TERMINAL */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-lg ${
                  msg.role === "assistant" 
                  ? "bg-slate-800 border-orange-500/30 text-orange-500" 
                  : "bg-orange-600 border-orange-400 text-white"
                }`}>
                  {msg.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                </div>
                
                <div className={`p-5 rounded-3xl text-[13px] leading-relaxed shadow-sm ${
                  msg.role === "assistant" 
                  ? "bg-slate-800/80 border border-slate-700 text-slate-200" 
                  : "bg-orange-600 text-white font-bold"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">
                      <Sparkles size={12} /> Informe de análisis
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-3 ml-14 bg-slate-800/50 w-fit p-4 rounded-2xl border border-slate-700 animate-pulse">
              <Loader2 className="animate-spin text-orange-500" size={18} />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Procesando telemetría...</span>
            </div>
          )}
        </div>

        {/* INPUT BOX */}
        <div className="p-6 bg-slate-900/80 border-t border-slate-800">
          <div className="relative group">
            <input 
              className="w-full bg-slate-950 border border-slate-800 p-5 pl-8 pr-20 rounded-[1.5rem] outline-none focus:border-orange-500/50 text-white font-medium transition-all shadow-inner"
              placeholder="Ej: El auto tironea en baja y consume mucho combustible..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white p-3.5 rounded-xl transition-all shadow-lg active:scale-90"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}