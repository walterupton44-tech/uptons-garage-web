import React, { useState } from 'react';
import { BrainCircuit, Sparkles, AlertTriangle, Zap } from 'lucide-react';

// Ahora usamos la variable de Gemini
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const AIDiagnostic: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleDiagnose = async () => {
    if (!symptoms) return;
    setLoading(true);
    setResult(null);

    try {
      // ENDPOINT DE GOOGLE (GRATIS)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Sos el Ingeniero Jefe de Upton's Garage. Analizá técnicamente estos síntomas y da un diagnóstico de élite, profesional y preciso. 
              Estructura tu respuesta con:
              1. ANÁLISIS DE FRECUENCIA.
              2. DIAGNÓSTICO PRESUNTIVO.
              3. PROTOCOLO DE INTERVENCIÓN SUGERIDO.
              
              Síntomas a analizar: ${symptoms}`
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);

      // Extraemos la respuesta de Gemini
      const aiResponse = data.candidates[0].content.parts[0].text;
      setResult(aiResponse);

    } catch (error: any) {
      console.error("Error en Upton AI:", error);
      setResult(`⚠️ ERROR DE CONEXIÓN: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="metallic-dark p-12 rounded-[40px] text-white shadow-3xl relative overflow-hidden border-b-8 border-amber-500 group">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-8">
            <div className="p-5 bg-amber-500 rounded-[24px]">
              <BrainCircuit size={54} className="text-slate-950" />
            </div>
            <div>
              <h2 className="text-5xl font-black tracking-tighter italic uppercase text-white">Upton AI</h2>
              <p className="text-amber-500 font-black tracking-[0.4em] text-xs uppercase mt-1">Núcleo Gratuito Gemini</p>
            </div>
          </div>
          <p className="text-slate-400 text-xl leading-relaxed max-w-3xl font-medium italic">
            "Diagnóstico de ingeniería avanzada sin costos de API."
          </p>
        </div>
      </div>

      <div className="glass-panel p-12 rounded-[40px] shadow-2xl space-y-10 border border-slate-800 bg-slate-900/40">
        <textarea 
          className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-8 text-white font-bold text-xl focus:border-amber-500 focus:outline-none transition placeholder-slate-800 uppercase"
          placeholder="INGRESE LOS SÍNTOMAS DEL VEHÍCULO..."
          value={symptoms}
          onChange={e => setSymptoms(e.target.value.toUpperCase())}
        />

        <button 
          onClick={handleDiagnose}
          disabled={loading || !symptoms}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 py-6 rounded-3xl flex items-center justify-center gap-4 font-black text-xl italic uppercase transition-all disabled:opacity-20"
        >
          {loading ? "PROCESANDO ESCANEO NEURONAL..." : "INICIAR ANÁLISIS TÉCNICO"}
        </button>

        {result && (
          <div className="mt-12 p-10 bg-slate-900 border border-amber-500/30 rounded-[32px] animate-in fade-in duration-500">
            <div className="flex items-center gap-4 text-white mb-6">
              <AlertTriangle size={28} className="text-amber-500" />
              <span className="font-black text-2xl uppercase italic">REPORTE DE INGENIERÍA UPTON</span>
            </div>
            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed font-medium text-lg border-l-4 border-amber-500 pl-10">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDiagnostic;