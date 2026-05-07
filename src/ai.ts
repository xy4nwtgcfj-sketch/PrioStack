import type { Aufgabe, Zeiteintrag } from './types'

export async function getTagesplanung(
  aufgaben: Aufgabe[],
  stunden: number,
  apiKey: string
): Promise<string> {
  const offene = aufgaben.filter(a => !a.erledigt)
  const jetzt = new Date()
  const datumText = jetzt.toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const uhrzeitText = jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  const aufgabenText = offene.map(a => {
    const parts = [`- ${a.titel}`]
    if (a.projekt) parts.push(`(Projekt: ${a.projekt})`)
    parts.push(`[${a.geschaetzteDauer} Min]`)
    if (a.deadline) {
      const dl = new Date(a.deadline).toLocaleDateString('de-DE')
      parts.push(`Deadline: ${dl}`)
    }
    return parts.join(' ')
  }).join('\n')

  const systemPrompt = `Du bist ein produktiver Tagesplaner-Assistent für FocusStack.
Du hilfst dabei, den Arbeitstag optimal zu strukturieren.
Antworte immer auf Deutsch, strukturiert und motivierend.
Sei präzise und priorisiere nach Dringlichkeit (Deadline) und Wichtigkeit.`

  const userPrompt = `Heute ist ${datumText}, ${uhrzeitText} Uhr.
Ich habe heute noch ${stunden} Stunden verfügbar.

Meine offenen Aufgaben:
${aufgabenText || 'Keine offenen Aufgaben vorhanden.'}

Bitte erstelle meinen Tagesplan:
1. Nenne die Top 3–5 Aufgaben für heute mit je einer kurzen Begründung (1–2 Sätze)
2. Zeige die Gesamtdauer der empfohlenen Aufgaben
3. Schreibe einen kurzen motivierenden Satz am Ende

Format: Klare Struktur mit Nummern, kein unnötiger Fülltext.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API Fehler ${response.status}`)
  }

  const data = await response.json() as { content: { type: string; text: string }[] }
  return data.content.find(c => c.type === 'text')?.text ?? ''
}

// ── Wochenbericht ────────────────────────────────────────────────────────────

export async function getWochenbericht(
  eintraege: Zeiteintrag[],
  aufgaben: Aufgabe[],
  wocheLabel: string,
  apiKey: string,
): Promise<string> {
  // Per-day summary
  const tageMap = new Map<string, { label: string; min: number }>()
  for (const e of eintraege) {
    const d = new Date(e.startzeit)
    const key = d.toDateString()
    const label = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })
    const prev = tageMap.get(key) ?? { label, min: 0 }
    tageMap.set(key, { label, min: prev.min + e.dauer })
  }
  const tageText = [...tageMap.values()]
    .map(t => `- ${t.label}: ${t.min} Min (${(t.min / 60).toFixed(1)}h)`)
    .join('\n') || '- Keine Zeiteinträge'

  // Per-task: actual vs. estimated
  const aufgabeMap = new Map<string, { titel: string; geschaetzt: number; erfasst: number }>()
  for (const e of eintraege) {
    const a = aufgaben.find(a => a.id === e.aufgabeId)
    const prev = aufgabeMap.get(e.aufgabeId) ?? {
      titel: e.aufgabeTitel,
      geschaetzt: a?.geschaetzteDauer ?? 0,
      erfasst: 0,
    }
    aufgabeMap.set(e.aufgabeId, { ...prev, erfasst: prev.erfasst + e.dauer })
  }
  const aufgabenText = [...aufgabeMap.values()]
    .sort((a, b) => b.erfasst - a.erfasst)
    .map(a => {
      const diff = a.geschaetzt > 0
        ? ` (Schätzung: ${a.geschaetzt} Min, Differenz: ${a.erfasst - a.geschaetzt > 0 ? '+' : ''}${a.erfasst - a.geschaetzt} Min)`
        : ''
      return `- "${a.titel}": ${a.erfasst} Min erfasst${diff}`
    })
    .join('\n') || '- Keine Aufgaben'

  const gesamtMin = eintraege.reduce((s, e) => s + e.dauer, 0)

  const userPrompt = `Analysiere meine Arbeitswoche (${wocheLabel}) und erstelle einen strukturierten Wochenbericht auf Deutsch.

Gesamtzeit: ${gesamtMin} Min (${(gesamtMin / 60).toFixed(1)}h)

Zeitverteilung nach Tag:
${tageText}

Bearbeitete Aufgaben (erfasst vs. Schätzung):
${aufgabenText}

Schreibe genau 5 nummerierte Abschnitte, jeder mit einem kurzen Titel und 2–3 prägnanten Sätzen Inhalt:

1. Gesamtstunden der Woche
2. Produktivster Tag
3. Zeitschätzung im Vergleich
4. Tipp für nächste Woche
5. Motivation

Format: "N. Titel\\nInhalt" – ein Leerzeile zwischen den Abschnitten. Keine Markdown-Formatierung außer dem Nummernschema. Antworte auf Deutsch.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: 'Du bist ein präziser Produktivitäts-Analyst. Antworte immer auf Deutsch, strukturiert und motivierend. Halte dich exakt an das vorgegebene Format.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API Fehler ${response.status}`)
  }

  const result = await response.json() as { content: { type: string; text: string }[] }
  return result.content.find(c => c.type === 'text')?.text ?? ''
}
