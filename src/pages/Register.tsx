// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpAndBootstrap } from '../utils/signUpAndBootstrap';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signUpAndBootstrap(email, password, name, phone, address);
    if (result.success) {
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch {
        navigate('/login');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center"
      style={{ backgroundImage: `url('/turbo.png')` }} // poné tu imagen aquí
    >
      <form
        onSubmit={handleRegister}
        className="bg-slate-900/80 backdrop-blur-md p-8 rounded-xl shadow-2xl w-96 text-white space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Registro</h2>

        <div>
          <label className="text-sm font-bold uppercase">Nombre completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 mt-1 rounded bg-slate-800 text-white border border-slate-700"
            required
          />
        </div>

        <div>
          <label className="text-sm font-bold uppercase">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mt-1 rounded bg-slate-800 text-white border border-slate-700"
            required
          />
        </div>

        <div>
          <label className="text-sm font-bold uppercase">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mt-1 rounded bg-slate-800 text-white border border-slate-700"
            required
          />
        </div>

        <div>
          <label className="text-sm font-bold uppercase">Teléfono</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 mt-1 rounded bg-slate-800 text-white border border-slate-700"
          />
        </div>

        <div>
          <label className="text-sm font-bold uppercase">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 mt-1 rounded bg-slate-800 text-white border border-slate-700"
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="flex gap-4 mt-6">
          <button 
            type="submit"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded"
          >
            REGISTRARSE
          </button>
          <Link
            to="/login"
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded text-center"
          >
            CANCELAR
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;


