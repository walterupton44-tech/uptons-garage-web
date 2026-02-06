// src/components/AccessPortal.tsx
import { FaUserShield, FaTools, FaClipboardList, FaCar } from 'react-icons/fa'
import Logo from "../assets/uptons-logo.png"

const roles = [
  {
    label: 'ADMINISTRADOR',
    description: 'CONTROL TOTAL OPERATIVO',
    icon: <FaUserShield className="text-yellow-400 text-4xl" />,
    path: '/admin',
  },
  {
    label: 'MECÁNICO',
    description: 'GESTIÓN DE INGENIERÍA',
    icon: <FaTools className="text-yellow-400 text-4xl" />,
    path: '/mecanico',
  },
  {
    label: 'AYUDANTE',
    description: 'LOGÍSTICA Y AGENDA',
    icon: <FaClipboardList className="text-yellow-400 text-4xl" />,
    path: '/ayudante',
  },
  {
    label: 'CLIENTE',
    description: 'MIS VEHÍCULOS Y CITAS',
    icon: <FaCar className="text-yellow-400 text-4xl" />,
    path: '/cliente',
  },
]

export default function AccessPortal() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <img src={Logo} alt="Upton's Garage Logo" className="w-48 mb-4" />
      <h1 className="text-3xl font-bold mb-2 tracking-wide text-yellow-400">ACCESS PORTAL</h1>
      <h2 className="text-xl font-semibold mb-6">UPTON'S GARAGE ⚡</h2>
      <p className="mb-10 text-sm text-gray-400">PRECISION MANAGEMENT SYSTEM V2.0</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {roles.map((role) => (
          <a
            key={role.label}
            href={role.path}
            className="bg-gray-800 hover:bg-gray-700 transition rounded-lg p-6 flex flex-col items-center text-center shadow-md"
          >
            {role.icon}
            <h3 className="mt-4 text-lg font-bold">{role.label}</h3>
            <p className="text-sm text-gray-400">{role.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}


