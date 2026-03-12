"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: string
  name: string
  email: string
  tipo: string
  dni?: string
  imagenPerfil?: string
}

type AuthContextType = {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  checkAuth: () => boolean
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  checkAuth: () => false,
  refreshUserData: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Función para verificar y decodificar el token JWT
  const verifyToken = (token: string): boolean => {
    try {
      const tokenParts = token.split(".")
      if (tokenParts.length !== 3) return false

      const payload = JSON.parse(atob(tokenParts[1]))
      return payload.exp > Date.now() / 1000
    } catch (error) {
      console.error("Error verificando token:", error)
      return false
    }
  }

  // Función para refrescar los datos del usuario desde el servidor
  const refreshUserData = async () => {
    try {
      if (!user) return

      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      const response = await fetch(`/api/usuarios/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener datos del usuario")
      }

      const userData = await response.json()

      // Actualizar datos del usuario en el estado y localStorage
      const updatedUser = {
        ...user,
        name: userData.nombre || user.name,
        email: userData.email || user.email,
        dni: userData.dni || user.dni,
        imagenPerfil: userData.imagenPerfil || user.imagenPerfil,
      }

      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    } catch (error) {
      console.error("Error al refrescar datos del usuario:", error)
    }
  }

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const checkSession = () => {
      const token = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user")

      if (token && storedUser) {
        try {
          // Verificar si el token ha expirado
          if (!verifyToken(token)) {
            // Token expirado
            localStorage.removeItem("auth_token")
            localStorage.removeItem("user")
            setIsLoggedIn(false)
            setUser(null)
            toast({
              title: "Sesión expirada",
              description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
              variant: "destructive",
            })
          } else {
            const parsedUser = JSON.parse(storedUser)
            // FIX: Si solo tiene _id, lo pasamos a id
            if (!parsedUser.id && parsedUser._id) {
              parsedUser.id = parsedUser._id
              delete parsedUser._id
            }
            setUser(parsedUser)
            setIsLoggedIn(true)
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user")
          setIsLoggedIn(false)
          setUser(null)
        }
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }

      setIsLoading(false)
    }

    checkSession()

    // Configurar un intervalo para verificar periódicamente la validez del token
    const tokenCheckInterval = setInterval(
      () => {
        const token = localStorage.getItem("auth_token")
        if (token && !verifyToken(token)) {
          logout()
          toast({
            title: "Sesión expirada",
            description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          })
        }
      },
      15 * 60 * 1000,
    ) // Verificar cada 15 minutos

    return () => clearInterval(tokenCheckInterval)
  }, [])

  const login = (userData: User, token: string) => {
    setUser(userData)
    setIsLoggedIn(true)
    localStorage.setItem("auth_token", token)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const checkAuth = (): boolean => {
    const token = localStorage.getItem("auth_token")
    if (!token) return false
    return verifyToken(token)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        login,
        logout,
        checkAuth,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

