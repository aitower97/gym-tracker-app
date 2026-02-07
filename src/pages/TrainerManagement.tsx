import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TrainerManagement() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'hipertrofia',
    philosophy: '',
    training_style: '',
    intensity_preference: 'moderada',
    volume_preference: 'moderado',
    rest_time_preference: 90,
    typical_rep_ranges: '8-12'
  })

  useEffect(() => {
    fetchTrainers()
  }, [])

  const fetchTrainers = async () => {
    const { data } = await supabase
      .from('trainer_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    setTrainers(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('trainer_profiles')
      .insert([formData])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setShowForm(false)
      setFormData({
        name: '',
        specialty: 'hipertrofia',
        philosophy: '',
        training_style: '',
        intensity_preference: 'moderada',
        volume_preference: 'moderado',
        rest_time_preference: 90,
        typical_rep_ranges: '8-12'
      })
      fetchTrainers()
    }
  }

  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Entrenadores Virtuales
            </h1>
            <p className="text-gray-600 mt-1">
              Crea perfiles de entrenadores con diferentes estilos
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Entrenador
          </button>
        </div>

        {showForm && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold mb-4">Crear Entrenador Virtual</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                  placeholder="Ej: Coach Hipertrofia Elite"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Especialidad</label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  className="input-field"
                >
                  <option value="hipertrofia">Hipertrofia</option>
                  <option value="fuerza">Fuerza</option>
                  <option value="resistencia">Resistencia</option>
                  <option value="calistenia">Calistenia</option>
                  <option value="crossfit">CrossFit</option>
                  <option value="powerlifting">Powerlifting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Filosofía</label>
                <textarea
                  value={formData.philosophy}
                  onChange={(e) => setFormData({...formData, philosophy: e.target.value})}
                  className="input-field"
                  rows={3}
                  required
                  placeholder="Ej: Creo en la sobrecarga progresiva y el volumen alto para maximizar la hipertrofia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estilo de Entrenamiento</label>
                <textarea
                  value={formData.training_style}
                  onChange={(e) => setFormData({...formData, training_style: e.target.value})}
                  className="input-field"
                  rows={3}
                  required
                  placeholder="Ej: Rutinas de 4-5 ejercicios por grupo muscular, con técnicas avanzadas como drop sets..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Intensidad</label>
                  <select
                    value={formData.intensity_preference}
                    onChange={(e) => setFormData({...formData, intensity_preference: e.target.value})}
                    className="input-field"
                  >
                    <option value="baja">Baja</option>
                    <option value="moderada">Moderada</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Volumen</label>
                  <select
                    value={formData.volume_preference}
                    onChange={(e) => setFormData({...formData, volume_preference: e.target.value})}
                    className="input-field"
                  >
                    <option value="bajo">Bajo</option>
                    <option value="moderado">Moderado</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descansos típicos (segundos)
                </label>
                <input
                  type="number"
                  value={formData.rest_time_preference}
                  onChange={(e) => setFormData({...formData, rest_time_preference: parseInt(e.target.value)})}
                  className="input-field"
                  min="30"
                  max="300"
                  step="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Rangos de repeticiones típicos
                </label>
                <input
                  type="text"
                  value={formData.typical_rep_ranges}
                  onChange={(e) => setFormData({...formData, typical_rep_ranges: e.target.value})}
                  className="input-field"
                  placeholder="Ej: 8-12 hipertrofia, 3-5 fuerza"
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Crear Entrenador
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map(trainer => (
            <div key={trainer.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{trainer.name}</h3>
                  <span className="text-sm text-blue-600 capitalize">
                    {trainer.specialty}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {trainer.philosophy}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Intensidad: {trainer.intensity_preference}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Volumen: {trainer.volume_preference}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Descanso: {trainer.rest_time_preference}s
                </span>
              </div>
            </div>
          ))}
        </div>

        {trainers.length === 0 && !showForm && (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">
              No tienes entrenadores virtuales aún
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Crear tu primer entrenador
            </button>
          </div>
        )}
      </main>
    </div>
  )
}