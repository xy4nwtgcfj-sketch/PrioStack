import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Clock } from 'lucide-react'

const links = [
  { to: '/',             icon: Home,        label: 'Heute'       },
  { to: '/aufgaben',     icon: CheckSquare, label: 'Aufgaben'    },
  { to: '/zeiterfassung', icon: Clock,      label: 'Zeiterfassung' },
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
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
               ${isActive ? 'text-[#4F6BFF]' : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
