"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      enableSystem={false}
      defaultTheme="light"
      attribute="class"
      value={{
        light: "light",
        dark: "dark",
      }}
    >
      {children}
    </NextThemesProvider>
  )
}

