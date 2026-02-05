import { useEffect, useState } from 'react'

export function Hint({ show, position = 'bottom', children, onDismiss, pulse = false }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      // Small delay before showing for smoother UX
      const timer = setTimeout(() => setVisible(true), 300)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [show])

  if (!show || !visible) return null

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-amber-500',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-amber-500',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-amber-500',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-amber-500',
  }

  return (
    <div
      className={`absolute z-40 ${positionClasses[position]} animate-hint-fade-in`}
      onClick={(e) => {
        e.stopPropagation()
        onDismiss?.()
      }}
    >
      <div className="relative bg-slate-900/95 border border-amber-500 rounded-lg px-4 py-2 min-w-48 max-w-sm shadow-lg">
        <p className="text-amber-100 text-sm whitespace-normal">{children}</p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss?.()
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 border border-slate-600 rounded-full text-slate-400 hover:text-amber-100 text-xs flex items-center justify-center"
        >
          ×
        </button>
        {/* Arrow */}
        <div className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`} />
      </div>
    </div>
  )
}

export function HintWrapper({ children, show, pulse = false }) {
  return (
    <div className={`relative ${show && pulse ? 'hint-pulse' : ''}`}>
      {children}
    </div>
  )
}
