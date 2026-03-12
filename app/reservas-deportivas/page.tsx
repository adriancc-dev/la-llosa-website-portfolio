"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { preciosDeportivos } from "@/lib/data"
import { useToast } from "@/components/ui/use-toast"
import { PaymentModal } from "@/components/payment-modal"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { format, isValid, isBefore, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import {
  obtenerHorariosDisponibles,
  esHoraPasada,
  esHoraDisponible,
  determinarTemporada,
  obtenerEstadoHoras,
  getNombreInstalacion,
} from "@/lib/horarios-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, CalendarIcon, Clock, MapPin, Users, Sun, Mail, CheckCircle } from "lucide-react"
import type { Reserva } from "@/lib/database"
import { redirectToRedsys } from "@/lib/utils"

/**
 * Función para crear una reserva llamando al endpoint /api/reservas,
 * utilizando el token de autenticación obtenido desde el localStorage.
 */
async function createReserva(data: any, token: string): Promise<any> {
  try {
    console.log("Enviando solicitud a /api/reservas con token:", token ? "Token presente" : "Token ausente")
    console.log("Datos de la reserva:", data)

    const response = await fetch("/api/reservas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("Error en la respuesta:", responseData)
      throw new Error(responseData.message || "Error al crear reserva")
    }

    return responseData
  } catch (error: any) {
    console.error("Error en createReserva:", error)
    throw error
  }
}

/**
 * Función para obtener las reservas de una fecha determinada llamando al endpoint /api/reservas.
 * Ahora puede filtrar por instalación específica.
 */
async function getReservasByDate(date: Date, instalacion?: string): Promise<Reserva[]> {
  try {
    // Verificar que la fecha sea válida
    if (!isValid(date)) {
      console.warn("Fecha inválida en getReservasByDate:", date)
      return []
    }

    const token = localStorage.getItem("auth_token")
    if (!token) {
      throw new Error("No se encontró token de autenticación")
    }

    const formattedDate = date.toISOString().split("T")[0]
    let url = `/api/reservas?fecha=${formattedDate}`

    // Añadir filtro de instalación si se proporciona
    if (instalacion) {
      url += `&instalacion=${encodeURIComponent(getNombreInstalacion(instalacion))}`
    }

    console.log("Consultando reservas con URL:", url)

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener reservas")
    }

    const data = await response.json()
    console.log("Reservas obtenidas:", data)

    // Asegurarse de que las fechas sean objetos Date válidos
    return data.map((reserva: any) => {
      if (typeof reserva.fecha === "string") {
        try {
          const fechaObj = new Date(reserva.fecha)
          return {
            ...reserva,
            fecha: isValid(fechaObj) ? fechaObj : new Date(), // Usar fecha actual como fallback
          }
        } catch (error) {
          console.error("Error al convertir fecha:", error)
          return {
            ...reserva,
            fecha: new Date(), // Usar fecha actual como fallback
          }
        }
      }
      return reserva
    })
  } catch (error) {
    console.error("Error al obtener reservas por fecha:", error)
    return []
  }
}

/**
 * Función para enviar notificación de reserva a través del endpoint /api/send-reserva-notification.
 */
async function notificarReserva(data: any): Promise<any> {
  try {
    const response = await fetch("/api/send-reserva-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Error al enviar notificación por email")
    }
    return await response.json()
  } catch (error) {
    console.error("Error al enviar notificación:", error)
    // No lanzamos error para que no interrumpa el flujo principal
    return { success: false, error: error }
  }
}

// Interfaz extendida para User con telefono opcional
interface ExtendedUser {
  id: string
  name: string
  email: string
  telefono?: string
  dni?: string
  tipo?: string
}

