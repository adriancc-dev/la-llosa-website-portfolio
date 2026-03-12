"use client"

import { X } from "lucide-react"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts, removeToast } = useToast()

  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-background border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 ${
            toast.variant === "destructive" ? "border-red-500" : "border-border"
          }`}
        >
          <div className="flex-1">
            {toast.title && (
              <h3 className={`font-medium ${toast.variant === "destructive" ? "text-red-500" : ""}`}>{toast.title}</h3>
            )}
            {toast.description && <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      ))}
    </div>
  )
}

