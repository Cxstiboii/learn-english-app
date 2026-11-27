import { Navigate, Route, Routes } from 'react-router-dom'
import Auth from './pages/Auth'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { OnboardingGuard } from './components/auth/OnboardingGuard'
import AppLayout from './components/layout/AppLayout'
import Chat from './pages/Chat'
import Exercises from './pages/Exercises'
import Home from './pages/Home'
import Progress from './pages/Progress'
import Speaking from './pages/Speaking'
import StudyPath from './pages/StudyPath'
import Vocabulary from './pages/Vocabulary'
import WritingMock from './pages/WritingMock'
import Interview from './pages/Interview'
import Onboarding from './pages/Onboarding'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<OnboardingGuard />}>
          <Route path="onboarding" element={<Onboarding />} />
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
            <Route path="vocabulary" element={<Vocabulary />} />
            <Route path="exercises" element={<Exercises />} />
            <Route path="speaking" element={<Speaking />} />
            <Route path="progress" element={<Progress />} />
            <Route path="settings" element={<Settings />} />
            <Route path="path" element={<StudyPath />} />
            <Route path="*" element={<Navigate to="/path" replace />} />
          </Route>
          <Route path="mock/writing" element={<WritingMock />} />
          <Route path="interview" element={<Interview />} />
        </Route>
      </Route>
    </Routes>
  )
}
