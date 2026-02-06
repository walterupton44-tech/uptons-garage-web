import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Upload, Save, Loader2, ImageIcon } from "lucide-react";

export default function ConfigTaller() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState({
    nombre_taller: "",
    telefono: "",
    email: "",
    direccion: "",
    pie_pagina_pdf: "",
    logo_url: ""
  });

  // 1. Cargar configuración existente al iniciar
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data, error } = await supabase
          .from("configuracion_taller")
          .select("*")
          .single();

        if (data) setConfig(data);
      } catch (error) {
        console.error("Error cargando configuración:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // 2. Función para subir el logo
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subida al bucket 'logos'
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw new Error("Asegúrate de tener el bucket 'logos' creado como PÚBLICO y con políticas de INSERT activas.");

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setConfig({ ...config, logo_url: publicUrl });
      alert("Logo subido con éxito. No olvides guardar los cambios.");

    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("configuracion_taller")
        .upsert([config]); // Upsert actualiza si existe, o inserta si no.

      if (error) throw error;
      alert("Configuración guardada correctamente.");
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && config.nombre_taller === "") return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-amber-500" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl mt-10">
      
      {/* SECCIÓN DEL LOGO */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-32 h-32 bg-slate-800 rounded-3xl border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden relative group">
          {config.logo_url ? (
            <img src={config.logo_url} alt="Logo Taller" className="w-full h-full object-contain p-2" />
          ) : (
            <ImageIcon className="text-slate-600" size={40} />
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
              <Loader2 className="animate-spin text-amber-500" />
            </div>
          )}
        </div>
        
        <label className="mt-4 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
          <Upload size={16} />
          {config.logo_url ? "Cambiar Logo" : "Subir Logo"}
          <input type="file" className="hidden" accept="image/*" onChange={handleUploadLogo} disabled={uploading} />
        </label>
      </div>

      {/* FORMULARIO */}
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Taller</label>
          <input 
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-amber-500"
            value={config.nombre_taller}
            onChange={(e) => setConfig({...config, nombre_taller: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
            <input 
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-amber-500"
              value={config.telefono}
              onChange={(e) => setConfig({...config, telefono: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <input 
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-amber-500"
              value={config.email}
              onChange={(e) => setConfig({...config, email: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección Física</label>
          <input 
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-amber-500"
            value={config.direccion}
            onChange={(e) => setConfig({...config, direccion: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Texto al pie del PDF</label>
          <textarea 
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-amber-500 resize-none"
            value={config.pie_pagina_pdf}
            onChange={(e) => setConfig({...config, pie_pagina_pdf: e.target.value})}
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20 mt-4"
        >
          <Save size={20} />
          {loading ? "GUARDANDO..." : "GUARDAR CONFIGURACIÓN"}
        </button>
      </div>
    </div>
  );
}