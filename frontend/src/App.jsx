import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import GamePage from './pages/GamePage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
