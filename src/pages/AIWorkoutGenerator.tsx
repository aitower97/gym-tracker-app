import { Loader2, RefreshCw, Save, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { generateWorkout } from '../lib/groq'
import { supabase } from '../lib/supabase'

interface TrainerProfile {
  id: string
  name: string
  specialty: string
  philosophy: string
  training_style: string
  intensity_preference: string
  volume_preference: string
  rest_time_preference: number
  favorite_exercises?: string[]
  typical_rep_ranges: string
}

export default function AIWorkoutGenerator() {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([])
  const [selectedTrainer, setSelectedTrainer] = useState<string>('')
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null)

  // Form state
  const [goal, setGoal] = useState('')
  const [muscleGroups, setMuscleGroups] = useState<string[]>([])
  const [duration, setDuration] = useState(60)
  const [equipment, setEquipment] = useState<string[]>([])
  const [level, setLevel] = useState('intermedio')

  useEffect(() => {
    fetchTrainers()
    fetchExercises()
  }, [])

  const fetchTrainers = async () => {
    const { data } = await supabase
      .from('trainer_profiles')
      .select('*')
      .eq('is_active', true)
    
    setTrainers(data || [])
    if (data && data.length > 0) {
      setSelectedTrainer(data[0].id)
    }
  }

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
    
    setExercises(data || [])
  }

  const handleGenerate = async () => {
    if (!selectedTrainer || !goal) {
      alert('Selecciona un entrenador y define tu objetivo')
      return
    }

    setLoading(true)
    setGeneratedWorkout(null)

    try {
      const trainer = trainers.find(t => t.id === selectedTrainer)
      if (!trainer) throw new Error('Entrenador no encontrado')

      const workout = await generateWorkout(
        trainer,
        {
          goal,
          target_muscle_groups: muscleGroups,
          duration_minutes: duration,
          available_equipment: equipment.length > 0 ? equipment : ['barra', 'mancuernas', 'máquina', 'peso corporal'],
          experience_level: level
        },
        exercises
      )

      setGeneratedWorkout(workout)

      // Guardar en la base de datos
      await supabase.from('ai_generated_workouts').insert({
        trainer_profile_id: selectedTrainer,
        workout_name: workout.workout_name,
        goal,
        duration_minutes: workout.estimated_duration,
        workout_structure: workout,
        ai_reasoning: workout.reasoning
      })

    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al generar entrenamiento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const muscleOptions = [
    'pecho', 'espalda', 'piernas', 'hombros', 'brazos', 'core'
  ]

  const equipmentOptions = [
    'barra', 'mancuernas', 'máquina', 'peso corporal', 'bandas', 'kettlebell'
  ]

  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Generador IA de Entrenamientos
          </h1>
          <p className="text-gray-600">
            Crea entrenamientos personalizados con diferentes estilos de entrenadores
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Configuración</h2>

              {/* Seleccionar Entrenador */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrenador Virtual
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="input-field"
                >
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} - {trainer.specialty}
                    </option>
                  ))}
                </select>
                
                {selectedTrainer && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="font-medium text-blue-900 mb-1">
                      {trainers.find(t => t.id === selectedTrainer)?.name}
                    </p>
                    <p className="text-blue-700 text-xs">
                      {trainers.find(t => t.id === selectedTrainer)?.philosophy}
                    </p>
                  </div>
                )}
              </div>

              {/* Objetivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivo del Entrenamiento
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej: Aumentar masa muscular en pecho y tríceps"
                  className="input-field"
                />
              </div>

              {/* Grupos Musculares */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupos Musculares
                </label>
                <div className="flex flex-wrap gap-2">
                  {muscleOptions.map(muscle => (
                    <button
                      key={muscle}
                      onClick={() => {
                        if (muscleGroups.includes(muscle)) {
                          setMuscleGroups(muscleGroups.filter(m => m !== muscle))
                        } else {
                          setMuscleGroups([...muscleGroups, muscle])
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        muscleGroups.includes(muscle)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duración */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración: {duration} minutos
                </label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Equipo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipo Disponible (opcional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map(eq => (
                    <button
                      key={eq}
                      onClick={() => {
                        if (equipment.includes(eq)) {
                          setEquipment(equipment.filter(e => e !== eq))
                        } else {
                          setEquipment([...equipment, eq])
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        equipment.includes(eq)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nivel */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Experiencia
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="input-field"
                >
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !goal}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generar Entrenamiento
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div>
            {generatedWorkout ? (
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {generatedWorkout.workout_name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Duración estimada: {generatedWorkout.estimated_duration} min
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Save size={24} />
                  </button>
                </div>

                {/* Calentamiento */}
                {generatedWorkout.warm_up && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      🔥 Calentamiento
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {generatedWorkout.warm_up.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ejercicios */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    💪 Entrenamiento Principal
                  </h3>
                  <div className="space-y-4">
                    {generatedWorkout.exercises.map((ex: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {idx + 1}. {ex.exercise_name}
                          </h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {ex.sets} x {ex.reps}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Descanso: {ex.rest_seconds}s
                        </p>
                        {ex.notes && (
                          <p className="text-xs text-gray-500 italic">
                            💡 {ex.notes}
                          </p>
                        )}
                        {ex.intensity_technique && (
                          <p className="text-xs text-purple-600 font-medium mt-1">
                            ⚡ {ex.intensity_technique}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enfriamiento */}
                {generatedWorkout.cool_down && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      🧘 Enfriamiento
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {generatedWorkout.cool_down.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notas del Entrenador */}
                {generatedWorkout.trainer_notes && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      📝 Consejos del Entrenador
                    </h3>
                    <p className="text-sm text-blue-800">
                      {generatedWorkout.trainer_notes}
                    </p>
                  </div>
                )}

                {/* Razonamiento */}
                {generatedWorkout.reasoning && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      🧠 Por qué este entrenamiento
                    </h3>
                    <p className="text-sm text-purple-800">
                      {generatedWorkout.reasoning}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setGeneratedWorkout(null)}
                  className="btn-secondary w-full mt-4 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Generar otro
                </button>
              </div>
            ) : (
              <div className="card text-center py-12">
                <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  Configura los parámetros y genera tu entrenamiento personalizado
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}