import { useState, useCallback } from 'react'
import { Sparkles, Key, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  ladeAufgaben, ladeApiKey, speichereApiKey,
  ladeVerfuegbareStunden, speichereVerfuegbareStunden,
  ladeKIPlan, speichereKIPlan, ladeAbweichungen,
} from '../storage'
import { getTagesplanung } from '../ai'
import { IlluMorgen } from '../components/Illustrations'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Gute Nacht!'
  if (h < 12) return 'Guten Morgen!'
  if (h < 17) return 'Guten Tag!'
  if (h < 22) return 'Guten Abend!'
  return 'Gute Nacht!'
}

export default function Heute() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState(() => ladeApiKey())
  const [apiKeyVisible, setApiKeyVisible] = useState(!ladeApiKey())
  const [stunden, setStunden] = useState(() => ladeVerfuegbareStunden())
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [plan, setPlan] = useState<{ antwort: string; erstelltAm: string } | null>(() => ladeKIPlan())

  const speichereKey = useCallback(() => {
    speichereApiKey(apiKey.trim())
    if (apiKey.trim()) setApiKeyVisible(false)
  }, [apiKey])

  async function planenKlick() {
    const key = apiKey.trim() || ladeApiKey()
    if (!key) {
      setFehler('Bitte gib deinen Anthropic API-Key ein.')
      setApiKeyVisible(true)
      return
    }
    const aufgaben = ladeAufgaben()
    if (aufgaben.filter(a => !a.erledigt).length === 0) {
      setFehler('Keine offenen Aufgaben vorhanden. Erstelle zuerst Aufgaben.')
      return
    }
    setFehler(null)
    setLaden(true)
    try {
      speichereVerfuegbareStunden(stunden)
      const antwort = await getTagesplanung(aufgaben, stunden, key, ladeAbweichungen())
      const neuerPlan = { antwort, erstelltAm: new Date().toISOString() }
      speichereKIPlan(neuerPlan)
      setPlan(neuerPlan)
    } catch (e) {
      setFehler((e as Error).message || 'Unbekannter Fehler beim API-Aufruf.')
    } finally {
      setLaden(false)
    }
  }

  const wochentag = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  const offeneAufgaben = ladeAufgaben().filter(a => !a.erledigt).length

  return (
    <div className="flex flex-col min-h-screen pb-nav">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-6 bg-gradient-to-br from-[#4F6BFF] via-[#5B75FF] to-[#7B5CFF] overflow-hidden">
        <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-6 right-20 w-16 h-16 rounded-full bg-white/8 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/8 pointer-events-none" />
        <p className="relative text-blue-200 text-sm font-medium capitalize">{wochentag}</p>
        <h1 className="relative text-2xl font-bold text-white mt-0.5">{getGreeting()}</h1>
        <div className="relative flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-200" />
            {offeneAufgaben} offene Aufgaben
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* API Key + Einstellungen */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setApiKeyVisible(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <div className="flex items-center gap-2.5">
              <Key size={18} className="text-[#4F6BFF]" />
              <span className="font-semibold text-gray-800 text-sm">Einstellungen</span>
              {ladeApiKey() && <span className="text-xs text-green-500 font-medium">● verbunden</span>}
            </div>
            {apiKeyVisible ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {apiKeyVisible && (
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Anthropic API-Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onBlur={speichereKey}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4F6BFF] focus:ring-2 focus:ring-[#4F6BFF]/20 text-sm font-mono transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Hol dir deinen Key unter{' '}
                  <span className="text-[#4F6BFF]">console.anthropic.com</span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Verfügbare Stunden heute
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={stunden}
                    onChange={e => setStunden(Number(e.target.value))}
                    className="flex-1 accent-[#4F6BFF]"
                  />
                  <span className="text-sm font-bold text-[#4F6BFF] w-10 text-right">{stunden}h</span>
                </div>
              </div>
              <button
                onClick={speichereKey}
                className="w-full py-2.5 bg-[#4F6BFF] text-white rounded-xl text-sm font-medium hover:bg-[#3d57ff] transition-colors"
              >
                Speichern
              </button>
            </div>
          )}
        </div>

        {/* Plan erstellen */}
        <button
          onClick={planenKlick}
          disabled={laden}
          className={`w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-95
            ${laden
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#4F6BFF] to-[#7B5CFF] shadow-[#4F6BFF]/30 hover:shadow-[#4F6BFF]/50'
            }`}
        >
          {laden ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Claude denkt nach…
            </>
          ) : (
            <>
              <Sparkles size={20} />
              KI-Tagesplan erstellen
            </>
          )}
        </button>

        {fehler && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-red-600 text-sm">{fehler}</p>
          </div>
        )}

        {/* Plan-Anzeige */}
        {plan && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <Sparkles size={16} className="text-[#4F6BFF]" />
              <span className="font-semibold text-gray-800 text-sm">Dein Tagesplan</span>
              <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                <Clock size={11} />
                {new Date(plan.erstelltAm).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="px-4 py-4">
              <PlanAnzeige text={plan.antwort} onTimerStarten={() => navigate('/zeiterfassung')} />
            </div>
          </div>
        )}

        {!plan && !laden && (
          <div className="text-center py-6">
            <IlluMorgen className="w-56 h-auto mx-auto mb-4 animate-float-slow" />
            <h3 className="font-semibold text-gray-700 mb-1">Bereit für deinen Tag?</h3>
            <p className="text-sm text-gray-400 max-w-[260px] mx-auto">
              Erstelle deine Aufgaben und lass Claude deinen optimalen Tagesplan berechnen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function PlanAnzeige({ text, onTimerStarten }: { text: string; onTimerStarten: () => void }) {
  const zeilen = text.split('\n').filter(z => z.trim())

  return (
    <div className="space-y-1">
      {zeilen.map((zeile, i) => {
        const istNummer = /^\d+\./.test(zeile.trim())
        const istGesamt = zeile.toLowerCase().includes('gesamtdauer') || zeile.toLowerCase().includes('gesamt:')
        const istMotivation = i === zeilen.length - 1 && !istNummer && !istGesamt

        if (istMotivation) {
          return (
            <div key={i} className="mt-4 p-3 bg-[#4F6BFF]/5 rounded-xl border border-[#4F6BFF]/20">
              <p className="text-sm text-[#4F6BFF] font-medium italic">{zeile.trim()}</p>
            </div>
          )
        }

        if (istGesamt) {
          return (
            <div key={i} className="flex items-center gap-2 py-2 border-t border-gray-100 mt-3">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">{zeile.trim()}</span>
            </div>
          )
        }

        if (istNummer) {
          return (
            <div key={i} className="group">
              <p className="text-sm text-gray-800 leading-relaxed py-1">{zeile.trim()}</p>
              {zeilen[i + 1] && !/^\d+\./.test(zeilen[i + 1].trim()) && !zeilen[i + 1].toLowerCase().includes('gesamtdauer') && (
                null
              )}
            </div>
          )
        }

        return (
          <p key={i} className="text-sm text-gray-600 leading-relaxed pl-4 py-0.5">{zeile.trim()}</p>
        )
      })}

      <button
        onClick={onTimerStarten}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#4F6BFF]/10 hover:bg-[#4F6BFF]/20 text-[#4F6BFF] rounded-xl font-medium text-sm transition-colors active:scale-95"
      >
        <Zap size={15} />
        Timer für erste Aufgabe starten
      </button>
    </div>
  )
}
