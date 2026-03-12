"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PerfilPage() {
  const { user, isLoggedIn, login, refreshUserData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    // Cargar datos del usuario
    const loadUserData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        // Obtener token de autenticación
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
          throw new Error("Error al cargar datos del usuario")
        }

        const userData = await response.json()

        if (userData) {
          setNombre(userData.nombre || user.name || "")
          setEmail(userData.email || user.email || "")
          setTelefono(userData.telefono || "")
          setDni(userData.dni || "")
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
        setErrorMessage("No se pudieron cargar los datos del perfil. Por favor, inténtalo de nuevo más tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [isLoggedIn, router, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    if (password && password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden")
      return
    }

    if (password && password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      if (!user) throw new Error("Usuario no autenticado")

      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      // Actualizar datos del usuario
      const updateData: any = {
        nombre,
        email,
        telefono: telefono || undefined,
        dni: dni || undefined,
      }

      console.log("Enviando datos para actualizar:", updateData)

      const updateResponse = await fetch(`/api/usuarios/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        console.error("Error en la respuesta:", errorData)
        throw new Error(errorData.message || "Error al actualizar los datos del perfil")
      }

      const updatedUserData = await updateResponse.json()
      console.log("Datos actualizados:", updatedUserData)

      // Si hay contraseña nueva, actualizarla por separado
      if (password) {
        const passwordResponse = await fetch(`/api/usuarios/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            newPassword: password,
          }),
        })

        if (!passwordResponse.ok) {
          throw new Error("Error al actualizar la contraseña")
        }
      }

      // Actualizar datos en localStorage y en el contexto de autenticación
      const updatedUser = {
        ...user,
        name: nombre,
        email: email,
        dni,
      }

      localStorage.setItem("user", JSON.stringify(updatedUser))
      login(updatedUser as any, token)

      // Refrescar los datos del usuario en el contexto
      await refreshUserData()

      setSuccessMessage("Perfil actualizado correctamente")
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      })

      setIsEditing(false)
      setPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error)
      setErrorMessage(error.message || "Ha ocurrido un error al actualizar el perfil")
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  if (isLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Cargando perfil...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div className="max-w-2xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
        </div>

        {successMessage && (
          <div className="confirmation-message mb-6">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>{isEditing ? "Edita tus datos personales" : "Tus datos personales"}</CardDescription>
              </div>
              {!isEditing && <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>}
            </div>
          </CardHeader>

          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} className="text-base" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Dejar en blanco para mantener la actual"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirma tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-base"
                  />
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Nombre completo</h3>
                    <p className="text-lg">{nombre}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Correo electrónico</h3>
                    <p className="text-lg">{email}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Teléfono</h3>
                    <p className="text-lg">{telefono || "No especificado"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">DNI</h3>
                    <p className="text-lg">{dni || "No especificado"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tipo de usuario</h3>
                    <p className="text-lg capitalize">{user?.tipo || "Usuario"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {isEditing && (
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setPassword("")
                  setConfirmPassword("")
                  setErrorMessage(null)
                }}
                disabled={isLoading}
                className="text-base"
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading} className="text-base">
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

