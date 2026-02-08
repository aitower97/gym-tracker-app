import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Calendar, Clock, Dumbbell, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

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

  useEffect(() => {
    if (id) {
      loadWorkout()
    }
  }, [id])

  const loadWorkout = async () => {
    try {
      // Cargar sesión de workout
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

      // Cargar ejercicios de la sesión con JOIN a la tabla exercises
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

  // Calcular estadísticas
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const totalVolume = exercises.reduce((sum, ex) => {
    const avgReps = (ex.reps_min + ex.reps_max) / 2
    const weight = ex.weight_kg || 0
    return sum + (ex.sets * avgReps * weight)
  }, 0)

  if (loading || !workout) {
    return (
      <div className="pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Cargando entrenamiento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/workouts")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Volver a entrenamientos</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Detalle del Entrenamiento
              </h1>
              <p className="text-gray-600">
                {format(new Date(workout.started_at), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workout.status)}`}>
              {getStatusLabel(workout.status)}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={20} />
            </div>
            <p className="text-2xl font-bold mb-1">{exercises.length}</p>
            <p className="text-xs opacity-90">Ejercicios</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={20} />
            </div>
            <p className="text-2xl font-bold mb-1">{totalSets}</p>
            <p className="text-xs opacity-90">Series totales</p>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={20} />
            </div>
            <p className="text-2xl font-bold mb-1">
              {workout.duration_minutes || '-'}
            </p>
            <p className="text-xs opacity-90">Minutos</p>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={20} />
            </div>
            <p className="text-2xl font-bold mb-1">
              {totalVolume.toFixed(0)}
            </p>
            <p className="text-xs opacity-90">kg levantados</p>
          </div>
        </div>

        {/* Info del workout */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Información General
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estado de ánimo</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {getMoodEmoji(workout.mood)} {workout.mood}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Hora de inicio</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(workout.started_at), "HH:mm")}
              </p>
            </div>

            {workout.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Notas</p>
                <p className="text-gray-900">{workout.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de ejercicios */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ejercicios realizados
          </h2>

          {exercises.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                No hay ejercicios registrados en este entrenamiento
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Ejercicio
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Series
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Reps
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Peso (kg)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Volumen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exercises.map((exercise, index) => {
                    const avgReps = (exercise.reps_min + exercise.reps_max) / 2
                    const volume = exercise.sets * avgReps * (exercise.weight_kg || 0)
                    
                    return (
                      <tr key={exercise.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 font-medium">
                          {index + 1}
                        </td>
                        
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">
                            {exercise.exercise?.name || 'Ejercicio desconocido'}
                          </p>
                          {exercise.exercise && (
                            <p className="text-xs text-gray-500 capitalize">
                              {exercise.exercise.muscle_group} • {exercise.exercise.equipment}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          {exercise.sets}
                        </td>

                        <td className="px-4 py-3 text-center text-gray-900">
                          {exercise.reps_min === exercise.reps_max 
                            ? exercise.reps_min 
                            : `${exercise.reps_min}-${exercise.reps_max}`}
                        </td>

                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          {exercise.weight_kg ? exercise.weight_kg : '-'}
                        </td>

                        <td className="px-4 py-3 text-center font-semibold text-blue-600">
                          {volume > 0 ? `${volume.toFixed(0)} kg` : '-'}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {exercise.notes || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumen final */}
          {exercises.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-600 mb-1">Total ejercicios</p>
                  <p className="text-2xl font-bold text-blue-600">{exercises.length}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-gray-600 mb-1">Total series</p>
                  <p className="text-2xl font-bold text-purple-600">{totalSets}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-gray-600 mb-1">Volumen total</p>
                  <p className="text-2xl font-bold text-green-600">{totalVolume.toFixed(0)} kg</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}