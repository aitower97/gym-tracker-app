import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Dumbbell, Play, Plus, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Stats {
  totalSessions: number
  thisWeek: number
  thisMonth: number
  totalExercises: number
}

interface RecentSession {
  id: string
  started_at: string
  duration_minutes?: number
  mood?: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalExercises: 0
  })
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // SOLO cargamos ejercicios para que la app no pete
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id')

      setStats({
        totalSessions: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalExercises: exercises?.length || 0
      })

      setRecentSessions([])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido! 💪
          </h2>
          <p className="text-gray-600">
            {user?.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell size={24} />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalSessions}</p>
            <p className="text-sm opacity-90">Entrenamientos</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={24} />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.thisWeek}</p>
            <p className="text-sm opacity-90">Esta Semana</p>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={24} />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.thisMonth}</p>
            <p className="text-sm opacity-90">Este Mes</p>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Play size={24} />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalExercises}</p>
            <p className="text-sm opacity-90">Ejercicios</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/workouts/new"
            className="card hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Nuevo Entrenamiento
                </h3>
                <p className="text-sm text-gray-600">
                  Registra tu sesión de hoy
                </p>
              </div>
              <div className="bg-blue-500 text-white p-3 rounded-full">
                <Plus size={24} />
              </div>
            </div>
          </Link>

          <Link
            to="/exercises"
            className="card hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Ver Ejercicios
                </h3>
                <p className="text-sm text-gray-600">
                  Explora la biblioteca
                </p>
              </div>
              <div className="bg-purple-500 text-white p-3 rounded-full">
                <Dumbbell size={24} />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Actividad Reciente
            </h3>
            <Link
              to="/workouts"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todo →
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">
                Aún no has registrado ningún entrenamiento
              </p>
              <Link to="/workouts/new" className="btn-primary inline-block">
                Registrar primero
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map(session => (
                <div
                  key={session.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <Dumbbell size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Entrenamiento
                      </h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(session.started_at), "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {session.duration_minutes && (
                      <p className="text-sm font-medium text-gray-700">
                        {session.duration_minutes} min
                      </p>
                    )}
                    {session.mood && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full capitalize">
                        {session.mood}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
