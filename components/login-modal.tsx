"use client"

import type React from "react"
import ReactDOM from "react-dom"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/auth-provider"

type LoginModalProps = {
  onSuccess: () => void
  onClose: () => void
}

export function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register state
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  // Cerrar modal al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    window.addEventListener("mousedown", handleOutsideClick)
    return () => window.removeEventListener("mousedown", handleOutsideClick)
  }, [onClose])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginEmail || !loginPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Llamar a la API para iniciar sesión
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión")
      }

      // Usar la función login del contexto de autenticación
      login(data.user, data.token)

      toast({
        title: "¡Bienvenido!",
        description: `Has iniciado sesión correctamente`,
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!registerName || !registerEmail || !registerPhone || !registerPassword || !registerConfirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor, verifica que las contraseñas sean iguales",
        variant: "destructive",
      })
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, introduce un email válido",
        variant: "destructive",
      })
      return
    }

    if (!acceptTerms) {
      toast({
        title: "Términos y condiciones",
        description: "Debes aceptar los términos y condiciones para continuar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Llamar a la API para registrar usuario
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: registerName,
          email: registerEmail,
          telefono: registerPhone,
          password: registerPassword,
          tipo: "local", // Valor por defecto
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario")
      }

      // Usar la función login del contexto de autenticación
      login(data.user, data.token)

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada correctamente",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Portal root para el modal
  if (typeof window !== "undefined") {
    const modalContent = (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
        <div ref={modalRef} className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-auto p-0">
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Cabecera con gradiente */}
          <div className="relative h-32 bg-gradient-to-r from-primary/90 to-primary/60 flex items-center justify-center">
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">Ayuntamiento de La Llosa</h2>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm">
                  Crear Cuenta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">
                      Correo electrónico
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password" className="text-sm font-medium">
                        Contraseña
                      </Label>
                      <a href="#" className="text-xs text-primary hover:underline">
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">
                          {showLoginPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-10 mt-2 transition-all" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Iniciando sesión...
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    ¿No tienes una cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                      onClick={() => setActiveTab("register")}
                    >
                      Regístrate
                    </button>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-medium">
                      Nombre completo
                    </Label>
                    <Input
                      id="register-name"
                      placeholder="Tu nombre completo"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-medium">
                      Correo electrónico
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="text-sm font-medium">
                      Teléfono
                    </Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="600 000 000"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="h-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">
                          {showRegisterPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        </span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 6 caracteres</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-sm font-medium">
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Acepto los{" "}
                      <a href="/terminos" className="text-primary hover:underline">
                        términos y condiciones
                      </a>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-10 mt-2 transition-all" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creando cuenta...
                      </span>
                    ) : (
                      "Crear cuenta"
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    ¿Ya tienes una cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Inicia sesión
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    )
    return ReactDOM.createPortal(modalContent, document.body)
  }
  return null;
}

