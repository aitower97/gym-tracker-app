import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, Dumbbell, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface WorkoutSession {
  id: string
  started_at: string
  finished_at?: string
  duration_minutes?: number
  mood?: string
  status: string
  notes?: string
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .order('started_at', { ascending: false })

      if (error) throw error
      setWorkouts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'in_progress':
        return 'En progreso'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Cargando entrenamientos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mis Entrenamientos
            </h1>
            <p className="text-gray-600 mt-1">
              {workouts.length} sesiones registradas
            </p>
          </div>
          <Link to="/workouts/new" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Nuevo
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">
              Aún no has registrado ningún entrenamiento
            </p>
            <Link to="/workouts/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={20} />
              Crear primer entrenamiento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map(workout => (
              <Link
                key={workout.id}
                to={`/workouts/${workout.id}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="text-blue-600" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {format(new Date(workout.started_at), "d 'de' MMMM", { locale: es })}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {format(new Date(workout.started_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(workout.status)}`}>
                    {getStatusLabel(workout.status)}
                  </span>
                </div>

                {workout.notes && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {workout.notes}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {workout.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{workout.duration_minutes} min</span>
                    </div>
                  )}
                  {workout.mood && (
                    <span className="capitalize">😊 {workout.mood}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

