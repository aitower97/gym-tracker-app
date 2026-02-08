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
      console.log('✅ Ejercicios cargados:', data?.length || 0)
      setAvailableExercises(data || [])
    } catch (error) {
      console.error('❌ Error cargando ejercicios:', error)
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
      console.log('📋 Ejercicio seleccionado:', { id: exerciseId, name: exerciseName })
    } else {
      if (!manualExerciseName.trim()) {
        alert('Escribe el nombre del ejercicio')
        return
      }
      exerciseName = manualExerciseName.trim()
      exerciseId = null
      console.log('✍️ Ejercicio escrito manualmente:', exerciseName)
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
    console.log('➕ Fila añadida a la tabla:', newRow)
    
    setSelectedExerciseId('')
    setManualExerciseName('')
    setShowAddForm(false)
    setSearchTerm('')
  }

  const removeExerciseRow = (tempId: string) => {
    setExerciseRows(exerciseRows.filter(row => row.tempId !== tempId))
    console.log('🗑️ Fila eliminada:', tempId)
  }

  const updateExerciseRow = (tempId: string, field: keyof WorkoutExerciseRow, value: any) => {
    setExerciseRows(exerciseRows.map(row => 
      row.tempId === tempId ? { ...row, [field]: value } : row
    ))
  }

  const saveWorkout = async () => {
    console.log('🔵 === INICIANDO GUARDADO DE WORKOUT ===')
    
    if (exerciseRows.length === 0) {
      alert('Añade al menos un ejercicio antes de guardar')
      return
    }

    console.log('📊 Ejercicios a guardar:', exerciseRows.length)
    console.log('📋 Detalle de ejercicios:', exerciseRows)

    setSaving(true)

    try {
      // 1. Obtener usuario
      console.log('🔵 Paso 1: Obteniendo usuario...')
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError || !userData.user) {
        throw new Error('No se pudo obtener el usuario')
      }
      console.log('✅ Usuario obtenido:', userData.user.id)

      // 2. Crear sesión
      console.log('🔵 Paso 2: Creando sesión de workout...')
      const sessionPayload = {
        user_id: userData.user.id,
        notes: workoutNotes || null,
        mood: mood,
        status: 'completed'
      }
      console.log('📤 Payload de sesión:', sessionPayload)

      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert(sessionPayload)
        .select('id')
        .single()

      if (sessionError) {
        console.error('❌ Error creando sesión:', sessionError)
        throw sessionError
      }
      
      console.log('✅ Sesión creada con ID:', sessionData.id)

      // 3. Procesar ejercicios
      console.log('🔵 Paso 3: Procesando ejercicios...')
      const exercisesToInsert = []

      for (let i = 0; i < exerciseRows.length; i++) {
        const row = exerciseRows[i]
        console.log(`🔵 Procesando ejercicio ${i + 1}/${exerciseRows.length}:`, row)
        
        let finalExerciseId = row.exercise_id

        // Si es un ejercicio nuevo escrito manualmente
        if (!row.exercise_id) {
          console.log(`✍️ Creando nuevo ejercicio: "${row.exercise_name}"`)
          
          const { data: newExercise, error: createError } = await supabase
            .from('exercises')
            .insert({
              name: row.exercise_name,
              muscle_group: 'otro',
              equipment: 'otro',
              difficulty: 'intermedio',
              is_public: false
            })
            .select('id')
            .single()

          if (createError) {
            console.error('❌ Error creando ejercicio:', createError)
            
            // Intentar buscar si ya existe
            const { data: existing } = await supabase
              .from('exercises')
              .select('id')
              .ilike('name', row.exercise_name)
              .limit(1)
              .single()

            if (existing) {
              console.log('✅ Ejercicio ya existía, usando ID:', existing.id)
              finalExerciseId = existing.id
            } else {
              console.error('❌ No se pudo crear ni encontrar el ejercicio')
              finalExerciseId = null
            }
          } else {
            console.log('✅ Ejercicio creado con ID:', newExercise.id)
            finalExerciseId = newExercise.id
          }
        }

        if (finalExerciseId) {
          const exercisePayload = {
            workout_id: sessionData.id,
            exercise_id: finalExerciseId,
            sets: row.sets,
            reps_min: row.reps,
            reps_max: row.reps,
            weight_kg: row.weight_kg > 0 ? row.weight_kg : null,
            notes: row.notes || null,
            order_index: i
          }
          
          console.log(`📤 Payload ejercicio ${i + 1}:`, exercisePayload)
          exercisesToInsert.push(exercisePayload)
        } else {
          console.error('⚠️ Saltando ejercicio (no tiene ID):', row.exercise_name)
        }
      }

      // 4. Insertar todos los ejercicios
      console.log('🔵 Paso 4: Insertando ejercicios en la BD...')
      console.log('📤 Total ejercicios a insertar:', exercisesToInsert.length)
      console.log('📋 Payload completo:', exercisesToInsert)

      const { data: insertedData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert)
        .select()

      if (exercisesError) {
        console.error('❌ Error insertando ejercicios:', exercisesError)
        throw exercisesError
      }

      console.log('✅ Ejercicios insertados correctamente:', insertedData)
      console.log('✅ === GUARDADO COMPLETADO EXITOSAMENTE ===')

      alert('✅ Entrenamiento guardado correctamente')
      navigate('/workouts')

    } catch (error: any) {
      console.error('❌ === ERROR EN EL GUARDADO ===')
      console.error('Error completo:', error)
      console.error('Mensaje:', error.message)
      console.error('Detalles:', error.details)
      console.error('Hint:', error.hint)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const filteredExercises = availableExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nuevo Entrenamiento
          </h1>
          <p className="text-gray-600">
            Registra tu sesión ejercicio por ejercicio
          </p>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Información General
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Ej: Día de pecho..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Ejercicios ({exerciseRows.length})
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Añadir
            </button>
          </div>

          {showAddForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Añadir ejercicio
              </h3>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setExerciseInputMode('select')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    exerciseInputMode === 'select'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  📋 Seleccionar de la lista
                </button>
                <button
                  onClick={() => setExerciseInputMode('write')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    exerciseInputMode === 'write'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  ✍️ Escribir manualmente
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

                  <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                    {loadingExercises ? (
                      <p className="text-gray-500 text-center py-4">Cargando ejercicios...</p>
                    ) : filteredExercises.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">No hay ejercicios guardados</p>
                        <button
                          onClick={() => setExerciseInputMode('write')}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Escribe el nombre del ejercicio →
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
                          <p className="font-semibold text-gray-900">{exercise.name}</p>
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
                    placeholder="Ej: Press banca, Sentadilla..."
                    value={manualExerciseName}
                    onChange={(e) => setManualExerciseName(e.target.value)}
                    className="input-field"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se creará automáticamente en tu biblioteca de ejercicios
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={addExerciseRow}
                  className="btn-primary flex-1"
                >
                  Añadir a la tabla
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

          {exerciseRows.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">
                No has añadido ejercicios todavía
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Añadir primer ejercicio
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
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
                        RPE
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Notas
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exerciseRows.map((row) => (
                      <tr key={row.tempId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{row.exercise_name}</p>
                          {!row.exercise_id && (
                            <span className="text-xs text-blue-600">Nuevo ejercicio</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={row.sets}
                            onChange={(e) => updateExerciseRow(row.tempId, 'sets', parseInt(e.target.value) || 1)}
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={row.reps}
                            onChange={(e) => updateExerciseRow(row.tempId, 'reps', parseInt(e.target.value) || 1)}
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={row.weight_kg}
                            onChange={(e) => updateExerciseRow(row.tempId, 'weight_kg', parseFloat(e.target.value) || 0)}
                            className="w-20 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={row.rpe}
                            onChange={(e) => updateExerciseRow(row.tempId, 'rpe', parseInt(e.target.value))}
                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(e) => updateExerciseRow(row.tempId, 'notes', e.target.value)}
                            placeholder="Notas..."
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeExerciseRow(row.tempId)}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>RPE:</strong> 1=Muy fácil | 5=Moderado | 7=Difícil | 9=Máximo | 10=Fallo
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={saveWorkout}
            disabled={saving || exerciseRows.length === 0}
            className="btn-primary flex items-center gap-2 flex-1"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar entrenamiento'}
          </button>
          
          <button
            onClick={() => navigate('/workouts')}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>

        {exerciseRows.length > 0 && (
          <div className="card mt-6 bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-3">
              📊 Resumen
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Ejercicios</p>
                <p className="text-2xl font-bold text-gray-900">{exerciseRows.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Series totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {exerciseRows.reduce((sum, row) => sum + row.sets, 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Volumen total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {exerciseRows.reduce((sum, row) => sum + (row.weight_kg * row.sets * row.reps), 0).toFixed(0)} kg
                </p>
              </div>
              <div>
                <p className="text-gray-600">RPE promedio</p>
                <p className="text-2xl font-bold text-gray-900">
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