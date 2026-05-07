import { useState } from 'react'
import { X } from 'lucide-react'
import { fuegeAufgabeHinzu } from '../storage'
import type { Aufgabe } from '../types'

const DAUER_OPTIONEN = [15, 30, 45, 60, 90, 120]

interface Props {
  onClose: () => void
  onSaved: (aufgabe: Aufgabe) => void
}

export default function AufgabeModal({ onClose, onSaved }: Props) {
  const [titel, setTitel] = useState('')
  const [projekt, setProjekt] = useState('')
  const [dauer, setDauer] = useState(30)
  const [deadline, setDeadline] = useState('')
  const [fehler, setFehler] = useState('')

  function handleSpeichern() {
    if (!titel.trim()) {
      setFehler('Bitte gib einen Titel ein.')
      return
    }
    const aufgabe = fuegeAufgabeHinzu({
      titel: titel.trim(),
      projekt: projekt.trim() || undefined,
      geschaetzteDauer: dauer,
      deadline: deadline || undefined,
    })
    onSaved(aufgabe)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl px-6 pt-5 pb-8">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Neue Aufgabe</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Titel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel <span className="text-[#4F6BFF]">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={titel}
                onChange={e => { setTitel(e.target.value); setFehler('') }}
                placeholder="Was möchtest du erledigen?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4F6BFF] focus:ring-2 focus:ring-[#4F6BFF]/20 text-gray-900 placeholder-gray-400 transition-all"
              />
              {fehler && <p className="text-red-500 text-xs mt-1">{fehler}</p>}
            </div>

            {/* Projekt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projekt <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={projekt}
                onChange={e => setProjekt(e.target.value)}
                placeholder="z.B. Marketing, Entwicklung…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4F6BFF] focus:ring-2 focus:ring-[#4F6BFF]/20 text-gray-900 placeholder-gray-400 transition-all"
              />
            </div>

            {/* Dauer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschätzte Dauer
              </label>
              <div className="flex flex-wrap gap-2">
                {DAUER_OPTIONEN.map(min => (
                  <button
                    key={min}
                    onClick={() => setDauer(min)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${dauer === min
                        ? 'bg-[#4F6BFF] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {min < 60 ? `${min} Min` : `${min / 60} Std`}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4F6BFF] focus:ring-2 focus:ring-[#4F6BFF]/20 text-gray-900 transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSpeichern}
              className="flex-1 py-3 rounded-xl bg-[#4F6BFF] text-white font-medium hover:bg-[#3d57ff] active:scale-95 transition-all shadow-sm shadow-[#4F6BFF]/30"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
