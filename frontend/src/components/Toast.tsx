import React, { useState, useEffect } from 'react'
import { CheckIcon, InfoIcon, XIcon } from '@phosphor-icons/react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-800 text-white'
      case 'error':
        return 'bg-red-700 text-white'
      case 'info':
        return 'bg-ink-900 text-white'
      default:
        return 'bg-ink-700 text-white'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <CheckIcon className="w-6 h-6" weight="bold" aria-hidden="true" />
        )
      case 'error':
        return (
          <XIcon className="w-6 h-6" weight="bold" aria-hidden="true" />
        )
      case 'info':
        return (
          <InfoIcon className="w-6 h-6" weight="duotone" aria-hidden="true" />
        )
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${getToastStyles()} rounded-xl shadow-2xl ring-1 ring-white/10 p-4 min-w-80 max-w-96 animate-slide-in`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm leading-tight">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors duration-200"
        >
          <XIcon className="w-4 h-4" weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// Hook para manejar notificaciones
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}

export default Toast
