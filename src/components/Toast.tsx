import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'

interface ToastProps {
  message: string
  onDone: () => void
}

export default function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium whitespace-nowrap">
        <CheckCircle size={16} className="text-green-400 shrink-0" />
        {message}
      </div>
    </div>
  )
}
