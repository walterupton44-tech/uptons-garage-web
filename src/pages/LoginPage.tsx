// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types";
import { Link, useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const { login, currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 🔁 Redirección automática cuando el usuario se setea
  useEffect(() => {
    if (currentUser && location.pathname === "/login") { 
      if (currentUser.role === UserRole.ADMIN) { 
        navigate("/dashboard"); 
      } else if (currentUser.role === UserRole.CLIENT) { 
        navigate("/client-panel"); 
      } 
    } 
  }, [currentUser, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      console.log("Login exitoso ✅");
      // No hace falta redirigir acá, el useEffect lo maneja
    } catch (error: any) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
      style={{ backgroundImage: `url('/turbo.png')` }}
    >
      <div className="overlay-dark" />
      <div className="glass-panel relative z-10 p-10 w-[400px] shadow-2xl">
        <h1 className="title-upton mb-8">Upton’s Garage Manager</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="usuario@uptonsgarage.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-slate-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="********"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary">
            Ingresar
          </button>

          <p className="text-center text-sm mt-4">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-amber-400 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEmail("");
              setPassword("");
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


