import React from 'react'
import { InfoIcon, WarningIcon } from '@phosphor-icons/react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white'
      case 'info':
        return 'bg-ink-900 hover:bg-ink-700 text-white'
      default:
        return 'bg-red-600 hover:bg-red-700 text-white'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <WarningIcon className="w-6 h-6 text-red-600" weight="duotone" aria-hidden="true" />
        )
      case 'warning':
        return (
          <WarningIcon className="w-6 h-6 text-yellow-600" weight="duotone" aria-hidden="true" />
        )
      case 'info':
        return (
          <InfoIcon className="w-6 h-6 text-blue-600" weight="duotone" aria-hidden="true" />
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink-950/60 transition-opacity"
        onClick={onCancel}
      ></div>

      {/* Dialog */}
      <div className="animate-rise-in relative bg-white rounded-2xl shadow-2xl ring-1 ring-ink-900/5 max-w-md w-full mx-4">
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-ink-50 ring-1 ring-ink-900/5 flex items-center justify-center">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 bg-white text-gray-700 rounded-lg ring-1 ring-inset ring-ink-200 hover:bg-gray-50 font-semibold"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2.5 rounded-lg font-semibold ${getButtonStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

