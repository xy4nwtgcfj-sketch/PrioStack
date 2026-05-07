import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Heute from './pages/Heute'
import Aufgaben from './pages/Aufgaben'
import Zeiterfassung from './pages/Zeiterfassung'
import Woche from './pages/Woche'

export default function App() {
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
