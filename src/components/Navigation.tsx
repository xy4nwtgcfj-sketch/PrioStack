import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Clock, CalendarDays } from 'lucide-react'

const links = [
  { to: '/',              icon: Home,         label: 'Heute'        },
  { to: '/aufgaben',      icon: CheckSquare,  label: 'Aufgaben'     },
  { to: '/zeiterfassung', icon: Clock,        label: 'Zeiterfassung' },
  { to: '/woche',         icon: CalendarDays, label: 'Woche'        },
]

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 nav-safe z-50 shadow-lg">
      <div className="flex">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors
               ${isActive ? 'text-[#4F6BFF]' : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#4F6BFF]/12' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
