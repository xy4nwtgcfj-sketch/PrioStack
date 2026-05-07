export interface Aufgabe {
  id: string
  titel: string
  projekt?: string
  geschaetzteDauer: number // Minuten
  deadline?: string // ISO date string
  erledigt: boolean
  erstelltAm: string // ISO datetime string
  pomodoros?: number // abgeschlossene Pomodoro-Einheiten
}

export interface Zeiteintrag {
  id: string
  aufgabeId: string
  aufgabeTitel: string
  startzeit: string // ISO datetime
  endzeit: string   // ISO datetime
  dauer: number     // Minuten
  istPomodoro?: boolean
}

export interface KIPlan {
  erstelltAm: string
  antwort: string
}
