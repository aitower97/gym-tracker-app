import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface TemplateInfo {
  name: string
  description: string
}

interface ExerciseRow {
  id: string
  exercise_id: string
  exercise_name: string
  sets: number
  reps_min: number
  reps_max: number
  target_weight_kg: number | null
  notes: string | null
  completed_sets: Set<number>
  actual_weights: number[]
  actual_reps: number[]
}

export default function StartWorkout() {
  const { templateId } = useParams()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<TemplateInfo | null>(null)
  const [exercises, setExercises] = useState<ExerciseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mood, setMood] = useState('bien')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      // Cargar info de la plantilla
      const { data: templateData, error: templateError } = await supabase
        .from('workout_templates')
        .select('name, description')
        .eq('id', templateId)
        .single()

      if (templateError) throw templateError
      setTemplate(templateData)

      // Cargar ejercicios
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('template_exercises')
        .select(`
          id,
          exercise_id,
          sets,
          reps_min,
          reps_max,
          target_weight_kg,
          notes,
          exercise:exercises(name)
        `)
        .eq('template_id', templateId)
        .order('order_index')

      if (exercisesError) throw exercisesError

      // Preparar estructura para el entrenamiento
      const exerciseRows: ExerciseRow[] = (exercisesData || []).map(ex => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        exercise_name: (ex.exercise as any).name,
        sets: ex.sets,
        reps_min: ex.reps_min,
        reps_max: ex.reps_max,
        target_weight_kg: ex.target_weight_kg,
        notes: ex.notes,
        completed_sets: new Set(),
        actual_weights: Array(ex.sets).fill(ex.target_weight_kg || 0),
        actual_reps: Array(ex.sets).fill(ex.reps_min)
      }))

      setExercises(exerciseRows)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error cargando plantilla')
      navigate('/templates')
    } finally {
      setLoading(false)
    }
  }

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newCompleted = new Set(ex.completed_sets)
        if (newCompleted.has(setIndex)) {
          newCompleted.delete(setIndex)
        } else {
          newCompleted.add(setIndex)
        }
        return { ...ex, completed_sets: newCompleted }
      }
      return ex
    }))
  }

  const updateWeight = (exerciseId: string, setIndex: number, weight: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newWeights = [...ex.actual_weights]
        newWeights[setIndex] = weight
        return { ...ex, actual_weights: newWeights }
      }
      return ex
    }))
  }

  const updateReps = (exerciseId: string, setIndex: number, reps: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newReps = [...ex.actual_reps]
        newReps[setIndex] = reps
        return { ...ex, actual_reps: newReps }
      }
      return ex
    }))
  }

  const saveWorkout = async () => {
    setSaving(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw new Error('No se pudo obtener el usuario')
      }

      // Crear sesión
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userData.user.id,
          notes: notes || null,
          mood: mood,
          status: 'completed'
        })
        .select('id')
        .single()

      if (sessionError) throw sessionError

      // Guardar ejercicios con los pesos y reps reales
      const exercisesToInsert = exercises.map((ex, index) => {
        // Calcular peso y reps promedio de las series completadas
        const completedSets = Array.from(ex.completed_sets)
        const avgWeight = completedSets.length > 0
          ? completedSets.reduce((sum, i) => sum + ex.actual_weights[i], 0) / completedSets.length
          : ex.actual_weights[0] || 0

        const avgReps = completedSets.length > 0
          ? Math.round(completedSets.reduce((sum, i) => sum + ex.actual_reps[i], 0) / completedSets.length)
          : ex.actual_reps[0] || ex.reps_min

        return {
          workout_id: sessionData.id,
          exercise_id: ex.exercise_id,
          sets: completedSets.length || ex.sets,
          reps_min: avgReps,
          reps_max: avgReps,
          weight_kg: avgWeight > 0 ? avgWeight : null,
          notes: ex.notes,
          order_index: index
        }
      })

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert)

      if (exercisesError) throw exercisesError

      alert('✅ Entrenamiento guardado correctamente')
      navigate('/workouts')

    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mobile-safe-area">
        <div className="container-responsive py-4 sm:py-6 md:py-8">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  const totalSetsCompleted = exercises.reduce((sum, ex) => sum + ex.completed_sets.size, 0)
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)

  return (
    <div className="mobile-safe-area">
      <main className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 text-sm"
          >
            <ArrowLeft size={18} />
            <span>Volver a plantillas</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="page-header">{template.name}</h1>
              {template.description && (
                <p className="text-sm text-gray-600">{template.description}</p>
              )}
            </div>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
              {totalSetsCompleted} / {totalSets} series
            </div>
          </div>
        </div>

        {/* Info general */}
        <div className="card-compact mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cómo te sientes?
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="input-field"
              >
                <option value="excelente">😁 Excelente</option>
                <option value="bien">😊 Bien</option>
                <option value="normal">😐 Normal</option>
                <option value="cansado">😴 Cansado</option>
                <option value="mal">😓 Mal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Ejercicios */}
        <div className="space-y-4">
          {exercises.map((exercise, exIndex) => (
            <div key={exercise.id} className="card-compact">
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">
                    {exIndex + 1}. {exercise.exercise_name}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {exercise.completed_sets.size}/{exercise.sets} series
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {exercise.sets} × {exercise.reps_min}-{exercise.reps_max} reps
                  {exercise.target_weight_kg && ` @ ${exercise.target_weight_kg}kg`}
                </p>
              </div>

              {/* Series */}
              <div className="space-y-2">
                {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                  const isCompleted = exercise.completed_sets.has(setIndex)
                  
                  return (
                    <div
                      key={setIndex}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-colors ${
                        isCompleted
                          ? 'bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleSetComplete(exercise.id, setIndex)}
                        className="w-5 h-5 text-green-600 rounded cursor-pointer"
                      />

                      {/* Serie número */}
                      <span className="text-sm font-medium text-gray-700 w-8">
                        #{setIndex + 1}
                      </span>

                      {/* Peso */}
                      <div className="flex-1">
                        <input
                          type="number"
                          value={exercise.actual_weights[setIndex]}
                          onChange={(e) => updateWeight(exercise.id, setIndex, parseFloat(e.target.value) || 0)}
                          className="input-sm w-full text-center"
                          placeholder="Peso"
                          step="0.5"
                        />
                        <p className="text-xs text-gray-500 text-center mt-0.5">kg</p>
                      </div>

                      {/* Reps */}
                      <div className="flex-1">
                        <input
                          type="number"
                          value={exercise.actual_reps[setIndex]}
                          onChange={(e) => updateReps(exercise.id, setIndex, parseInt(e.target.value) || 0)}
                          className="input-sm w-full text-center"
                          placeholder="Reps"
                        />
                        <p className="text-xs text-gray-500 text-center mt-0.5">reps</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {exercise.notes && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                  💡 {exercise.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botón guardar */}
        <div className="sticky bottom-20 sm:bottom-8 mt-6">
          <button
            onClick={saveWorkout}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar entrenamiento'}
          </button>
        </div>

        {/* Resumen */}
        <div className="card-compact mt-4 bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">
            📊 Progreso
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-600">Ejercicios</p>
              <p className="text-lg font-bold text-gray-900">{exercises.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Series completadas</p>
              <p className="text-lg font-bold text-green-600">{totalSetsCompleted}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">% Completado</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.round((totalSetsCompleted / totalSets) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}