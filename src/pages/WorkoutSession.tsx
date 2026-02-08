import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { ArrowLeft, Calendar, Clock, Dumbbell, TrendingUp, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface WorkoutSession {
  id: string
  user_id: string
  notes: string | null
  mood: string
  status: string
  started_at: string
  finished_at: string | null
  duration_minutes: number | null
}

interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  sets: number
  reps_min: number
  reps_max: number
  weight_kg: number | null
  notes: string | null
  order_index: number
  exercise: {
    name: string
    muscle_group: string
    equipment: string
  }
}

export default function WorkoutSession() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workout, setWorkout] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (id) {
      loadWorkout()
    }
  }, [id])

  const loadWorkout = async () => {
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("id", id)
        .single()

      if (workoutError) {
        console.error("Error cargando workout:", workoutError)
        alert("No se pudo cargar el entrenamiento")
        navigate("/workouts")
        return
      }

      setWorkout(workoutData)

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select(`
          *,
          exercise:exercises(name, muscle_group, equipment)
        `)
        .eq("workout_id", id)
        .order("order_index")

      if (exercisesError) {
        console.error("Error cargando ejercicios:", exercisesError)
      } else {
        setExercises(exercisesData || [])
      }

    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setDeleting(true)

    try {
      // Eliminar ejercicios primero
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', id)

      if (exercisesError) throw exercisesError

      // Eliminar sesión
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', id)

      if (sessionError) throw sessionError

      alert('✅ Entrenamiento eliminado correctamente')
      navigate('/workouts')
    } catch (error: any) {
      console.error('Error eliminando:', error)
      alert(`Error: ${error.message}`)
      setDeleting(false)
    }
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "excelente": return "😁"
      case "bien": return "😊"
      case "normal": return "😐"
      case "cansado": return "😴"
      case "mal": return "😓"
      default: return "😊"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "in_progress":
        return "bg-blue-100 text-blue-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "in_progress":
        return "En progreso"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const totalVolume = exercises.reduce((sum, ex) => {
    const avgReps = (ex.reps_min + ex.reps_max) / 2
    const weight = ex.weight_kg || 0
    return sum + (ex.sets * avgReps * weight)
  }, 0)

  if (loading || !workout) {
    return (
      <div className="mobile-safe-area">
        <div className="container-responsive py-4 sm:py-6 md:py-8">
          <p className="text-center text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-safe-area">
      <main className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate("/workouts")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft size={18} />
            <span>Volver</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="page-header">
                Detalle del Entrenamiento
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {format(new Date(workout.started_at), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${getStatusColor(workout.status)}`}>
                {getStatusLabel(workout.status)}
              </span>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary flex items-center gap-2 px-3 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Dumbbell size={18} className="mb-1" />
            <p className="stat-value">{exercises.length}</p>
            <p className="stat-label opacity-90">Ejercicios</p>
          </div>

          <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <TrendingUp size={18} className="mb-1" />
            <p className="stat-value">{totalSets}</p>
            <p className="stat-label opacity-90">Series</p>
          </div>

          <div className="stat-card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <Clock size={18} className="mb-1" />
            <p className="stat-value">
              {workout.duration_minutes || '-'}
            </p>
            <p className="stat-label opacity-90">Minutos</p>
          </div>

          <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <Calendar size={18} className="mb-1" />
            <p className="stat-value">
              {totalVolume.toFixed(0)}
            </p>
            <p className="stat-label opacity-90">kg totales</p>
          </div>
        </div>

        {/* Info del workout */}
        <div className="card-compact mb-4 sm:mb-6">
          <h2 className="section-header">
            Información General
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Estado de ánimo</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                {getMoodEmoji(workout.mood)} {workout.mood}
              </p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Hora de inicio</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {format(new Date(workout.started_at), "HH:mm")}
              </p>
            </div>

            {workout.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Notas</p>
                <p className="text-sm sm:text-base text-gray-900">{workout.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de ejercicios */}
        <div className="card-compact">
          <h2 className="section-header">
            Ejercicios realizados
          </h2>

          {exercises.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
              <p className="text-sm sm:text-base text-gray-500">
                No hay ejercicios registrados
              </p>
            </div>
          ) : (
            <>
              <div className="table-container scroll-touch">
                <table className="table-responsive w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-700 uppercase">
                        #
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-700 uppercase">
                        Ejercicio
                      </th>
                      <th className="text-center text-xs font-semibold text-gray-700 uppercase">
                        Series
                      </th>
                      <th className="text-center text-xs font-semibold text-gray-700 uppercase">
                        Reps
                      </th>
                      <th className="text-center text-xs font-semibold text-gray-700 uppercase">
                        Peso
                      </th>
                      <th className="text-center text-xs font-semibold text-gray-700 uppercase">
                        Vol.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exercises.map((exercise, index) => {
                      const avgReps = (exercise.reps_min + exercise.reps_max) / 2
                      const volume = exercise.sets * avgReps * (exercise.weight_kg || 0)
                      
                      return (
                        <tr key={exercise.id} className="hover:bg-gray-50">
                          <td className="text-gray-500 font-medium text-sm">
                            {index + 1}
                          </td>
                          
                          <td className="min-w-[120px]">
                            <p className="font-semibold text-gray-900 text-sm">
                              {exercise.exercise?.name || 'Desconocido'}
                            </p>
                            {exercise.exercise && (
                              <p className="text-xs text-gray-500 capitalize">
                                {exercise.exercise.muscle_group}
                              </p>
                            )}
                          </td>

                          <td className="text-center font-medium text-gray-900 text-sm">
                            {exercise.sets}
                          </td>

                          <td className="text-center text-gray-900 text-sm">
                            {exercise.reps_min === exercise.reps_max 
                              ? exercise.reps_min 
                              : `${exercise.reps_min}-${exercise.reps_max}`}
                          </td>

                          <td className="text-center font-medium text-gray-900 text-sm">
                            {exercise.weight_kg ? `${exercise.weight_kg} kg` : '-'}
                          </td>

                          <td className="text-center font-semibold text-blue-600 text-sm">
                            {volume > 0 ? `${volume.toFixed(0)}` : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resumen final */}
              <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Ejercicios</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{exercises.length}</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Series</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">{totalSets}</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Volumen</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{totalVolume.toFixed(0)} kg</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal de confirmación */}
        {showDeleteConfirm && (
          <div className="modal-container">
            <div className="modal-content p-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 text-red-600 p-3 rounded-full">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      ¿Eliminar entrenamiento?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Se eliminarán todos los ejercicios asociados.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary flex-1"
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? 'Eliminando...' : 'Sí, eliminar'}
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