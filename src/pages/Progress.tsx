import { Calendar, Dumbbell, Target, TrendingUp } from 'lucide-react'

export default function Progress() {
  return (
    <div className="pb-20 md:pb-8">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mi Progreso
          </h1>
          <p className="text-gray-600">
            Seguimiento de tu evolución en el gimnasio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Racha actual</p>
                <p className="text-2xl font-bold text-gray-900">0 días</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total sesiones</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Dumbbell className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ejercicios únicos</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Target className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Objetivo semanal</p>
                <p className="text-2xl font-bold text-gray-900">0/3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Próximamente
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>📊 Gráficos de progreso por ejercicio</li>
            <li>📈 Evolución de peso levantado</li>
            <li>🔥 Sistema de rachas y logros</li>
            <li>📸 Comparación de fotos de progreso</li>
            <li>🎯 Objetivos personalizados</li>
          </ul>
        </div>
      </main>
    </div>
  )
}