import { Play, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Exercise {
  id: string
  name: string
  description: string
  muscle_group: string
  equipment: string
  difficulty: string
  video_url?: string
  thumbnail_url?: string
  instructions?: string[]
}

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const muscleGroups = [
    { value: 'all', label: 'Todos' },
    { value: 'pecho', label: '💪 Pecho' },
    { value: 'espalda', label: '🦾 Espalda' },
    { value: 'piernas', label: '🦵 Piernas' },
    { value: 'hombros', label: '💪 Hombros' },
    { value: 'brazos', label: '💪 Brazos' },
    { value: 'core', label: '⭕ Core' },
  ]

  const difficulties = [
    { value: 'all', label: 'Todas' },
    { value: 'principiante', label: '🟢 Principiante' },
    { value: 'intermedio', label: '🟡 Intermedio' },
    { value: 'avanzado', label: '🔴 Avanzado' },
  ]

  useEffect(() => {
    fetchExercises()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [searchTerm, selectedMuscle, selectedDifficulty, exercises])

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (error) throw error
      setExercises(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterExercises = () => {
    let filtered = exercises

    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedMuscle !== 'all') {
      filtered = filtered.filter(ex => ex.muscle_group === selectedMuscle)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty)
    }

    setFilteredExercises(filtered)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante': return 'bg-green-100 text-green-700'
      case 'intermedio': return 'bg-yellow-100 text-yellow-700'
      case 'avanzado': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Cargando ejercicios...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Biblioteca de Ejercicios
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredExercises.length} ejercicios disponibles
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span className="hidden md:inline">Crear ejercicio</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar ejercicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Muscle Group Filter */}
            <select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {muscleGroups.map(group => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercises Grid */}
        {filteredExercises.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">
              No se encontraron ejercicios con esos filtros
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedMuscle('all')
                setSelectedDifficulty('all')
              }}
              className="btn-secondary"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map(exercise => (
              <div key={exercise.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                {/* Image/Thumbnail */}
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-40 mb-4 flex items-center justify-center">
                  {exercise.thumbnail_url ? (
                    <img 
                      src={exercise.thumbnail_url} 
                      alt={exercise.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-6xl">💪</div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">
                      {exercise.name}
                    </h3>
                    {exercise.video_url && (
                      <button className="text-blue-600 hover:text-blue-700">
                        <Play size={20} />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {exercise.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
                      {exercise.muscle_group}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
                      {exercise.equipment}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getDifficultyColor(exercise.difficulty)}`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}