// Función para verificar si una fecha es el día actual
const isCurrentDay = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export default function ReservasDeportivas() {
  const [instalacion, setInstalacion] = useState("")
  const [esLocal, setEsLocal] = useState(true)
  const [conLuz, setConLuz] = useState(false)
  const [horas, setHoras] = useState(1)
  const [horaInicio, setHoraInicio] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [precio, setPrecio] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [numeroCarnet, setNumeroCarnet] = useState("")
  const [estaAlCorriente, setEstaAlCorriente] = useState(false)
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([])
  const [reservasDelDia, setReservasDelDia] = useState<Reserva[]>([])
  const [temporada, setTemporada] = useState<"invierno" | "verano">("invierno")
  const [estadoHoras, setEstadoHoras] = useState<
    {
      hora: string
      disponible: boolean
      pasada: boolean
      reservada: boolean
      instalacionOcupada?: string
    }[]
  >([])
  const [maxHorasDisponibles, setMaxHorasDisponibles] = useState(1)
  const [step, setStep] = useState(1)
  const [reservaCompletada, setReservaCompletada] = useState(false)
  const [reservaId, setReservaId] = useState<string | null>(null)

  const { toast } = useToast()
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  // Resetear hora de inicio cuando cambia la instalación
  useEffect(() => {
    setHoraInicio("")
    setHoras(1)

    // Si ya hay una fecha seleccionada, recargar las reservas con la nueva instalación
    if (selectedDate) {
      cargarReservasDelDia(selectedDate, instalacion)
    }
  }, [instalacion])

  // Verificar estado de pago cuando cambia el número de carnet
  useEffect(() => {
    const verificarPago = async () => {
      if (esLocal && numeroCarnet && numeroCarnet.length === 3) {
        try {
          const response = await fetch("/api/verificar-estado-pago", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numeroCarnet })
          });
          if (!response.ok) throw new Error("Error al verificar estado de pago");
          const data = await response.json();
          setEstaAlCorriente(data.estaAlCorriente);
        } catch (error) {
          console.error("Error al verificar estado de pago:", error);
          setEstaAlCorriente(false);
        }
      } else {
        setEstaAlCorriente(false);
      }
    };
    verificarPago();
  }, [numeroCarnet, esLocal]);

  // Función para cargar las reservas del día seleccionado
  const cargarReservasDelDia = async (fecha: Date, instalacionSeleccionada?: string) => {
    try {
      // Verificar que la fecha sea válida
      if (!isValid(fecha)) {
        console.warn("Fecha inválida en cargarReservasDelDia:", fecha)
        setReservasDelDia([])
        setEstadoHoras([])
        setHorasDisponibles([])
        return
      }

      // Obtener todas las reservas del día
      const reservas = await getReservasByDate(fecha)
      console.log("Reservas obtenidas:", reservas)

      // Verificar que las fechas de las reservas sean válidas
      const reservasValidas = reservas.filter((r) => {
        if (typeof r.fecha === "string") {
          return isValid(new Date(r.fecha))
        }
        return isValid(r.fecha)
      })

      setReservasDelDia(reservasValidas)

      // Obtener estado de cada hora para la instalación específica
      const estadoHoras = obtenerEstadoHoras(fecha, reservasValidas, instalacionSeleccionada)
      setEstadoHoras(estadoHoras)

      // Obtener solo las horas disponibles para el selector
      const soloHorasDisponibles = estadoHoras.filter((h) => h.disponible).map((h) => h.hora)
      setHorasDisponibles(soloHorasDisponibles)

      console.log("Horas disponibles para", instalacionSeleccionada, ":", soloHorasDisponibles)
    } catch (error) {
      console.error("Error al cargar reservas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas existentes",
        variant: "destructive",
      })
    }
  }

  // Actualizar temporada cuando cambia la fecha seleccionada
  useEffect(() => {
    if (selectedDate) {
      const nuevaTemporada = determinarTemporada(selectedDate)
      setTemporada(nuevaTemporada)

      // Resetear hora de inicio al cambiar de fecha
      setHoraInicio("")
      setHoras(1)

      // Cargar reservas del día seleccionado
      cargarReservasDelDia(selectedDate, instalacion)
    }
  }, [selectedDate])

  // Actualizar máximo de horas disponibles consecutivas cuando cambia la hora de inicio
  useEffect(() => {
    if (horaInicio && estadoHoras.length > 0) {
      const horaInicioIndex = estadoHoras.findIndex((h) => h.hora === horaInicio)
      if (horaInicioIndex === -1) return

      // Contar cuántas horas consecutivas están disponibles a partir de la hora de inicio
      let horasConsecutivas = 1
      for (let i = horaInicioIndex + 1; i < estadoHoras.length; i++) {
        if (estadoHoras[i].disponible) {
          horasConsecutivas++
        } else {
          break
        }
      }

      setMaxHorasDisponibles(horasConsecutivas)

      // Ajustar las horas seleccionadas si exceden el máximo disponible
      if (horas > horasConsecutivas) {
        setHoras(horasConsecutivas)
      }
    }
  }, [horaInicio, estadoHoras, horas])

  // Calcular precio basado en selecciones y estado de pago
  useEffect(() => {
    if (!instalacion || horas <= 0) {
      setPrecio(0)
      return
    }
    let precioHora = 0
    const tipoInstalacion = instalacion as keyof (typeof preciosDeportivos)["local-sin-luz"]
    let condicion = "no-local-sin-luz" as keyof typeof preciosDeportivos
    if (esLocal) {
      condicion = `${estaAlCorriente ? "local" : "no-local"}-${conLuz ? "con-luz" : "sin-luz"}` as keyof typeof preciosDeportivos
    } else {
      condicion = `no-local-${conLuz ? "con-luz" : "sin-luz"}` as keyof typeof preciosDeportivos
    }
    precioHora = preciosDeportivos[condicion][tipoInstalacion]
    setPrecio(precioHora * horas)
  }, [instalacion, esLocal, conLuz, horas, estaAlCorriente])

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Debes iniciar sesión para realizar una reserva",
      })
      router.push("/login")
      return
    }

    if (!instalacion || !selectedDate || !horaInicio || horas <= 0) {
      toast({
        title: "Datos incompletos",
        description: "Por favor, completa todos los campos del formulario",
        variant: "destructive",
      })
      return
    }

    if (esLocal && !numeroCarnet) {
      toast({
        title: "Número de Carnet requerido",
        description: "Para usuarios locales, el número de carnet es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (!user) throw new Error("Usuario no autenticado")
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("No se encontró token de autenticación")
      // Si el precio es 0, crear reserva confirmada y enviar correo
      if (precio === 0) {
        const reservaResponse = await fetch("/api/reservas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            idUsuario: user.id,
            nombre: user.name,
            email: user.email,
            telefono: (user as any).telefono || "600123456",
            dni: numeroCarnet,
            instalacion: getNombreInstalacion(instalacion),
            tipoReserva: "deportiva",
            fecha: selectedDate!.toISOString(),
            horaInicio,
            horas,
            precio,
            esLocal: esLocal && estaAlCorriente,
            conLuz,
            estado: "confirmada",
            metodoPago: "gratuito",
          }),
        })
        const reservaData = await reservaResponse.json()
        if (!reservaResponse.ok) throw new Error(reservaData.message || "Error al crear reserva")
        // Enviar correo de confirmación
        await fetch("/api/send-reserva-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: user.name,
            email: user.email,
            telefono: (user as any).telefono || "600123456",
            dni: numeroCarnet,
            instalacion: getNombreInstalacion(instalacion),
            fecha: selectedDate!.toISOString(),
            horaInicio,
            horas,
            precio,
            esLocal: esLocal && estaAlCorriente,
            conLuz,
            estado: "confirmada",
            tipoReserva: "deportiva",
          }),
        })
        setReservaCompletada(true)
        setReservaId(reservaData.id)
        toast({
          title: "Reserva gratuita confirmada",
          description: "Tu reserva ha sido confirmada y recibirás un correo con los detalles.",
        })
        setIsLoading(false)
        return
      }
      // ... flujo actual para reservas de pago ...
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error en el proceso de pago",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setInstalacion("")
    setSelectedDate(undefined)
    setHoraInicio("")
    setHoras(1)
    setStep(1)
    setReservaCompletada(false)
    setReservaId(null)
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  // Función para deshabilitar fechas pasadas
  const disabledDays = (date: Date) => {
    // Deshabilitar días anteriores a la fecha actual
    const today = new Date()
    return isBefore(date, startOfDay(today))
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div className="max-w-6xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Reservas Deportivas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reserva nuestras instalaciones deportivas con precios especiales para residentes locales.
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Información de temporada</AlertTitle>
          <AlertDescription>
            Actualmente estamos en temporada de {temporada === "invierno" ? "invierno" : "verano"}. Horario disponible:{" "}
            {temporada === "invierno" ? "8:00 a 22:00" : "7:00 a 24:00"}.
          </AlertDescription>
        </Alert>

        {/* Proceso de reserva en pasos */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 text-center">
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2 ${step >= 1 ? "bg-primary text-white" : "bg-muted"}`}
              >
                1
              </div>
              <p className={`text-sm ${step >= 1 ? "font-medium" : "text-muted-foreground"}`}>
                Seleccionar instalación
              </p>
            </div>
            <div className={`h-1 flex-1 ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
            <div className="flex-1 text-center">
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2 ${step >= 2 ? "bg-primary text-white" : "bg-muted"}`}
              >
                2
              </div>
              <p className={`text-sm ${step >= 2 ? "font-medium" : "text-muted-foreground"}`}>Elegir fecha y hora</p>
            </div>
            <div className={`h-1 flex-1 ${step >= 3 ? "bg-primary" : "bg-muted"}`}></div>
            <div className="flex-1 text-center">
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2 ${step >= 3 ? "bg-primary text-white" : "bg-muted"}`}
              >
                3
              </div>
              <p className={`text-sm ${step >= 3 ? "font-medium" : "text-muted-foreground"}`}>Confirmar reserva</p>
            </div>
          </div>
        </div>

        {/* Paso 1: Selección de instalación */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
              <Card
                className={`border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center ${instalacion === "padel" ? "border-primary" : "border-gray-200"}`}
                onClick={() => {
                  setInstalacion("padel");
                  setStep(2);
                }}
              >
                <CardContent className="p-8 flex flex-col items-center text-center h-full justify-between">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Pista de Pádel</h3>
                  <p className="text-sm text-muted-foreground mb-4">Pista de pádel con iluminación</p>
                  <div className="mt-auto">
                    <p className="text-sm font-medium">
                      Desde <span className="text-lg font-bold text-primary">0€</span> para locales
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className={`border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center ${instalacion === "futbol" ? "border-primary" : "border-gray-200"}`}
                onClick={() => {
                  setInstalacion("futbol");
                  setStep(2);
                }}
              >
                <CardContent className="p-8 flex flex-col items-center text-center h-full justify-between">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Campo de Fútbol</h3>
                  <p className="text-sm text-muted-foreground mb-4">Campo de fútbol con iluminación</p>
                  <div className="mt-auto">
                    <p className="text-sm font-medium">
                      Desde <span className="text-lg font-bold text-primary">0€</span> para locales
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className={`border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center ${instalacion === "fronton" ? "border-primary" : "border-gray-200"}`}
                onClick={() => {
                  setInstalacion("fronton");
                  setStep(2);
                }}
              >
                <CardContent className="p-8 flex flex-col items-center text-center h-full justify-between">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Frontón</h3>
                  <p className="text-sm text-muted-foreground mb-4">Frontón con iluminación</p>
                  <div className="mt-auto">
                    <p className="text-sm font-medium">
                      Desde <span className="text-lg font-bold text-primary">0€</span> para locales
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Paso 2: Selección de fecha y hora - NUEVO DISEÑO */}
        {step === 2 && (
          <div className="mb-8">
            <Card className="border-none shadow-lg mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      setStep(1)
                      setSelectedDate(undefined)
                      setHoraInicio("")
                    }}
                  >
                    ← Volver
                  </Button>
                  <CardTitle>Selecciona fecha y hora</CardTitle>
                </div>
                <CardDescription>
                  Reservando: <span className="font-medium">{getNombreInstalacion(instalacion)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Lado izquierdo: Formulario de reserva */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Detalles de la reserva</h3>

                      {/* Selección de hora */}
                      <div className="space-y-2">
                        <Label htmlFor="hora-inicio">Hora de inicio</Label>
                        <Select
                          value={horaInicio}
                          onValueChange={setHoraInicio}
                          disabled={!selectedDate || horasDisponibles.length === 0}
                        >
                          <SelectTrigger id="hora-inicio" className="h-10">
                            <SelectValue
                              placeholder={
                                !selectedDate
                                  ? "Selecciona primero una fecha"
                                  : horasDisponibles.length === 0
                                    ? `No hay horas disponibles para ${getNombreInstalacion(instalacion)}`
                                    : "Selecciona hora de inicio"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {horasDisponibles.length === 0 ? (
                              <SelectItem value="no-disponible" disabled>
                                No hay horas disponibles
                              </SelectItem>
                            ) : (
                              estadoHoras.map((horaInfo) => (
                                <SelectItem
                                  key={horaInfo.hora}
                                  value={horaInfo.hora}
                                  disabled={!horaInfo.disponible}
                                  className={`${horaInfo.pasada ? "text-muted-foreground line-through" : ""} ${horaInfo.reservada ? "text-red-500" : ""}`}
                                >
                                  {horaInfo.hora}
                                  {horaInfo.pasada ? " (Pasada)" : horaInfo.reservada ? " (Ocupada)" : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        {selectedDate && horasDisponibles.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            No hay horas disponibles para {getNombreInstalacion(instalacion)} en esta fecha. Por favor,
                            selecciona otra fecha.
                          </p>
                        )}
                      </div>

                      {/* Selección de duración */}
                      <div className="space-y-2">
                        <Label htmlFor="horas">Duración (horas)</Label>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((h: number) => (
                            <Button
                              key={h}
                              type="button"
                              variant={horas === h ? "default" : "outline"}
                              size="sm"
                              onClick={() => setHoras(h)}
                              disabled={!horaInicio || h > maxHorasDisponibles}
                              className="flex-1"
                            >
                              {h}
                            </Button>
                          ))}
                        </div>
                        {horaInicio && (
                          <p className="text-xs text-muted-foreground">
                            Máximo disponible: {maxHorasDisponibles} {maxHorasDisponibles === 1 ? "hora" : "horas"}
                          </p>
                        )}
                      </div>

                      {/* Opciones adicionales */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="es-local"
                            checked={esLocal}
                            onCheckedChange={(checked) => setEsLocal(checked as boolean)}
                          />
                          <Label htmlFor="es-local" className="cursor-pointer">
                            Usuario Local
                          </Label>
                        </div>

                        {esLocal && (
                          <div className="space-y-2 pl-6">
                            <Label htmlFor="numeroCarnet">Número de Carnet (obligatorio para usuarios locales)</Label>
                            <Input
                              id="numeroCarnet"
                              placeholder="123"
                              value={numeroCarnet}
                              onChange={(e) => setNumeroCarnet(e.target.value)}
                              maxLength={3}
                              required
                              className="h-10"
                            />
                            {numeroCarnet.length === 3 && (
                              <p className="text-sm text-muted-foreground">
                                {estaAlCorriente
                                  ? "Usuario al corriente de pago"
                                  : "Usuario no al corriente de pago"}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="con-luz"
                            checked={conLuz}
                            onCheckedChange={(checked) => setConLuz(checked as boolean)}
                          />
                          <Label htmlFor="con-luz" className="cursor-pointer flex items-center">
                            <Sun className="h-4 w-4 mr-1" />
                            Con Luz
                          </Label>
                        </div>
                      </div>

                      {/* Resumen y precio */}
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Precio Total:</span>
                          <span className="text-xl font-bold">
                            {precio === 0 && esLocal && !conLuz ? "Gratis" : `${precio.toFixed(2)} €`}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {esLocal && !conLuz ? (
                            <span className="text-green-600 dark:text-green-400">
                              Gratuito para usuarios locales sin luz
                            </span>
                          ) : (
                            <span>
                              {precio > 0 &&
                                `${(precio / horas).toFixed(2)} € × ${horas} ${horas === 1 ? "hora" : "horas"}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lado derecho: Calendario interactivo */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Selecciona una fecha</h3>
                    <div className="bg-card rounded-lg p-4 border shadow-sm">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={es}
                        className="mx-auto"
                        disabled={disabledDays}
                        modifiersClassNames={{
                          today: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
                        }}
                        modifiers={{
                          today: (date) => isCurrentDay(date),
                        }}
                      />
                    </div>

                    {selectedDate && (
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                          {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Selecciona una hora disponible para completar tu reserva.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de continuar */}
                <div className="mt-8 flex justify-end">
                  <Button
                    className="w-full md:w-auto"
                    disabled={!selectedDate || !horaInicio}
                    onClick={() => setStep(3)}
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 3: Confirmación de reserva */}
        {step === 3 && !reservaCompletada && (
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center mb-2">
                <Button variant="ghost" size="sm" className="mr-2" onClick={() => setStep(2)}>
                  ← Volver
                </Button>
                <CardTitle>Confirmar reserva</CardTitle>
              </div>
              <CardDescription>Revisa los detalles de tu reserva antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">{getNombreInstalacion(instalacion)}</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Fecha</p>
                        <p className="text-muted-foreground">
                          {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Horario</p>
                        <p className="text-muted-foreground">
                          {horaInicio} -{" "}
                          {
                            obtenerHorariosDisponibles(selectedDate!)[
                              obtenerHorariosDisponibles(selectedDate!).indexOf(horaInicio) + horas
                            ]
                          }{" "}
                          ({horas} {horas === 1 ? "hora" : "horas"})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-muted-foreground">Polideportivo Municipal de La Llosa</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Tipo de usuario</p>
                        <p className="text-muted-foreground">{esLocal ? "Local" : "No local"}</p>
                      </div>
                    </div>

                    {esLocal && (
                      <div className="flex items-start">
                        <div className="h-5 w-5 mr-3 mt-0.5 flex items-center justify-center text-primary">
                          <span className="font-bold">ID</span>
                        </div>
                        <div>
                          <p className="font-medium">Número de Carnet</p>
                          <p className="text-muted-foreground">{numeroCarnet}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <Sun className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Iluminación</p>
                        <p className="text-muted-foreground">{conLuz ? "Con luz" : "Sin luz"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Precio Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {precio === 0 && esLocal && !conLuz ? "Gratis" : `${precio.toFixed(2)} €`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aviso de correo electrónico */}
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription>
                  Recibirás un correo electrónico con los detalles de tu reserva una vez confirmada.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between space-x-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Modificar
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isLoading || (esLocal && !numeroCarnet)}>
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
                      Procesando...
                    </span>
                  ) : (
                    "Confirmar y Pagar"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmación de reserva completada */}
        {reservaCompletada && (
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">¡Reserva Confirmada!</h2>
                <p className="text-muted-foreground">
                  Tu reserva de {getNombreInstalacion(instalacion)} para el{" "}
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : ""} ha sido confirmada.
                </p>

                <div className="bg-muted/30 p-6 rounded-lg max-w-md mx-auto mt-4 text-left">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">
                          {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es }) : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">
                          {horaInicio} -{" "}
                          {
                            obtenerHorariosDisponibles(selectedDate!)[
                              obtenerHorariosDisponibles(selectedDate!).indexOf(horaInicio) + horas
                            ]
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Polideportivo Municipal de La Llosa</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 max-w-md mx-auto">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription>
                    Hemos enviado un correo electrónico a {user?.email} con los detalles de tu reserva.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Button onClick={resetForm}>Realizar otra reserva</Button>
                  <Button variant="outline" asChild>
                    <Link href="/mis-reservas">Ver mis reservas</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

