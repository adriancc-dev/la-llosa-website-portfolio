"use client"

import { useEffect } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Eliminar la opción "system" y usar solo "light" y "dark"
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "system") {
      localStorage.setItem("theme", "light")
    }
  }, [])

  return (
    <NextThemesProvider
      {...props}
      enableSystem={false} // Deshabilitar la opción de sistema
      defaultTheme="light"
    >
      {children}
    </NextThemesProvider>
  )
}

