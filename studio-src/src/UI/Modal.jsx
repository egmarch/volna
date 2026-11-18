import { useEffect } from 'react'
import { X } from 'lucide-react'
import { closeModal } from '../store'

// Общая оболочка окон: Esc / клик по фону закрывает, фокус не уходит на канвас.
export default function Modal({ title, accent = '#f2a38a', wide = false, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl shadow-2xl ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}
        style={{ boxShadow: `0 0 80px -20px ${accent}66` }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-wide" style={{ color: accent }}>{title}</h2>
          <button
            onClick={closeModal}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            <span className="hidden sm:inline">Esc</span>
            <X size={18} />
          </button>
        </div>
        <div className="scroll-thin overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
