import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Onboarding from './components/Onboarding'
import Heute from './pages/Heute'
import Aufgaben from './pages/Aufgaben'
import Zeiterfassung from './pages/Zeiterfassung'
import Woche from './pages/Woche'
import { istOnboardingDone } from './storage'

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(() => istOnboardingDone())

  if (!onboardingDone) {
    return <Onboarding onDone={() => setOnboardingDone(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Heute />} />
        <Route path="/aufgaben" element={<Aufgaben />} />
        <Route path="/zeiterfassung" element={<Zeiterfassung />} />
        <Route path="/woche" element={<Woche />} />
      </Routes>
      <Navigation />
    </BrowserRouter>
  )
}
