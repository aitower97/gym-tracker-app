import { Calendar, Dumbbell, Home, LogOut, Sparkles, TrendingUp } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const location = useLocation()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/exercises', icon: Dumbbell, label: 'Ejercicios' },
    { path: '/workouts', icon: Calendar, label: 'Entrenamientos' },
    { path: '/progress', icon: TrendingUp, label: 'Progreso' },
    { path: '/ai-generator', icon: Sparkles, label: 'IA Generador' },
  ]

  return (
    <>
      {/* Header Desktop */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-700">🏋️ Gym Tracker</h1>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Salir</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full ${
                location.pathname === item.path
                  ? 'text-blue-700'
                  : 'text-gray-400'
              }`}
            >
              <item.icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
          
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center w-full h-full text-red-500"
          >
            <LogOut size={24} />
            <span className="text-xs mt-1">Salir</span>
          </button>
        </div>
      </nav>
    </>
  )
}