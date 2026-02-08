import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, Dumbbell, Eye, Plus, Trash2 } from 'lucide-react'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null)

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

  const handleDeleteClick = (id: string) => {
    setWorkoutToDelete(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!workoutToDelete) return

    setDeletingId(workoutToDelete)

    try {
      // Primero eliminar los ejercicios asociados
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutToDelete)

      if (exercisesError) throw exercisesError

      // Luego eliminar la sesión
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', workoutToDelete)

      if (sessionError) throw sessionError

      // Actualizar la lista
      setWorkouts(workouts.filter(w => w.id !== workoutToDelete))
      alert('✅ Entrenamiento eliminado correctamente')
    } catch (error: any) {
      console.error('Error eliminando:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setDeletingId(null)
      setWorkoutToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  const cancelDelete = () => {
    setWorkoutToDelete(null)
    setShowDeleteConfirm(false)
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

  const getMoodEmoji = (mood?: string) => {
    if (!mood) return ''
    switch (mood) {
      case 'excelente':
        return '😁'
      case 'bien':
        return '😊'
      case 'normal':
        return '😐'
      case 'cansado':
        return '😴'
      case 'mal':
        return '😓'
      default:
        return '😊'
    }
  }

  if (loading) {
    return (
      <div className="mobile-safe-area">
        <div className="container-responsive py-4 sm:py-6 md:py-8">
          <div className="text-center">Cargando entrenamientos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-safe-area">
      <main className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="page-header">
              Mis Entrenamientos
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {workouts.length} sesiones registradas
            </p>
          </div>
          <Link to="/workouts/new" className="btn-primary flex items-center justify-center gap-2">
            <Plus size={18} />
            <span>Nuevo</span>
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div className="card text-center py-8 sm:py-12">
            <div className="text-gray-400 mb-4">
              <Calendar size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Aún no has registrado ningún entrenamiento
            </p>
            <Link to="/workouts/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} />
              Crear primer entrenamiento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {workouts.map(workout => (
              <div
                key={workout.id}
                className="card-compact hover:shadow-lg transition-shadow relative"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Icono */}
                  <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-2 sm:p-3 rounded-lg">
                    <Dumbbell size={20} className="sm:w-6 sm:h-6" />
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1 min-w-0">
                    {/* Fecha y estado */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {format(new Date(workout.started_at), "EEEE d 'de' MMMM", { locale: es })}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {format(new Date(workout.started_at), 'HH:mm')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(workout.status)}`}>
                        {getStatusLabel(workout.status)}
                      </span>
                    </div>

                    {/* Notas */}
                    {workout.notes && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate-2-lines">
                        {workout.notes}
                      </p>
                    )}

                    {/* Info adicional */}
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                      {workout.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{workout.duration_minutes} min</span>
                        </div>
                      )}
                      {workout.mood && (
                        <span className="capitalize">
                          {getMoodEmoji(workout.mood)} {workout.mood}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <Link
                    to={`/workouts/${workout.id}`}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    <span>Ver detalle</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(workout.id)}
                    disabled={deletingId === workout.id}
                    className="btn-secondary flex items-center justify-center gap-2 px-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">
                      {deletingId === workout.id ? 'Borrando...' : 'Borrar'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmación de borrado */}
        {showDeleteConfirm && (
          <div className="modal-container">
            <div className="modal-content p-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 text-red-600 p-3 rounded-full">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      ¿Eliminar entrenamiento?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Se eliminarán todos los ejercicios y datos asociados a esta sesión.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={cancelDelete}
                    className="btn-secondary flex-1"
                    disabled={deletingId !== null}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deletingId !== null}
                    className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {deletingId ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}