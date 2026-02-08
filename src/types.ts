// src/types.ts

// Estados de servicio
export enum ServiceStatus {
  PENDIENTE = 'PENDIENTE',
  IN_PROGRESS = 'EN PROCESO',
  FINALIZADO = 'FINALIZADO',
  INVOICED = 'FACTURADO',
  CANCELLED = 'CANCELADO',
  BUDGET = 'PRESUPUESTO',
}

// Roles de usuario en tu aplicación
export enum UserRole {
  ADMIN = 'ADMIN',
  MECHANIC = 'MECHANIC',
  CLIENT = 'CLIENT',
  USER = 'USER',
  
  }

// Cliente
export interface Client {
  full_name: string;
  id: string;              // puede ser string (UUID) o number
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
}

// Usuario de aplicación (mapeado desde Supabase)
export interface AppUser {
  id: string;
  email: string;
  name?: string;
  // Cambiamos el string literal por el Enum o permitimos las opciones correctas
  role: 'admin' | 'mecanico' | 'cliente' | 'ADMIN' | 'MECHANIC' | 'CLIENT'; 
  client_id?: string | null;
}

// Vehículo
export interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  lastMileage?: number;
  }

// Ítem de servicio
export interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Orden de servicio
export interface ServiceOrder {
  client_id: string;
  vehicle_id: string;
 
  id: string;
  budgetNumber?: string;
  vehicle_Id: string;
  client_Id: string;
  date: number;
  description: string;
  status: ServiceStatus;
  items: ServiceItem[];
  total: number;
  notes?: string;
  nextMaintenanceDate?: number;
  nextMaintenanceMileage?: number;
}

// Turno
export interface Appointment {
  id: string;
  clientId: string;
  vehicleId: string;
  date: string;
  time: any;
  reason: string;
  notes: any;
  status: 'scheduled' | 'cancelled' | 'attended';
}

// Etiqueta de mantenimiento
export interface MaintenanceLabel {
  date: string;
  currentMileage: number;
  nextMileage: number;
  oilType: string;
  nextDate: string;
}

// Perfil (tabla auxiliar si la usas en Supabase)
export interface Profile {
  id: string;              // mismo que auth.users.id
  role: UserRole;
  clientId?: string;
  createdAt: string;
}
// src/types.ts

    