import React from 'react'

export default function ConfirmDialog({ open, title, message, confirmText = 'Delete', onConfirm, onCancel }){
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-lg p-5 w-[90%] max-w-md">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 rounded bg-red-600 text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}