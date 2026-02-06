import { supabase } from "./supabase";
import { Client, Vehicle, ServiceOrder, Appointment } from "./types";

export const db = {
  // === CLIENTES ===
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase.from("clients").select("*");
    if (error) throw error;
    return data as Client[];
  },
  saveClient: async (client: Client) => {
    const { error } = await supabase.from("clients").insert(client);
    if (error) throw error;
  },
  updateClient: async (id: string, updates: Partial<Client>) => {
    const { error } = await supabase.from("clients").update(updates).eq("id", id);
    if (error) throw error;
  },
  deleteClient: async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
  },

  // === VEHÍCULOS ===
  getVehicles: async (): Promise<Vehicle[]> => {
    const { data, error } = await supabase.from("vehicles").select("*");
    if (error) throw error;
    return data as Vehicle[];
  },
  saveVehicle: async (vehicle: Vehicle) => {
    const { error } = await supabase.from("vehicles").insert(vehicle);
    if (error) throw error;
  },
  updateVehicle: async (id: string, updates: Partial<Vehicle>) => {
    const { error } = await supabase.from("vehicles").update(updates).eq("id", id);
    if (error) throw error;
  },
  deleteVehicle: async (id: string) => {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) throw error;
  },

  // === ÓRDENES DE SERVICIO ===
  getOrders: async (): Promise<ServiceOrder[]> => {
    const { data, error } = await supabase.from("service_orders").select("*");
    if (error) throw error;
    return data as ServiceOrder[];
  },
  saveOrder: async (order: ServiceOrder) => {
    const { error } = await supabase.from("service_orders").insert(order);
    if (error) throw error;
  },
  updateOrder: async (id: string, updates: Partial<ServiceOrder>) => {
    const { error } = await supabase.from("service_orders").update(updates).eq("id", id);
    if (error) throw error;
  },
  deleteOrder: async (id: string) => {
    const { error } = await supabase.from("service_orders").delete().eq("id", id);
    if (error) throw error;
  },

  // === CITAS ===
  getAppointments: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase.from("appointments").select("*");
    if (error) throw error;
    return data as Appointment[];
  },
  saveAppointment: async (appointment: Appointment) => {
    const { error } = await supabase.from("appointments").insert(appointment);
    if (error) throw error;
  },
  updateAppointment: async (id: string, updates: Partial<Appointment>) => {
    const { error } = await supabase.from("appointments").update(updates).eq("id", id);
    if (error) throw error;
  },
  deleteAppointment: async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
  },

  seed: async (): Promise<void> => { 
    const demoClients: Client[] = [ 
      
    ]; 
    for (const client of demoClients) { 
      await db.saveClient(client); } 
    } 
  
};

