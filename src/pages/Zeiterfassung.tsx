import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Square, Clock } from 'lucide-react'
import { ladeAufgaben, heutigeZeiteintraege, speichereZeiteintrag } from '../storage'
import Toast from '../components/Toast'
import type { Aufgabe, Zeiteintrag } from '../types'

function formatTime(sekunden: number): string {
  const h = Math.floor(sekunden / 3600)
  const m = Math.floor((sekunden % 3600) / 60)
  const s = sekunden % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function formatDauer(min: number): string {
  if (min < 60) return `${min} Min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export default function Zeiterfassung() {
  const [aufgaben] = useState<Aufgabe[]>(() => ladeAufgaben().filter(a => !a.erledigt))
  const [ausgewaehlteId, setAusgewaehlteId] = useState<string>('')
  const [laeuft, setLaeuft] = useState(false)
  const [sekunden, setSekunden] = useState(0)
  const [eintraege, setEintraege] = useState<Zeiteintrag[]>(() => heutigeZeiteintraege())
  const [toast, setToast] = useState<string | null>(null)
  const startRef = useRef<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const starten = useCallback(() => {
    if (!ausgewaehlteId) return
    startRef.current = new Date()
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

    const end = new Date()
    const dauerMin = Math.max(1, Math.round((end.getTime() - startRef.current.getTime()) / 60000))
    const aufgabe = aufgaben.find(a => a.id === ausgewaehlteId)!

    const eintrag = speichereZeiteintrag({
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
    void eintrag
  }, [ausgewaehlteId, aufgaben])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const gesamtMinHeute = eintraege.reduce((s, e) => s + e.dauer, 0)

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
          {!laeuft && (
            <div className="mb-6">
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
                      {a.titel} {a.projekt ? `(${a.projekt})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {laeuft && (
            <div className="text-center mb-2">
              <p className="text-sm font-medium text-[#4F6BFF] truncate">
                {aufgaben.find(a => a.id === ausgewaehlteId)?.titel}
              </p>
            </div>
          )}

          {/* Zeit-Anzeige */}
          <div className="text-center mb-8">
            <span className={`font-mono font-bold tracking-tight transition-all
              ${laeuft ? 'text-6xl text-gray-900' : 'text-5xl text-gray-300'}`}>
              {formatTime(sekunden)}
            </span>
            {laeuft && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-gray-500">läuft</span>
              </div>
            )}
          </div>

          {/* Start/Stop Button */}
          <div className="flex justify-center">
            {!laeuft ? (
              <button
                onClick={starten}
                disabled={!ausgewaehlteId}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all
                  ${ausgewaehlteId
                    ? 'bg-[#4F6BFF] hover:bg-[#3d57ff] active:scale-95 shadow-[#4F6BFF]/40'
                    : 'bg-gray-200 cursor-not-allowed'
                  }`}
              >
                <Play size={32} fill="white" className="text-white ml-1" />
              </button>
            ) : (
              <button
                onClick={stoppen}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center shadow-lg shadow-red-500/40 transition-all"
              >
                <Square size={28} fill="white" className="text-white" />
              </button>
            )}
          </div>
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
                    <p className="font-medium text-gray-900 text-sm truncate">{e.aufgabeTitel}</p>
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
