"use client"

import type React from "react"

// Simplified toast component for v0
import { createContext, useContext, useState } from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toast: (props: ToastProps) => void
  toasts: Toast[]
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  toasts: [],
  removeToast: () => {},
})

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, ...props }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return <ToastContext.Provider value={{ toast, toasts, removeToast }}>{children}</ToastContext.Provider>
}

export const useToast = () => {
  return useContext(ToastContext)
}

// This is a simplified version just to make the code work in v0
// In a real app, you would use the full toast implementation
export const toast = (props: ToastProps) => {
  console.log("Toast:", props)
}

