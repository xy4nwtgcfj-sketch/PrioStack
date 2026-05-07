import { useState, useEffect, useRef, useCallback } from 'react'
import { Square, Clock, Timer, Coffee } from 'lucide-react'
import { ladeAufgaben, heutigeZeiteintraege, speichereZeiteintrag, inkrementierePomodoro } from '../storage'
import Toast from '../components/Toast'
import type { Aufgabe, Zeiteintrag } from '../types'

const POMODORO_SEK = 25 * 60
const PAUSE_SEK = 5 * 60

type TimerModus = 'frei' | 'pomodoro' | 'pause'

function formatTime(sekunden: number): string {
  const h = Math.floor(sekunden / 3600)
  const m = Math.floor((sekunden % 3600) / 60)
  const s = sekunden % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function formatCountdown(sekunden: number): string {
  const m = Math.floor(sekunden / 60)
  const s = sekunden % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDauer(min: number): string {
  if (min < 60) return `${min} Min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function spieleSignal(typ: 'pomodoro' | 'pause') {
  try {
    const ctx = new AudioContext()
    const play = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.2, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    if (typ === 'pomodoro') {
      play(440, 0, 0.3)
      play(550, 0.35, 0.3)
      play(660, 0.7, 0.5)
    } else {
      play(523, 0, 0.5)
    }
  } catch { /* ignore AudioContext errors in restricted environments */ }
}

function PomodoroRing({ sekunden, total, modus }: { sekunden: number; total: number; modus: TimerModus }) {
  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - sekunden / total)
  const color = modus === 'pause' ? '#22C55E' : '#EF4444'
  return (
    <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="90" cy="90" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
      <circle
        cx="90" cy="90" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.9s linear' }}
      />
    </svg>
  )
}

export default function Zeiterfassung() {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>(() => ladeAufgaben().filter(a => !a.erledigt))
  const [ausgewaehlteId, setAusgewaehlteId] = useState<string>('')
  const [timerModus, setTimerModus] = useState<TimerModus | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [sekunden, setSekunden] = useState(0)
  const [eintraege, setEintraege] = useState<Zeiteintrag[]>(() => heutigeZeiteintraege())
  const [toast, setToast] = useState<string | null>(null)
  const [pauseAngebot, setPauseAngebot] = useState(false)

  const startRef = useRef<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable callback refs so interval closures always call the current version
  const onPomodoroEndeRef = useRef<() => void>(() => {})
  const onPauseEndeRef = useRef<() => void>(() => {})

  useEffect(() => {
    onPomodoroEndeRef.current = () => {
      setLaeuft(false)
      const aufgabe = aufgaben.find(a => a.id === ausgewaehlteId)
      if (aufgabe && startRef.current) {
        speichereZeiteintrag({
          aufgabeId: ausgewaehlteId,
          aufgabeTitel: aufgabe.titel,
          startzeit: startRef.current.toISOString(),
          endzeit: new Date().toISOString(),
          dauer: 25,
          istPomodoro: true,
        })
        inkrementierePomodoro(ausgewaehlteId)
        setAufgaben(ladeAufgaben().filter(a => !a.erledigt))
        setEintraege(heutigeZeiteintraege())
      }
      spieleSignal('pomodoro')
      startRef.current = null
      setPauseAngebot(true)
    }
  }, [ausgewaehlteId, aufgaben])

  useEffect(() => {
    onPauseEndeRef.current = () => {
      setLaeuft(false)
      setTimerModus(null)
      setPauseAngebot(false)
      spieleSignal('pause')
      setToast('☕ Pause vorbei – bereit für den nächsten Pomodoro?')
      startRef.current = null
      setSekunden(0)
    }
  }, [])

  // ── Freier Timer (UNVERÄNDERT) ──────────────────────────────────────────────

  const starten = useCallback(() => {
    if (!ausgewaehlteId) return
    startRef.current = new Date()
    setTimerModus('frei')
    setLaeuft(true)
    setSekunden(0)
    intervalRef.current = setInterval(() => {
      setSekunden(s => s + 1)
    }, 1000)
  }, [ausgewaehlteId])

  const stoppen = useCallback(() => {
    if (!startRef.current || !ausgewaehlteId) return
    clearInterval(intervalRef.current!)
    setLaeuft(false)
    setTimerModus(null)

    const end = new Date()
    const dauerMin = Math.max(1, Math.round((end.getTime() - startRef.current.getTime()) / 60000))
    const aufgabe = aufgaben.find(a => a.id === ausgewaehlteId)!

    speichereZeiteintrag({
      aufgabeId: ausgewaehlteId,
      aufgabeTitel: aufgabe.titel,
      startzeit: startRef.current.toISOString(),
      endzeit: end.toISOString(),
      dauer: dauerMin,
    })
    setEintraege(heutigeZeiteintraege())
    setToast(`${dauerMin} Min für "${aufgabe.titel}" erfasst ✓`)
    setSekunden(0)
    startRef.current = null
  }, [ausgewaehlteId, aufgaben])

  // ── Pomodoro ────────────────────────────────────────────────────────────────

  const startenPomodoro = useCallback(() => {
    if (!ausgewaehlteId) return
    startRef.current = new Date()
    setTimerModus('pomodoro')
    setLaeuft(true)
    setSekunden(POMODORO_SEK)
    intervalRef.current = setInterval(() => {
      setSekunden(s => {
        const next = s - 1
        if (next <= 0) {
          clearInterval(intervalRef.current!)
          setTimeout(() => onPomodoroEndeRef.current(), 0)
          return 0
        }
        return next
      })
    }, 1000)
  }, [ausgewaehlteId])

  // Stop pomodoro early → save elapsed time but don't count it as a pomodoro
  const stoppenPomodoro = useCallback(() => {
    if (!startRef.current || !ausgewaehlteId) return
    clearInterval(intervalRef.current!)
    setLaeuft(false)
    setTimerModus(null)

    const end = new Date()
    const dauerMin = Math.max(1, Math.round((end.getTime() - startRef.current.getTime()) / 60000))
    const aufgabe = aufgaben.find(a => a.id === ausgewaehlteId)!

    speichereZeiteintrag({
      aufgabeId: ausgewaehlteId,
      aufgabeTitel: aufgabe.titel,
      startzeit: startRef.current.toISOString(),
      endzeit: end.toISOString(),
      dauer: dauerMin,
    })
    setEintraege(heutigeZeiteintraege())
    setToast(`${dauerMin} Min erfasst (Pomodoro abgebrochen)`)
    setSekunden(0)
    startRef.current = null
  }, [ausgewaehlteId, aufgaben])

  // ── Pause ───────────────────────────────────────────────────────────────────

  const startenPause = useCallback(() => {
    setPauseAngebot(false)
    startRef.current = new Date()
    setTimerModus('pause')
    setLaeuft(true)
    setSekunden(PAUSE_SEK)
    intervalRef.current = setInterval(() => {
      setSekunden(s => {
        const next = s - 1
        if (next <= 0) {
          clearInterval(intervalRef.current!)
          setTimeout(() => onPauseEndeRef.current(), 0)
          return 0
        }
        return next
      })
    }, 1000)
  }, [])

  const ueberspringePause = useCallback(() => {
    setPauseAngebot(false)
    setTimerModus(null)
  }, [])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const gesamtMinHeute = eintraege.reduce((s, e) => s + e.dauer, 0)
  const aktuelleAufgabe = aufgaben.find(a => a.id === ausgewaehlteId)

  return (
    <div className="flex flex-col min-h-screen pb-nav">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Zeiterfassung</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Heute: {formatDauer(gesamtMinHeute)} erfasst
        </p>
      </div>

      <div className="flex-1 flex flex-col px-4 py-6">
        {/* Timer-Karte */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">

          {/* Aufgaben-Auswahl */}
          {!laeuft && !pauseAngebot && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-600 mb-2">Aufgabe auswählen</label>
              {aufgaben.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Keine offenen Aufgaben vorhanden.</p>
              ) : (
                <select
                  value={ausgewaehlteId}
                  onChange={e => setAusgewaehlteId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4F6BFF] focus:ring-2 focus:ring-[#4F6BFF]/20 text-gray-900 bg-white transition-all"
                >
                  <option value="">— Aufgabe wählen —</option>
                  {aufgaben.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.titel}{a.projekt ? ` (${a.projekt})` : ''}{a.pomodoros ? ` 🍅×${a.pomodoros}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Modus-Auswahl: erscheint wenn Aufgabe gewählt aber noch kein Timer läuft */}
          {!laeuft && !pauseAngebot && ausgewaehlteId && (
            <div className="flex gap-3">
              <button
                onClick={starten}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-[#4F6BFF] text-[#4F6BFF] hover:bg-[#4F6BFF] hover:text-white transition-all active:scale-95 group"
              >
                <Timer size={22} />
                <span className="text-sm font-semibold">Freier Timer</span>
              </button>
              <button
                onClick={startenPomodoro}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
              >
                <span className="text-2xl leading-none">🍅</span>
                <span className="text-sm font-semibold">Pomodoro (25 min)</span>
              </button>
            </div>
          )}

          {/* Kein Timer, keine Aufgabe: graue Uhr */}
          {!laeuft && !pauseAngebot && !ausgewaehlteId && aufgaben.length > 0 && (
            <div className="text-center py-4">
              <span className="font-mono font-bold tracking-tight text-5xl text-gray-200">
                {formatTime(0)}
              </span>
            </div>
          )}

          {/* ── Freier Timer Display (UNVERÄNDERT) ── */}
          {laeuft && timerModus === 'frei' && (
            <>
              <div className="text-center mb-2">
                <p className="text-sm font-medium text-[#4F6BFF] truncate">{aktuelleAufgabe?.titel}</p>
              </div>
              <div className="text-center mb-8">
                <span className="font-mono font-bold tracking-tight text-6xl text-gray-900">
                  {formatTime(sekunden)}
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-gray-500">läuft</span>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={stoppen}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center shadow-lg shadow-red-500/40 transition-all"
                >
                  <Square size={28} fill="white" className="text-white" />
                </button>
              </div>
            </>
          )}

          {/* ── Pomodoro / Pause Countdown Display ── */}
          {laeuft && (timerModus === 'pomodoro' || timerModus === 'pause') && (
            <>
              <div className="text-center mb-3">
                <p className={`text-sm font-medium truncate ${timerModus === 'pause' ? 'text-green-600' : 'text-red-500'}`}>
                  {timerModus === 'pause' ? '☕ Pause läuft…' : aktuelleAufgabe?.titel}
                </p>
              </div>
              <div className="relative flex items-center justify-center mb-5">
                <PomodoroRing
                  sekunden={sekunden}
                  total={timerModus === 'pause' ? PAUSE_SEK : POMODORO_SEK}
                  modus={timerModus}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`font-mono font-bold text-4xl ${timerModus === 'pause' ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCountdown(sekunden)}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    {timerModus === 'pause' ? 'Pause' : 'Pomodoro'}
                  </span>
                </div>
              </div>
              {timerModus === 'pomodoro' && (
                <div className="flex justify-center">
                  <button
                    onClick={stoppenPomodoro}
                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center shadow-lg shadow-red-500/40 transition-all"
                  >
                    <Square size={28} fill="white" className="text-white" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Pause-Angebot nach abgeschlossenem Pomodoro ── */}
          {pauseAngebot && (
            <div className="text-center py-2">
              <div className="text-5xl mb-3">🍅</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Pomodoro abgeschlossen!</h3>
              <p className="text-sm text-gray-500 mb-6">Klasse! Gönn dir 5 Minuten Pause.</p>
              <div className="flex gap-3">
                <button
                  onClick={ueberspringePause}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Überspringen
                </button>
                <button
                  onClick={startenPause}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 active:scale-95 transition-all shadow-sm shadow-green-500/30 text-sm flex items-center justify-center gap-2"
                >
                  <Coffee size={15} />
                  Pause starten
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Heutige Einträge */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Heute erfasst
          </h2>
          {eintraege.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Noch keine Zeiteinträge heute</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...eintraege].reverse().map(e => (
                <div key={e.id} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-gray-900 text-sm truncate">{e.aufgabeTitel}</p>
                      {e.istPomodoro && <span className="text-sm leading-none shrink-0">🍅</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(e.startzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(e.endzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="font-semibold text-[#4F6BFF] text-sm ml-3 shrink-0">
                    {formatDauer(e.dauer)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
