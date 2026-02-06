import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";

const DebugDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    console.log("🧑‍💻 Usuario actual:", currentUser);

    if (currentUser?.client_id) {
      supabase
        .from("appointments")
        .select("*")
        .eq("client_id", currentUser.client_id)
        .then((res) => {
          if (res.error) {
            console.error("❌ Error en consulta:", res.error.message);
          } else {
            console.log("📦 Turnos crudos:", res.data);
            setAppointments(res.data || []);
          }
        });
    }
  }, [currentUser?.client_id]);

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-4">Debug Dashboard</h2>
      <pre className="bg-slate-900 p-4 rounded-xl">
        {JSON.stringify(appointments, null, 2)}
      </pre>
    </div>
  );
};

export default DebugDashboard;
