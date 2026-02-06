import { FormEvent, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    if (isLogin) {
      await signIn(email, password)
    } else {
      await signUp(email, password, fullName)
      alert('¡Cuenta creada! Revisa tu email para confirmar.')
    }
  } catch (err: any) {
    // Mensaje de error más amigable
    let errorMsg = err.message
    
    if (errorMsg.includes('User already registered')) {
      errorMsg = 'Este email ya está registrado. ¿Quieres iniciar sesión?'
    } else if (errorMsg.includes('Invalid login credentials')) {
      errorMsg = 'Email o contraseña incorrectos'
    } else if (errorMsg.includes('Email not confirmed')) {
      errorMsg = 'Revisa tu email y confirma tu cuenta primero'
    }
    
    setError(errorMsg)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏋️ Gym Tracker
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-sm text-gray-600 hover:text-gray-800 w-full"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}