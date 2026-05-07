import { useState } from 'react'
import { Plus, Trash2, Clock, Tag } from 'lucide-react'
import { ladeAufgaben, aktualisiereAufgabe, loescheAufgabe, ladeZeiteintraege } from '../storage'
import AufgabeModal from '../components/AufgabeModal'
import { IlluAufgaben } from '../components/Illustrations'
import type { Aufgabe } from '../types'

function formatDauer(min: number): string {
  if (min < 60) return `${min} Min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export default function Aufgaben() {
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>(() => ladeAufgaben())
  const [modalOffen, setModalOffen] = useState(false)

  // Erfasste Gesamtzeit pro Aufgabe für Abweichungs-Badge
  const [zeitProAufgabe] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>()
    for (const e of ladeZeiteintraege()) m.set(e.aufgabeId, (m.get(e.aufgabeId) ?? 0) + e.dauer)
    return m
  })

  function refresh() {
    setAufgaben(ladeAufgaben())
  }

  function toggleErledigt(id: string, erledigt: boolean) {
    aktualisiereAufgabe(id, { erledigt: !erledigt })
    refresh()
  }

  function loeschen(id: string) {
    loescheAufgabe(id)
    refresh()
  }

  const offen = aufgaben.filter(a => !a.erledigt)
  const erledigt = aufgaben.filter(a => a.erledigt)

  return (
    <div className="flex flex-col min-h-screen pb-nav">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#4F6BFF]/5 pointer-events-none" />
        <h1 className="relative text-2xl font-bold text-gray-900">Aufgaben</h1>
        <p className="relative text-sm text-gray-400 mt-0.5">
          {offen.length} offen · {erledigt.length} erledigt
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {aufgaben.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IlluAufgaben className="w-52 h-auto mb-5 animate-float" />
            <h3 className="font-semibold text-gray-700 mb-1">Keine Aufgaben</h3>
            <p className="text-sm text-gray-400">Erstelle deine erste Aufgabe!</p>
          </div>
        ) : (
          <>
            {offen.length > 0 && (
              <div className="space-y-2">
                {offen.map(a => (
                  <AufgabeKarte
                    key={a.id}
                    aufgabe={a}
                    onToggle={() => toggleErledigt(a.id, a.erledigt)}
                    onLoeschen={() => loeschen(a.id)}
                  />
                ))}
              </div>
            )}

            {erledigt.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                  Erledigt
                </p>
                <div className="space-y-2 opacity-60">
                  {erledigt.map(a => {
                    const erfasst = zeitProAufgabe.get(a.id) ?? 0
                    const abweichungMin = erfasst > 0 && a.geschaetzteDauer > 0
                      ? erfasst - a.geschaetzteDauer
                      : undefined
                    return (
                      <AufgabeKarte
                        key={a.id}
                        aufgabe={a}
                        onToggle={() => toggleErledigt(a.id, a.erledigt)}
                        onLoeschen={() => loeschen(a.id)}
                        abweichungMin={abweichungMin}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setModalOffen(true)}
        className="fixed bottom-24 right-4 max-[480px]:right-4 w-14 h-14 bg-[#4F6BFF] text-white rounded-full shadow-lg shadow-[#4F6BFF]/40 flex items-center justify-center hover:bg-[#3d57ff] active:scale-95 transition-all z-30"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {modalOffen && (
        <AufgabeModal
          onClose={() => setModalOffen(false)}
          onSaved={() => { refresh(); setModalOffen(false) }}
        />
      )}
    </div>
  )
}

function AufgabeKarte({
  aufgabe,
  onToggle,
  onLoeschen,
  abweichungMin,
}: {
  aufgabe: Aufgabe
  onToggle: () => void
  onLoeschen: () => void
  abweichungMin?: number
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all
      ${aufgabe.erledigt ? 'border-gray-100' : 'border-gray-100 hover:border-[#4F6BFF]/30'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
            ${aufgabe.erledigt
              ? 'bg-[#4F6BFF] border-[#4F6BFF]'
              : 'border-gray-300 hover:border-[#4F6BFF]'
            }`}
        >
          {aufgabe.erledigt && (
            <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1,5 4,8 11,1" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-gray-900 leading-snug
              ${aufgabe.erledigt ? 'line-through text-gray-400' : ''}`}>
              {aufgabe.titel}
            </p>
            {!!aufgabe.pomodoros && aufgabe.pomodoros > 0 && (
              <span className="text-sm leading-none shrink-0" title={`${aufgabe.pomodoros} Pomodoro${aufgabe.pomodoros > 1 ? 's' : ''} abgeschlossen`}>
                {'🍅'.repeat(Math.min(aufgabe.pomodoros, 4))}{aufgabe.pomodoros > 4 ? `×${aufgabe.pomodoros}` : ''}
              </span>
            )}
            {abweichungMin !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                abweichungMin > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {abweichungMin > 0 ? '+' : ''}{abweichungMin} Min
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {aufgabe.projekt && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#4F6BFF] bg-[#4F6BFF]/10 px-2 py-0.5 rounded-full">
                <Tag size={10} />
                {aufgabe.projekt}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {formatDauer(aufgabe.geschaetzteDauer)}
            </span>
            {aufgabe.deadline && (
              <span className="text-xs text-orange-500 font-medium">
                bis {new Date(aufgabe.deadline).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onLoeschen}
          className="text-gray-300 hover:text-red-400 transition-colors ml-1 mt-0.5"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
