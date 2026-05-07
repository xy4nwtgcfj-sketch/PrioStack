import { useState } from 'react'
import { ChevronRight, Zap, Clock, CheckCircle } from 'lucide-react'
import { speichereVerfuegbareStunden, fuegeAufgabeHinzu, setzeOnboardingDone } from '../storage'

interface Props {
  onDone: () => void
}

const STUNDEN_OPTIONEN = [4, 6, 8]

export default function Onboarding({ onDone }: Props) {
  const [screen, setScreen] = useState<1 | 2 | 3>(1)
  const [stunden, setStunden] = useState<number | null>(null)
  const [eigeneStunden, setEigeneStunden] = useState('')
  const [zeigeEigeneEingabe, setZeigeEigeneEingabe] = useState(false)
  const [aufgabeTitel, setAufgabeTitel] = useState('')
  const [fehler, setFehler] = useState('')

  function weiterZuScreen2() {
    setScreen(2)
  }

  function weiterZuScreen3() {
    const h = zeigeEigeneEingabe ? parseInt(eigeneStunden) : stunden
    if (!h || h < 1 || h > 16) {
      setFehler('Bitte wähle eine gültige Stundenanzahl.')
      return
    }
    speichereVerfuegbareStunden(h)
    setFehler('')
    setScreen(3)
  }

  function abschliessen() {
    if (!aufgabeTitel.trim()) {
      setFehler('Bitte gib eine Aufgabe ein.')
      return
    }
    fuegeAufgabeHinzu({
      titel: aufgabeTitel.trim(),
      geschaetzteDauer: 30,
    })
    setzeOnboardingDone()
    onDone()
  }

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-[#4F6BFF] to-[#7B5CFF] flex flex-col">
      {/* Fortschritts-Punkte */}
      <div className="flex justify-center gap-2 pt-14 pb-2">
        {([1, 2, 3] as const).map(n => (
          <span
            key={n}
            className={`rounded-full transition-all duration-300 ${
              n === screen
                ? 'w-6 h-2 bg-white'
                : n < screen
                  ? 'w-2 h-2 bg-white/60'
                  : 'w-2 h-2 bg-white/25'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col px-5 py-6 overflow-y-auto">
        <div className="flex-1 flex flex-col">

          {/* ── Screen 1: Willkommen ── */}
          {screen === 1 && (
            <div className="flex flex-col items-center text-center flex-1 justify-center gap-5 animate-fade-in">
              <div className="w-24 h-24 rounded-[28px] bg-white/15 flex items-center justify-center shadow-xl">
                <Zap size={48} className="text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white leading-tight">
                  Willkommen bei<br />FocusStack
                </h1>
                <p className="text-white/70 mt-3 text-base leading-relaxed max-w-[280px] mx-auto">
                  Dein smarter Begleiter für fokussiertes Arbeiten – plane deinen Tag, tracke Zeit und lass KI für dich priorisieren.
                </p>
              </div>
            </div>
          )}

          {/* ── Screen 2: Arbeitsstunden ── */}
          {screen === 2 && (
            <div className="flex flex-col flex-1 animate-fade-in">
              <div className="flex items-center justify-center mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Clock size={34} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center leading-tight mb-2">
                Wie viele Stunden<br />arbeitest du heute?
              </h2>
              <p className="text-white/60 text-sm text-center mb-8">
                Damit plant die KI deinen Tag realistisch.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {STUNDEN_OPTIONEN.map(h => (
                  <button
                    key={h}
                    onClick={() => {
                      setStunden(h)
                      setZeigeEigeneEingabe(false)
                      setFehler('')
                    }}
                    className={`py-5 rounded-2xl flex flex-col items-center gap-1 font-bold transition-all active:scale-95
                      ${stunden === h && !zeigeEigeneEingabe
                        ? 'bg-white text-[#4F6BFF] shadow-lg shadow-black/20'
                        : 'bg-white/15 text-white hover:bg-white/25'
                      }`}
                  >
                    <span className="text-2xl">{h}h</span>
                    <span className="text-xs font-medium opacity-70">
                      {h === 4 ? 'Halbtag' : h === 6 ? 'Kurztag' : 'Volltag'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Eigene Eingabe */}
              <button
                onClick={() => {
                  setZeigeEigeneEingabe(v => !v)
                  setStunden(null)
                  setFehler('')
                }}
                className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all mb-3
                  ${zeigeEigeneEingabe
                    ? 'bg-white text-[#4F6BFF]'
                    : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
              >
                Eigene Eingabe
              </button>

              {zeigeEigeneEingabe && (
                <div className="mb-3 animate-fade-in">
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={eigeneStunden}
                    onChange={e => { setEigeneStunden(e.target.value); setFehler('') }}
                    placeholder="z.B. 7"
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/15 text-white placeholder-white/40 text-center text-xl font-bold focus:outline-none focus:bg-white/25 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}

              {fehler && <p className="text-red-200 text-sm text-center mb-2">{fehler}</p>}
            </div>
          )}

          {/* ── Screen 3: Erste Aufgabe ── */}
          {screen === 3 && (
            <div className="flex flex-col flex-1 animate-fade-in">
              <div className="flex items-center justify-center mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                  <CheckCircle size={34} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center leading-tight mb-2">
                Bereit loszulegen!
              </h2>
              <p className="text-white/60 text-sm text-center mb-8">
                Was ist deine wichtigste Aufgabe heute?
              </p>

              <input
                type="text"
                value={aufgabeTitel}
                onChange={e => { setAufgabeTitel(e.target.value); setFehler('') }}
                onKeyDown={e => e.key === 'Enter' && abschliessen()}
                placeholder="z.B. Präsentation fertigstellen…"
                autoFocus
                className="w-full px-5 py-4 rounded-2xl bg-white/15 text-white placeholder-white/40 text-base font-medium focus:outline-none focus:bg-white/25 transition-all mb-3"
              />

              {fehler && <p className="text-red-200 text-sm text-center mb-2">{fehler}</p>}
            </div>
          )}
        </div>

        {/* ── Buttons ── */}
        <div className="pt-4 space-y-3">
          {screen === 1 && (
            <button
              onClick={weiterZuScreen2}
              className="w-full py-4 bg-white text-[#4F6BFF] rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-black/20 hover:bg-gray-50 active:scale-95 transition-all"
            >
              Los geht's
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          )}

          {screen === 2 && (
            <button
              onClick={weiterZuScreen3}
              disabled={!stunden && !eigeneStunden}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95
                ${(stunden || eigeneStunden)
                  ? 'bg-white text-[#4F6BFF] shadow-lg shadow-black/20 hover:bg-gray-50'
                  : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
            >
              Weiter
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          )}

          {screen === 3 && (
            <button
              onClick={abschliessen}
              disabled={!aufgabeTitel.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95
                ${aufgabeTitel.trim()
                  ? 'bg-white text-[#4F6BFF] shadow-lg shadow-black/20 hover:bg-gray-50'
                  : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
            >
              Erste Aufgabe speichern &amp; starten
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          )}

          {/* Überspringen (nur auf Screen 3) */}
          {screen === 3 && (
            <button
              onClick={() => { setzeOnboardingDone(); onDone() }}
              className="w-full py-2 text-white/50 text-sm font-medium hover:text-white/70 transition-colors"
            >
              Überspringen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
