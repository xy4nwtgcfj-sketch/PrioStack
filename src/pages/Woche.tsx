import { useState } from 'react'
import { BarChart2, Sparkles, Copy, Check, TrendingUp, Flame, Clock, Lightbulb, Heart } from 'lucide-react'
import { ladeZeiteintraege, ladeAufgaben, ladeApiKey, ladeWochenbericht, speichereWochenbericht } from '../storage'
import { getWochenbericht } from '../ai'
import type { Zeiteintrag, Aufgabe, Wochenbericht } from '../types'

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

// ── Bericht parsen & rendern ─────────────────────────────────────────────────

interface Sektion { nr: number; titel: string; inhalt: string }

function parseSektionen(text: string): Sektion[] {
  const bloecke = text.trim().split(/\n\n+/)
  return bloecke.reduce<Sektion[]>((acc, block) => {
    const m = block.match(/^([1-5])[.)]\s+(.+?)(?:\n([\s\S]*))?$/)
    if (m) acc.push({ nr: parseInt(m[1]), titel: m[2].trim(), inhalt: (m[3] ?? '').trim() })
    return acc
  }, [])
}

const SEKTION_CONFIG = [
  { Icon: TrendingUp, bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600'   },
  { Icon: Flame,      bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-500' },
  { Icon: Clock,      bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' },
  { Icon: Lightbulb,  bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-600'  },
  { Icon: Heart,      bg: 'bg-rose-50',   border: 'border-rose-100',   text: 'text-rose-500'   },
]

function BerichtKarte({
  bericht,
  onKopieren,
  kopiert,
}: {
  bericht: Wochenbericht
  onKopieren: () => void
  kopiert: boolean
}) {
  const sektionen = parseSektionen(bericht.antwort)
  const zeigeRoh  = sektionen.length < 3

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Karten-Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-[#4F6BFF]/5 to-[#7B5CFF]/5">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-[#4F6BFF]" />
          <span className="text-sm font-semibold text-gray-800">KI-Wochenbericht</span>
          <span className="text-xs text-gray-400">{bericht.wocheLabel}</span>
        </div>
        <button
          onClick={onKopieren}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          {kopiert ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          <span>{kopiert ? 'Kopiert!' : 'Teilen'}</span>
        </button>
      </div>

      {/* Sektionen */}
      <div className="p-4 space-y-3">
        {zeigeRoh ? (
          // Fallback: Rohtext wenn Parsing fehlschlägt
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{bericht.antwort}</p>
        ) : (
          sektionen.map((s) => {
            const cfg = SEKTION_CONFIG[(s.nr - 1) % SEKTION_CONFIG.length]
            const { Icon } = cfg
            return (
              <div key={s.nr} className={`rounded-xl p-3.5 border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    <Icon size={14} className={cfg.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${cfg.text}`}>
                      {s.nr}. {s.titel}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {s.inhalt || s.titel}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-gray-300 text-right">
          Erstellt {new Date(bericht.erstelltAm).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
        </p>
      </div>
    </div>
  )
}

// ── Komponente ──────────────────────────────────────────────────────────────

export default function Woche() {
  const heute = new Date()
  const [wochentage] = useState(getWochentage)
  const [alleEintraege] = useState<Zeiteintrag[]>(ladeZeiteintraege)
  const [alleAufgaben] = useState<Aufgabe[]>(ladeAufgaben)
  const [tagDaten] = useState<TagDaten[]>(() =>
    aggregiere(wochentage, alleEintraege, alleAufgaben)
  )

  const [bericht, setBericht]   = useState<Wochenbericht | null>(ladeWochenbericht)
  const [laden, setLaden]       = useState(false)
  const [fehler, setFehler]     = useState<string | null>(null)
  const [kopiert, setKopiert]   = useState(false)

  const maxMin        = Math.max(...tagDaten.map(d => d.gesamtMin), 1)
  const gesamtMin     = tagDaten.reduce((s, d) => s + d.gesamtMin, 0)
  const gesamtErledigt = tagDaten.reduce((s, d) => s + d.erledigte, 0)

  const wocheLabel = `${wochentage[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${wochentage[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`

  async function erstelleBericht() {
    const apiKey = ladeApiKey()
    if (!apiKey) {
      setFehler('Kein API-Key gespeichert. Bitte auf der Heute-Seite eintragen.')
      return
    }
    // Nur Einträge dieser Woche
    const wochenEintraege = tagDaten.flatMap(d => d.eintraege)
    if (wochenEintraege.length === 0) {
      setFehler('Keine Zeiteinträge diese Woche – bitte zuerst Zeit erfassen.')
      return
    }
    setFehler(null)
    setLaden(true)
    try {
      const antwort = await getWochenbericht(wochenEintraege, alleAufgaben, wocheLabel, apiKey)
      const neu: Wochenbericht = { erstelltAm: new Date().toISOString(), wocheLabel, antwort }
      speichereWochenbericht(neu)
      setBericht(neu)
    } catch (e) {
      setFehler((e as Error).message ?? 'Unbekannter Fehler')
    } finally {
      setLaden(false)
    }
  }

  function kopieren() {
    if (!bericht) return
    const text = `FocusStack Wochenbericht (${bericht.wocheLabel})\n\n${bericht.antwort}`
    navigator.clipboard.writeText(text).catch(() => {})
    setKopiert(true)
    setTimeout(() => setKopiert(false), 2000)
  }

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

        {/* ── KI-Wochenbericht ── */}
        <div className="space-y-3">
          <button
            onClick={erstelleBericht}
            disabled={laden}
            className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-sm
              ${laden
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#4F6BFF] to-[#7B5CFF] text-white shadow-[#4F6BFF]/25 hover:shadow-[#4F6BFF]/40'
              }`}
          >
            {laden ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Claude analysiert…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {bericht ? 'Wochenbericht aktualisieren' : 'Wochenbericht erstellen'}
              </>
            )}
          </button>

          {fehler && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-red-600 text-sm">{fehler}</p>
            </div>
          )}

          {bericht && (
            <BerichtKarte bericht={bericht} onKopieren={kopieren} kopiert={kopiert} />
          )}
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
