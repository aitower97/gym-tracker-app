import { Play, Plus, Save, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Exercise {
  id: string
  name: string
  muscle_group: string
  equipment: string
}

interface TemplateExercise {
  tempId: string
  exercise_id: string | null
  exercise_name: string
  sets: number
  reps_min: number
  reps_max: number
  target_weight_kg: number
  notes: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  is_favorite: boolean
  created_at: string
  exercise_count?: number
}

export default function Templates() {
  const navigate = useNavigate()
  
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Formulario de crear plantilla
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [exerciseRows, setExerciseRows] = useState<TemplateExercise[]>([])
  
  // Añadir ejercicio
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseInputMode, setExerciseInputMode] = useState<'select' | 'write'>('select')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [manualExerciseName, setManualExerciseName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchExercises()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const templatesWithCount = await Promise.all(
        (data || []).map(async (template) => {
          const { count } = await supabase
            .from('template_exercises')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id)

          return {
            ...template,
            exercise_count: count || 0
          }
        })
      )

      setTemplates(templatesWithCount)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, equipment')
        .order('name')

      if (error) throw error
      setAvailableExercises(data || [])
    } catch (error) {
      console.error('Error:', error)
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

    const newRow: TemplateExercise = {
      tempId: `temp-${Date.now()}`,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      sets: 3,
      reps_min: 8,
      reps_max: 12,
      target_weight_kg: 0,
      notes: ''
    }

    setExerciseRows([...exerciseRows, newRow])
    setSelectedExerciseId('')
    setManualExerciseName('')
    setShowAddExercise(false)
    setSearchTerm('')
  }

  const removeExerciseRow = (tempId: string) => {
    setExerciseRows(exerciseRows.filter(row => row.tempId !== tempId))
  }

  const updateExerciseRow = (tempId: string, field: keyof TemplateExercise, value: any) => {
    setExerciseRows(exerciseRows.map(row => 
      row.tempId === tempId ? { ...row, [field]: value } : row
    ))
  }

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Añade un nombre a la plantilla')
      return
    }

    if (exerciseRows.length === 0) {
      alert('Añade al menos un ejercicio')
      return
    }

    setSaving(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw new Error('No se pudo obtener el usuario')
      }

      // Crear plantilla
      const { data: templateData, error: templateError } = await supabase
        .from('workout_templates')
        .insert({
          user_id: userData.user.id,
          name: templateName,
          description: templateDescription || null
        })
        .select('id')
        .single()

      if (templateError) throw templateError

      // Procesar ejercicios (crear nuevos si es necesario)
      const exercisesToInsert = []

      for (let i = 0; i < exerciseRows.length; i++) {
        const row = exerciseRows[i]
        let finalExerciseId = row.exercise_id

        // Si el ejercicio fue escrito manualmente, crearlo primero
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
            template_id: templateData.id,
            exercise_id: finalExerciseId,
            sets: row.sets,
            reps_min: row.reps_min,
            reps_max: row.reps_max,
            target_weight_kg: row.target_weight_kg > 0 ? row.target_weight_kg : null,
            notes: row.notes || null,
            order_index: i
          })
        }
      }

      const { error: exercisesError } = await supabase
        .from('template_exercises')
        .insert(exercisesToInsert)

      if (exercisesError) throw exercisesError

      alert('✅ Plantilla creada correctamente')
      setShowCreateForm(false)
      resetForm()
      fetchTemplates()

    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setTemplateName('')
    setTemplateDescription('')
    setExerciseRows([])
    setExerciseInputMode('select')
    setSelectedExerciseId('')
    setManualExerciseName('')
    setSearchTerm('')
  }

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .update({ is_favorite: !currentFavorite })
        .eq('id', id)

      if (error) throw error
      fetchTemplates()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return

    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('✅ Plantilla eliminada')
      fetchTemplates()
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const startWorkout = (templateId: string) => {
    navigate(`/workouts/start/${templateId}`)
  }

  const filteredExercises = availableExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="mobile-safe-area">
        <div className="container-responsive py-4 sm:py-6 md:py-8">
          <div className="text-center">Cargando plantillas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-safe-area">
      <main className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="page-header">Plantillas</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Crea rutinas y úsalas cuando quieras
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Nueva plantilla
          </button>
        </div>

        {/* Lista de plantillas */}
        {templates.length === 0 ? (
          <div className="card text-center py-8 sm:py-12">
            <p className="text-gray-600 mb-4">No tienes plantillas creadas</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Crear primera plantilla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {templates.map(template => (
              <div key={template.id} className="card-compact hover:shadow-lg transition-shadow relative">
                {template.is_favorite && (
                  <div className="absolute top-2 right-2">
                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                  </div>
                )}

                <div className="mb-3">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 truncate-2-lines">
                      {template.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <span>{template.exercise_count} ejercicios</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startWorkout(template.id)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                  >
                    <Play size={16} />
                    Iniciar
                  </button>
                  
                  <button
                    onClick={() => toggleFavorite(template.id, template.is_favorite)}
                    className="btn-secondary px-3"
                    title="Marcar como favorito"
                  >
                    <Star size={16} className={template.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''} />
                  </button>

                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="btn-secondary px-3 text-red-600 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal crear plantilla */}
        {showCreateForm && (
          <div className="modal-container">
            <div className="modal-content p-0 max-w-2xl">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Nueva Plantilla
                </h2>

                {/* Nombre y descripción */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la plantilla *
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Ej: Rutina Pecho y Tríceps"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Breve descripción..."
                      className="input-field"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Lista de ejercicios */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">
                      Ejercicios ({exerciseRows.length})
                    </h3>
                    <button
                      onClick={() => setShowAddExercise(!showAddExercise)}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      <Plus size={16} />
                      Añadir
                    </button>
                  </div>

                  {/* Form añadir ejercicio */}
                  {showAddExercise && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                        Añadir ejercicio
                      </h4>

                      {/* Selector de modo */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
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

                      {/* Modo: Seleccionar */}
                      {exerciseInputMode === 'select' && (
                        <>
                          <input
                            type="text"
                            placeholder="Buscar ejercicio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field mb-2"
                          />
                          <div className="max-h-40 overflow-y-auto space-y-2 mb-2">
                            {filteredExercises.length === 0 ? (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500 mb-2">No hay ejercicios</p>
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
                                  className={`p-2 rounded cursor-pointer text-sm ${
                                    selectedExerciseId === exercise.id
                                      ? 'bg-blue-200 border-2 border-blue-500'
                                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <p className="font-semibold text-gray-900">{exercise.name}</p>
                                  <p className="text-xs text-gray-600 capitalize">
                                    {exercise.muscle_group}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}

                      {/* Modo: Escribir */}
                      {exerciseInputMode === 'write' && (
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          <p className="text-xs text-gray-500 mt-1">
                            Se creará automáticamente
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={addExerciseRow} className="btn-primary flex-1 text-sm">
                          Añadir
                        </button>
                        <button
                          onClick={() => {
                            setShowAddExercise(false)
                            setSelectedExerciseId('')
                            setManualExerciseName('')
                            setSearchTerm('')
                          }}
                          className="btn-secondary text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de ejercicios */}
                  {exerciseRows.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">No hay ejercicios añadidos</p>
                    </div>
                  ) : (
                    <div className="table-container scroll-touch">
                      <table className="table-responsive w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left text-xs">Ejercicio</th>
                            <th className="text-center text-xs">Series</th>
                            <th className="text-center text-xs">Reps</th>
                            <th className="text-center text-xs">Peso obj.</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {exerciseRows.map(row => (
                            <tr key={row.tempId} className="hover:bg-gray-50">
                              <td className="min-w-[100px]">
                                <p className="font-medium text-sm truncate">{row.exercise_name}</p>
                                {!row.exercise_id && (
                                  <span className="text-xs text-blue-600">Nuevo</span>
                                )}
                              </td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  value={row.sets}
                                  onChange={(e) => updateExerciseRow(row.tempId, 'sets', parseInt(e.target.value) || 1)}
                                  className="input-sm w-12 text-center"
                                  min="1"
                                />
                              </td>
                              <td className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    value={row.reps_min}
                                    onChange={(e) => updateExerciseRow(row.tempId, 'reps_min', parseInt(e.target.value) || 1)}
                                    className="input-sm w-10 text-center"
                                    min="1"
                                  />
                                  <span className="text-xs">-</span>
                                  <input
                                    type="number"
                                    value={row.reps_max}
                                    onChange={(e) => updateExerciseRow(row.tempId, 'reps_max', parseInt(e.target.value) || 1)}
                                    className="input-sm w-10 text-center"
                                    min="1"
                                  />
                                </div>
                              </td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  value={row.target_weight_kg}
                                  onChange={(e) => updateExerciseRow(row.tempId, 'target_weight_kg', parseFloat(e.target.value) || 0)}
                                  className="input-sm w-14 text-center"
                                  step="0.5"
                                  placeholder="0"
                                />
                              </td>
                              <td className="text-center">
                                <button
                                  onClick={() => removeExerciseRow(row.tempId)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Botones finales */}
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      resetForm()
                    }}
                    className="btn-secondary flex-1"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveTemplate}
                    disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {saving ? 'Guardando...' : 'Guardar plantilla'}
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