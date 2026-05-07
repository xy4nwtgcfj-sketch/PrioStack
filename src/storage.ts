import type { Aufgabe, Zeiteintrag, KIPlan } from './types'

const KEYS = {
  aufgaben: 'focusstack_aufgaben',
  zeiteintraege: 'focusstack_zeiteintraege',
  kiPlan: 'focusstack_ki_plan',
  apiKey: 'focusstack_api_key',
  verfuegbareStunden: 'focusstack_stunden',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// Aufgaben
export function ladeAufgaben(): Aufgabe[] {
  return load<Aufgabe[]>(KEYS.aufgaben, [])
}

export function speichereAufgaben(aufgaben: Aufgabe[]): void {
  save(KEYS.aufgaben, aufgaben)
}

export function fuegeAufgabeHinzu(aufgabe: Omit<Aufgabe, 'id' | 'erstelltAm' | 'erledigt'>): Aufgabe {
  const neu: Aufgabe = {
    ...aufgabe,
    id: crypto.randomUUID(),
    erledigt: false,
    erstelltAm: new Date().toISOString(),
  }
  const alle = ladeAufgaben()
  speichereAufgaben([...alle, neu])
  return neu
}

export function aktualisiereAufgabe(id: string, aenderungen: Partial<Aufgabe>): void {
  const alle = ladeAufgaben()
  speichereAufgaben(alle.map(a => (a.id === id ? { ...a, ...aenderungen } : a)))
}

export function loescheAufgabe(id: string): void {
  speichereAufgaben(ladeAufgaben().filter(a => a.id !== id))
}

// Zeiteinträge
export function ladeZeiteintraege(): Zeiteintrag[] {
  return load<Zeiteintrag[]>(KEYS.zeiteintraege, [])
}

export function speichereZeiteintrag(eintrag: Omit<Zeiteintrag, 'id'>): Zeiteintrag {
  const neu: Zeiteintrag = { ...eintrag, id: crypto.randomUUID() }
  const alle = ladeZeiteintraege()
  save(KEYS.zeiteintraege, [...alle, neu])
  return neu
}

export function heutigeZeiteintraege(): Zeiteintrag[] {
  const heute = new Date().toDateString()
  return ladeZeiteintraege().filter(z => new Date(z.startzeit).toDateString() === heute)
}

// KI-Plan
export function ladeKIPlan(): KIPlan | null {
  return load<KIPlan | null>(KEYS.kiPlan, null)
}

export function speichereKIPlan(plan: KIPlan): void {
  save(KEYS.kiPlan, plan)
}

// API Key & Einstellungen
export function ladeApiKey(): string {
  return load<string>(KEYS.apiKey, '')
}

export function speichereApiKey(key: string): void {
  save(KEYS.apiKey, key)
}

export function ladeVerfuegbareStunden(): number {
  return load<number>(KEYS.verfuegbareStunden, 8)
}

export function speichereVerfuegbareStunden(stunden: number): void {
  save(KEYS.verfuegbareStunden, stunden)
}
