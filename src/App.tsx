import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navigation from './components/Navigation'
import Auth from './contexts/Auth'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AIWorkoutGenerator from './pages/AIWorkoutGenerator'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises.tsx'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" />
}

function AppContent() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
        <Route path="/workouts" element={<ProtectedRoute><div className="p-8 text-center">Próximamente: Entrenamientos</div></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><div className="p-8 text-center">Próximamente: Progreso</div></ProtectedRoute>} />
        <Route path="/ai-generator" element={<ProtectedRoute><AIWorkoutGenerator /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App