export function IlluMorgen({ className = '' }: { className?: string }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    return {
      x1: 120 + Math.cos(a) * 38, y1: 110 + Math.sin(a) * 38,
      x2: 120 + Math.cos(a) * 56, y2: 110 + Math.sin(a) * 56,
    }
  })
  return (
    <svg className={className} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="m-sky" x1="120" y1="0" x2="120" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEF2FF" /><stop offset="1" stopColor="#C7D2FE" />
        </linearGradient>
        <linearGradient id="m-sun" x1="95" y1="82" x2="145" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" /><stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="m-h1" x1="120" y1="112" x2="120" y2="182" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" /><stop offset="1" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="m-h2" x1="120" y1="132" x2="120" y2="182" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F6BFF" /><stop offset="1" stopColor="#3730A3" />
        </linearGradient>
      </defs>
      <rect width="240" height="180" rx="20" fill="url(#m-sky)" />
      <ellipse cx="55" cy="48" rx="26" ry="13" fill="white" opacity="0.65" />
      <ellipse cx="72" cy="41" rx="20" ry="11" fill="white" opacity="0.55" />
      <ellipse cx="186" cy="36" rx="28" ry="12" fill="white" opacity="0.55" />
      <ellipse cx="200" cy="30" rx="19" ry="10" fill="white" opacity="0.45" />
      {rays.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" opacity="0.75" />
      ))}
      <circle cx="120" cy="110" r="30" fill="url(#m-sun)" />
      <circle cx="120" cy="110" r="23" fill="#FBBF24" opacity="0.65" />
      <path d="M-5 148 Q55 108 120 136 Q185 108 245 148 L245 182 L-5 182Z" fill="url(#m-h1)" />
      <path d="M-5 163 Q70 130 148 155 Q200 138 245 165 L245 182 L-5 182Z" fill="url(#m-h2)" />
      <circle cx="42" cy="26" r="2" fill="#FDE68A" opacity="0.8" />
      <circle cx="210" cy="58" r="1.5" fill="#FDE68A" opacity="0.6" />
      <circle cx="160" cy="18" r="2" fill="white" opacity="0.7" />
      <circle cx="22" cy="68" r="1.5" fill="white" opacity="0.5" />
    </svg>
  )
}

export function IlluAufgaben({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="au-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#4F6BFF" floodOpacity="0.15" />
        </filter>
      </defs>
      <g opacity="0.55" transform="rotate(-8 80 90)">
        <rect x="8" y="44" width="118" height="58" rx="12" fill="white" stroke="#E0E7FF" strokeWidth="1.5" />
        <circle cx="36" cy="73" r="9" stroke="#C7D2FE" strokeWidth="2" />
        <rect x="54" y="67" width="55" height="6" rx="3" fill="#E8ECFF" />
        <rect x="54" y="79" width="38" height="5" rx="2.5" fill="#F0F3FF" />
      </g>
      <g opacity="0.5" transform="rotate(6 150 75)">
        <rect x="90" y="36" width="118" height="58" rx="12" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5" />
        <circle cx="118" cy="65" r="9" stroke="#818CF8" strokeWidth="2" />
        <rect x="136" y="59" width="50" height="6" rx="3" fill="#C7D2FE" />
        <rect x="136" y="71" width="34" height="5" rx="2.5" fill="#DDE4F9" />
      </g>
      <rect x="38" y="52" width="144" height="76" rx="16" fill="white" stroke="#E8ECFF" strokeWidth="1.5" filter="url(#au-shadow)" />
      <circle cx="68" cy="90" r="13" fill="#4F6BFF" />
      <polyline points="62,90 66.5,94.5 75,83" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="90" y="83" width="68" height="8" rx="4" fill="#1E293B" opacity="0.75" />
      <rect x="90" y="97" width="47" height="6" rx="3" fill="#CBD5E1" />
      <rect x="90" y="109" width="38" height="10" rx="5" fill="#EEF2FF" />
      <rect x="95" y="112" width="28" height="4" rx="2" fill="#818CF8" opacity="0.55" />
      <circle cx="186" cy="52" r="6" fill="#FCD34D" opacity="0.9" />
      <circle cx="28" cy="90" r="4" fill="#4F6BFF" opacity="0.2" />
      <circle cx="192" cy="116" r="5" fill="#7B5CFF" opacity="0.25" />
    </svg>
  )
}

export function IlluWoche({ className = '' }: { className?: string }) {
  const bars = [38, 62, 88, 48, 72, 28, 52]
  const days = ['M', 'D', 'M', 'D', 'F', 'S', 'S']
  const todayIdx = 2
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" rx="20" fill="#EEF2FF" />
      {bars.map((h, i) => (
        <rect key={i} x={20 + i * 24} y={112 - h} width="17" height={h} rx="6"
          fill={i === todayIdx ? '#4F6BFF' : i < todayIdx ? '#818CF8' : '#C7D2FE'}
          opacity={i === todayIdx ? 1 : 0.8}
        />
      ))}
      <line x1="15" y1="113" x2="185" y2="113" stroke="#C7D2FE" strokeWidth="1.5" />
      {days.map((d, i) => (
        <text key={i} x={28.5 + i * 24} y="128" textAnchor="middle" fontSize="9"
          fontFamily="-apple-system, sans-serif" fontWeight="600"
          fill={i === todayIdx ? '#4F6BFF' : '#94A3B8'}>{d}</text>
      ))}
      <circle cx="48.5" cy="16" r="12" fill="#FCD34D" opacity="0.95" />
      <line x1="48.5" y1="6" x2="48.5" y2="10" stroke="#FCD34D" strokeWidth="2" opacity="0.5" />
      <line x1="48.5" y1="22" x2="48.5" y2="26" stroke="#FCD34D" strokeWidth="2" opacity="0.5" />
      <line x1="38.5" y1="16" x2="42.5" y2="16" stroke="#FCD34D" strokeWidth="2" opacity="0.5" />
      <line x1="54.5" y1="16" x2="58.5" y2="16" stroke="#FCD34D" strokeWidth="2" opacity="0.5" />
      <circle cx="170" cy="22" r="5" fill="#7B5CFF" opacity="0.3" />
      <circle cx="155" cy="12" r="3" fill="#FCD34D" opacity="0.55" />
      <circle cx="22" cy="22" r="3" fill="#4F6BFF" opacity="0.2" />
    </svg>
  )
}
