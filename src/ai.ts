import type { Aufgabe } from './types'

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
