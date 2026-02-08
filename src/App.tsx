import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navigation from './components/Navigation'
import Auth from './contexts/Auth'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AIWorkoutGenerator from './pages/AIWorkoutGenerator'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import Progress from "./pages/Progress"
import StartWorkout from './pages/StartWorkout'
import Templates from './pages/Templates'
import TrainerManagement from './pages/TrainerManagement'
import WorkoutNew from "./pages/WorkoutNew"
import WorkoutSession from "./pages/WorkoutSession"
import Workouts from "./pages/Workouts"

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
        <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
        <Route path="/workouts/new" element={<ProtectedRoute><WorkoutNew /></ProtectedRoute>} />
        <Route path="/workouts/:id" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/ai-generator" element={<ProtectedRoute><AIWorkoutGenerator /></ProtectedRoute>} />
        <Route path="/trainers" element={<ProtectedRoute><TrainerManagement /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/workouts/start/:templateId" element={<ProtectedRoute><StartWorkout /></ProtectedRoute>} />
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