import { useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { ladeZeiteintraege, ladeAufgaben } from '../storage'
import type { Zeiteintrag, Aufgabe } from '../types'

const KT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// ── Datum-Helfer ────────────────────────────────────────────────────────────

function getWochentage(): Date[] {
  const heute = new Date()
  const dow = heute.getDay() // 0 = So
  const diff = dow === 0 ? -6 : 1 - dow // → Montag
  const mo = new Date(heute)
  mo.setDate(heute.getDate() + diff)
  mo.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mo)
    d.setDate(mo.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

// compact: "25m" / "1h" / "1h30m"
function fmt(min: number): string {
  if (!min) return ''
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${m}m` : `${h}h`
}

// long: "25 Min" / "1h 30min"
function fmtLang(min: number): string {
  if (!min) return '—'
  if (min < 60) return `${min} Min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

// ── Daten-Aggregation ───────────────────────────────────────────────────────

interface TagDaten {
  datum: Date
  eintraege: Zeiteintrag[]
  gesamtMin: number
  erledigte: number // abgeschlossene Aufgaben, die an diesem Tag bearbeitet wurden
}

function aggregiere(
  wochentage: Date[],
  eintraege: Zeiteintrag[],
  aufgaben: Aufgabe[],
): TagDaten[] {
  const erledigtSet = new Set(aufgaben.filter(a => a.erledigt).map(a => a.id))
  return wochentage.map(datum => {
    const tagesEintraege = eintraege.filter(e => isSameDay(new Date(e.startzeit), datum))
    const gesamtMin = tagesEintraege.reduce((s, e) => s + e.dauer, 0)
    const bearbeitetIds = new Set(tagesEintraege.map(e => e.aufgabeId))
    const erledigte = [...bearbeitetIds].filter(id => erledigtSet.has(id)).length
    return { datum, eintraege: tagesEintraege, gesamtMin, erledigte }
  })
}

// ── Komponente ──────────────────────────────────────────────────────────────

export default function Woche() {
  const heute = new Date()
  const [wochentage] = useState(getWochentage)
  const [tagDaten] = useState<TagDaten[]>(() =>
    aggregiere(wochentage, ladeZeiteintraege(), ladeAufgaben())
  )

  const maxMin   = Math.max(...tagDaten.map(d => d.gesamtMin), 1)
  const gesamtMin = tagDaten.reduce((s, d) => s + d.gesamtMin, 0)
  const gesamtErledigt = tagDaten.reduce((s, d) => s + d.erledigte, 0)

  // Woche-Start / -Ende für Subtitle
  const wocheLabel = `${wochentage[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${wochentage[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`

  return (
    <div className="flex flex-col min-h-screen pb-nav">

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Diese Woche</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {wocheLabel} · {fmtLang(gesamtMin)} · {gesamtErledigt} Aufgaben erledigt
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

        {/* ── Wochenleiste ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <div className="flex gap-1">
            {tagDaten.map((td, i) => {
              const istHeute   = isSameDay(td.datum, heute)
              const istZukunft = td.datum > heute && !istHeute
              const hatZeit    = td.gesamtMin > 0

              return (
                <div
                  key={i}
                  className={`flex-1 flex flex-col items-center rounded-xl py-2 px-0.5 transition-colors
                    ${istHeute ? 'bg-[#4F6BFF]/8' : ''}`}
                >
                  {/* Wochentag */}
                  <span className={`text-[10px] font-bold mb-1 ${istHeute ? 'text-[#4F6BFF]' : 'text-gray-400'}`}>
                    {KT[i]}
                  </span>

                  {/* Datum-Kreis */}
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold mb-1.5
                    ${istHeute
                      ? 'bg-[#4F6BFF] text-white'
                      : hatZeit
                        ? 'text-gray-800'
                        : istZukunft
                          ? 'text-gray-300'
                          : 'text-gray-400'
                    }`}>
                    {td.datum.getDate()}
                  </span>

                  {/* Erfasste Zeit */}
                  <span className={`text-[10px] font-semibold leading-none h-3.5
                    ${hatZeit
                      ? istHeute ? 'text-[#4F6BFF]' : 'text-gray-600'
                      : 'text-transparent'
                    }`}>
                    {fmt(td.gesamtMin) || '·'}
                  </span>

                  {/* Erledigte Aufgaben */}
                  <span className={`text-[10px] font-semibold mt-0.5 h-3.5
                    ${td.erledigte > 0 ? 'text-green-500' : 'text-transparent'}`}>
                    {td.erledigte > 0 ? `✓${td.erledigte}` : '·'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Balkendiagramm ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Erfasste Zeit pro Tag
          </h2>

          {/* Wert-Labels über den Balken */}
          <div className="flex gap-1.5 mb-1">
            {tagDaten.map((td, i) => (
              <div key={i} className="flex-1 text-center">
                <span className={`text-[10px] font-medium
                  ${td.gesamtMin > 0
                    ? isSameDay(td.datum, heute) ? 'text-[#4F6BFF]' : 'text-gray-500'
                    : 'text-transparent'
                  }`}>
                  {fmt(td.gesamtMin) || '·'}
                </span>
              </div>
            ))}
          </div>

          {/* Balken */}
          <div className="flex items-end gap-1.5" style={{ height: '72px' }}>
            {tagDaten.map((td, i) => {
              const istHeute = isSameDay(td.datum, heute)
              const pct = (td.gesamtMin / maxMin) * 100

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-md transition-all duration-700 ease-out
                    ${istHeute
                      ? 'bg-[#4F6BFF]'
                      : td.gesamtMin > 0
                        ? 'bg-[#4F6BFF]/30'
                        : 'bg-gray-100'
                    }`}
                  style={{
                    height: td.gesamtMin > 0
                      ? `${Math.max(pct, 5)}%`
                      : '4px',
                  }}
                />
              )
            })}
          </div>

          {/* Tages-Labels */}
          <div className="flex gap-1.5 mt-1.5">
            {tagDaten.map((td, i) => (
              <div key={i} className="flex-1 text-center">
                <span className={`text-[11px] font-medium
                  ${isSameDay(td.datum, heute) ? 'text-[#4F6BFF]' : 'text-gray-400'}`}>
                  {KT[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Y-Achsen-Hinweis */}
          <div className="flex justify-between mt-2 border-t border-gray-50 pt-1.5">
            <span className="text-[10px] text-gray-300">0</span>
            <span className="text-[10px] text-gray-300">Max: {fmtLang(maxMin > 1 ? maxMin : 0)}</span>
          </div>
        </div>

        {/* ── Zeiteinträge nach Tag ── */}
        {tagDaten.every(d => d.eintraege.length === 0) ? (
          <div className="text-center py-14">
            <div className="w-16 h-16 rounded-full bg-[#4F6BFF]/10 flex items-center justify-center mx-auto mb-4">
              <BarChart2 size={28} className="text-[#4F6BFF]" />
            </div>
            <p className="font-semibold text-gray-600">Noch keine Zeiteinträge</p>
            <p className="text-sm text-gray-400 mt-1 max-w-[220px] mx-auto">
              Starte den Timer auf der Zeiterfassungs-Seite.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {[...tagDaten].reverse().filter(d => d.eintraege.length > 0).map(td => {
              const istHeute = isSameDay(td.datum, heute)
              const titelDatum = istHeute
                ? 'Heute'
                : td.datum.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

              return (
                <div key={td.datum.toISOString()}>
                  {/* Tages-Header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className={`text-sm font-semibold ${istHeute ? 'text-[#4F6BFF]' : 'text-gray-700'}`}>
                      {titelDatum}
                    </h3>
                    <div className="flex items-center gap-2">
                      {td.erledigte > 0 && (
                        <span className="text-xs font-medium text-green-500">✓ {td.erledigte}</span>
                      )}
                      <span className="text-sm font-bold text-[#4F6BFF]">{fmtLang(td.gesamtMin)}</span>
                    </div>
                  </div>

                  {/* Einträge */}
                  <div className="space-y-2">
                    {[...td.eintraege].reverse().map(e => (
                      <div
                        key={e.id}
                        className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900 text-sm truncate">{e.aufgabeTitel}</span>
                            {e.istPomodoro && <span className="text-sm leading-none shrink-0">🍅</span>}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(e.startzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            {' – '}
                            {new Date(e.endzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="font-semibold text-[#4F6BFF] text-sm ml-3 shrink-0">
                          {fmtLang(e.dauer)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
