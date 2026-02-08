import { Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Exercise {
  id: string
  name: string
  muscle_group: string
  equipment: string
}

interface WorkoutExerciseRow {
  tempId: string
  exercise_id: string | null
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number
  rpe: number
  notes: string
}

export default function WorkoutNew() {
  const navigate = useNavigate()
  
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [mood, setMood] = useState('bien')
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [exerciseRows, setExerciseRows] = useState<WorkoutExerciseRow[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [exerciseInputMode, setExerciseInputMode] = useState<'select' | 'write'>('select')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [manualExerciseName, setManualExerciseName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, equipment')
        .order('name')

      if (error) throw error
      setAvailableExercises(data || [])
    } catch (error) {
      console.error('Error cargando ejercicios:', error)
    } finally {
      setLoadingExercises(false)
    }
  }

  const addExerciseRow = () => {
    let exerciseName = ''
    let exerciseId: string | null = null

    if (exerciseInputMode === 'select') {
      if (!selectedExerciseId) {
        alert('Selecciona un ejercicio de la lista')
        return
      }
      const exercise = availableExercises.find(ex => ex.id === selectedExerciseId)
      if (!exercise) return
      
      exerciseName = exercise.name
      exerciseId = exercise.id
    } else {
      if (!manualExerciseName.trim()) {
        alert('Escribe el nombre del ejercicio')
        return
      }
      exerciseName = manualExerciseName.trim()
      exerciseId = null
    }

    const newRow: WorkoutExerciseRow = {
      tempId: `temp-${Date.now()}`,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      sets: 3,
      reps: 10,
      weight_kg: 0,
      rpe: 7,
      notes: ''
    }

    setExerciseRows([...exerciseRows, newRow])
    setSelectedExerciseId('')
    setManualExerciseName('')
    setShowAddForm(false)
    setSearchTerm('')
  }

  const removeExerciseRow = (tempId: string) => {
    setExerciseRows(exerciseRows.filter(row => row.tempId !== tempId))
  }

  const updateExerciseRow = (tempId: string, field: keyof WorkoutExerciseRow, value: any) => {
    setExerciseRows(exerciseRows.map(row => 
      row.tempId === tempId ? { ...row, [field]: value } : row
    ))
  }

  const saveWorkout = async () => {
    if (exerciseRows.length === 0) {
      alert('Añade al menos un ejercicio antes de guardar')
      return
    }

    setSaving(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw new Error('No se pudo obtener el usuario')
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userData.user.id,
          notes: workoutNotes || null,
          mood: mood,
          status: 'completed'
        })
        .select('id')
        .single()

      if (sessionError) throw sessionError

      const exercisesToInsert = []

      for (let i = 0; i < exerciseRows.length; i++) {
        const row = exerciseRows[i]
        let finalExerciseId = row.exercise_id

        if (!row.exercise_id) {
          const { data: newExercise, error: createError } = await supabase
            .from('exercises')
            .insert({
              name: row.exercise_name,
              description: 'Ejercicio personalizado',
              muscle_group: 'otro',
              equipment: 'otro',
              difficulty: 'intermedio',
              is_public: false,
              created_by: userData.user.id
            })
            .select('id')
            .single()

          if (createError) {
            const { data: existing } = await supabase
              .from('exercises')
              .select('id')
              .ilike('name', row.exercise_name)
              .limit(1)
              .single()

            finalExerciseId = existing?.id || null
          } else {
            finalExerciseId = newExercise.id
          }
        }

        if (finalExerciseId) {
          exercisesToInsert.push({
            workout_id: sessionData.id,
            exercise_id: finalExerciseId,
            sets: row.sets,
            reps_min: row.reps,
            reps_max: row.reps,
            weight_kg: row.weight_kg > 0 ? row.weight_kg : null,
            notes: row.notes || null,
            order_index: i
          })
        }
      }

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert)

      if (exercisesError) throw exercisesError

      alert('✅ Entrenamiento guardado correctamente')
      navigate('/workouts')

    } catch (error: any) {
      console.error('Error guardando workout:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const filteredExercises = availableExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="mobile-safe-area">
      <main className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="page-header">
            Nuevo Entrenamiento
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Registra tu sesión ejercicio por ejercicio
          </p>
        </div>

        {/* Info del workout */}
        <div className="card-compact mb-4 sm:mb-6">
          <h2 className="section-header">
            Información General
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                Notas (opcional)
              </label>
              <input
                type="text"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Día de pecho..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Tabla de ejercicios */}
        <div className="card-compact">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="section-header mb-0">
              Ejercicios ({exerciseRows.length})
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span>Añadir</span>
            </button>
          </div>

          {/* Formulario de añadir */}
          {showAddForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
                Añadir ejercicio
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                <button
                  onClick={() => setExerciseInputMode('select')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    exerciseInputMode === 'select'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  📋 Lista
                </button>
                <button
                  onClick={() => setExerciseInputMode('write')}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    exerciseInputMode === 'write'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  ✍️ Escribir
                </button>
              </div>

              {exerciseInputMode === 'select' && (
                <>
                  <input
                    type="text"
                    placeholder="Buscar ejercicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field mb-3"
                  />

                  <div className="max-h-48 sm:max-h-60 overflow-y-auto space-y-2 mb-3">
                    {loadingExercises ? (
                      <p className="text-gray-500 text-center py-4 text-sm">Cargando...</p>
                    ) : filteredExercises.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-gray-500 mb-2 text-sm">No hay ejercicios</p>
                        <button
                          onClick={() => setExerciseInputMode('write')}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Escribe el nombre →
                        </button>
                      </div>
                    ) : (
                      filteredExercises.map(exercise => (
                        <div
                          key={exercise.id}
                          onClick={() => setSelectedExerciseId(exercise.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedExerciseId === exercise.id
                              ? 'bg-blue-200 border-2 border-blue-500'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <p className="font-semibold text-gray-900 text-sm">{exercise.name}</p>
                          <p className="text-xs text-gray-600 capitalize">
                            {exercise.muscle_group} • {exercise.equipment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {exerciseInputMode === 'write' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del ejercicio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Press banca..."
                    value={manualExerciseName}
                    onChange={(e) => setManualExerciseName(e.target.value)}
                    className="input-field"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={addExerciseRow}
                  className="btn-primary flex-1"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setSelectedExerciseId('')
                    setManualExerciseName('')
                    setSearchTerm('')
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabla */}
          {exerciseRows.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4 text-sm sm:text-base">
                No hay ejercicios añadidos
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Añadir ejercicio
              </button>
            </div>
          ) : (
            <>
              <div className="table-container scroll-touch">
                <table className="table-responsive w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
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
                        RPE
                      </th>
                      <th className="text-center text-xs font-semibold text-gray-700 uppercase">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exerciseRows.map((row) => (
                      <tr key={row.tempId} className="hover:bg-gray-50">
                        <td className="min-w-[120px]">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {row.exercise_name}
                          </p>
                        </td>

                        <td className="text-center">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={row.sets}
                            onChange={(e) => updateExerciseRow(row.tempId, 'sets', parseInt(e.target.value) || 1)}
                            className="input-sm w-12 text-center"
                          />
                        </td>

                        <td className="text-center">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={row.reps}
                            onChange={(e) => updateExerciseRow(row.tempId, 'reps', parseInt(e.target.value) || 1)}
                            className="input-sm w-12 text-center"
                          />
                        </td>

                        <td className="text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={row.weight_kg}
                            onChange={(e) => updateExerciseRow(row.tempId, 'weight_kg', parseFloat(e.target.value) || 0)}
                            className="input-sm w-16 text-center"
                            placeholder="0"
                          />
                        </td>

                        <td className="text-center">
                          <select
                            value={row.rpe}
                            onChange={(e) => updateExerciseRow(row.tempId, 'rpe', parseInt(e.target.value))}
                            className="input-sm w-12 text-center"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </td>

                        <td className="text-center">
                          <button
                            onClick={() => removeExerciseRow(row.tempId)}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>RPE:</strong> 1=Fácil | 5=Moderado | 7=Difícil | 9=Máximo | 10=Fallo
                </p>
              </div>
            </>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
          <button
            onClick={saveWorkout}
            disabled={saving || exerciseRows.length === 0}
            className="btn-primary flex items-center justify-center gap-2 sm:flex-1"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          
          <button
            onClick={() => navigate('/workouts')}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>

        {/* Resumen */}
        {exerciseRows.length > 0 && (
          <div className="card-compact mt-4 sm:mt-6 bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">
              📊 Resumen
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-600">Ejercicios</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{exerciseRows.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Series</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {exerciseRows.reduce((sum, row) => sum + row.sets, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Volumen</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {exerciseRows.reduce((sum, row) => sum + (row.weight_kg * row.sets * row.reps), 0).toFixed(0)} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">RPE medio</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {(exerciseRows.reduce((sum, row) => sum + row.rpe, 0) / exerciseRows.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}