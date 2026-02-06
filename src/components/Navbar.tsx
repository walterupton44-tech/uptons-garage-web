// src/components/Navbar.tsx
import Logo from '../assets/uptons-logo.png'

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white flex items-center px-6 py-3 shadow-md">
      <img src={Logo} alt="Upton's Garage Logo" className="w-12 h-12 mr-3" />
      <h1 className="text-xl font-bold text-yellow-400">Upton's Garage Manager 🚗</h1>
    </nav>
  )
}
