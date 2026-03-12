"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Calendar, Clock, MapPin, Trash2 } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/spinner"

interface Reserva {
  id: string
  tipoReserva: string
  instalacion: string
  fecha: string
  horaInicio: string
  horaFin?: string
  horas: number
  precio: number
  estado: string
  createdAt: string
}

export default function MisReservasPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("todas")
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchReservas()
  }, [user])

  const fetchReservas = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/reservas?usuarioId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener las reservas")
      }

      const data = await response.json()
      setReservas(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus reservas. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cancelarReserva = async (id: string) => {
    try {
      setCancelingId(id)
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/reservas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cancelar la reserva")
      }

      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada correctamente.",
      })

      // Actualizar la lista de reservas
      setReservas(reservas.map((r) => (r.id === id ? { ...r, estado: "cancelada" } : r)))
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setCancelingId(null)
    }
  }

  const filteredReservas = reservas.filter((reserva) => {
    if (activeTab === "todas") return true
    if (activeTab === "deportivas") return reserva.tipoReserva === "deportiva"
    if (activeTab === "gimnasio") return reserva.tipoReserva === "gimnasio"
    if (activeTab === "piscina") return reserva.tipoReserva === "piscina"
    return true
  })

  // Separar reservas activas y canceladas
  const reservasActivas = filteredReservas.filter((r) => r.estado !== "cancelada")
  const reservasCanceladas = filteredReservas.filter((r) => r.estado === "cancelada")

  // Ordenar reservas por fecha (más recientes primero)
  const sortReservas = (a: Reserva, b: Reserva) => {
    const dateA = new Date(a.fecha)
    const dateB = new Date(b.fecha)
    return dateB.getTime() - dateA.getTime()
  }

  const reservasActivasOrdenadas = [...reservasActivas].sort(sortReservas)
  const reservasCanceladasOrdenadas = [...reservasCanceladas].sort(sortReservas)

  // Verificar si hay reservas futuras
  const now = new Date()
  const hayReservasFuturas = reservasActivasOrdenadas.some((r) => {
    const fechaReserva = new Date(r.fecha)
    return fechaReserva >= now
  })

  const getTipoReservaLabel = (tipo: string) => {
    switch (tipo) {
      case "deportiva":
        return "Deportiva"
      case "gimnasio":
        return "Gimnasio"
      case "piscina":
        return "Piscina"
      default:
        return tipo
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "confirmada":
        return <Badge className="bg-green-500">Confirmada</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "cancelada":
        return <Badge className="bg-red-500">Cancelada</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  // Verificar si una reserva es cancelable (solo si es futura)
  const esCancelable = (reserva: Reserva) => {
    if (reserva.estado === "cancelada") return false

    const fechaReserva = new Date(reserva.fecha)
    const horaInicio = Number.parseInt(reserva.horaInicio.split(":")[0])
    fechaReserva.setHours(horaInicio)

    // Solo se puede cancelar si faltan al menos 24 horas
    const horasParaReserva = (fechaReserva.getTime() - now.getTime()) / (1000 * 60 * 60)
    return horasParaReserva >= 24
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Mis Reservas</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {reservas.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No tienes reservas</AlertTitle>
              <AlertDescription>
                Aún no has realizado ninguna reserva. Puedes hacer una reserva en las secciones de reservas deportivas,
                gimnasio o piscina.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="todas" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="deportivas">Deportivas</TabsTrigger>
                <TabsTrigger value="gimnasio">Gimnasio</TabsTrigger>
                <TabsTrigger value="piscina">Piscina</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {!hayReservasFuturas && reservasActivasOrdenadas.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No tienes reservas activas</AlertTitle>
                    <AlertDescription>
                      No tienes reservas activas en esta categoría. Puedes hacer una reserva en las secciones
                      correspondientes.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Reservas Activas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reservasActivasOrdenadas.map((reserva) => (
                        <Card key={reserva.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{reserva.instalacion}</CardTitle>
                              {getEstadoBadge(reserva.estado)}
                            </div>
                            <CardDescription>
                              <Badge variant="outline" className="mr-2">
                                {getTipoReservaLabel(reserva.tipoReserva)}
                              </Badge>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{formatDate(new Date(reserva.fecha))}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>
                                  {formatTime(reserva.horaInicio)} -{" "}
                                  {formatTime(
                                    reserva.horaFin || `${Number.parseInt(reserva.horaInicio) + reserva.horas}:00`,
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>La Llosa</span>
                              </div>
                              {reserva.precio > 0 && (
                                <div className="font-semibold mt-2">Precio: {reserva.precio.toFixed(2)}€</div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter>
                            {/* Botón de cancelar reserva eliminado, solo se muestra el estado */}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>

                    {reservasCanceladasOrdenadas.length > 0 && (
                      <>
                        <Separator className="my-6" />
                        <h2 className="text-xl font-semibold mb-4">Reservas Canceladas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {reservasCanceladasOrdenadas.map((reserva) => (
                            <Card key={reserva.id} className="overflow-hidden opacity-70">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-lg">{reserva.instalacion}</CardTitle>
                                  {getEstadoBadge(reserva.estado)}
                                </div>
                                <CardDescription>
                                  <Badge variant="outline" className="mr-2">
                                    {getTipoReservaLabel(reserva.tipoReserva)}
                                  </Badge>
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{formatDate(new Date(reserva.fecha))}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      {formatTime(reserva.horaInicio)} -{" "}
                                      {formatTime(
                                        reserva.horaFin || `${Number.parseInt(reserva.horaInicio) + reserva.horas}:00`,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}

