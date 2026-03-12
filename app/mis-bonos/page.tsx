"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Calendar, Info } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface Bono {
  id: string
  tipo: string
  instalacion: string
  fechaInicio: string
  fechaFin: string
  precio: number
  estado: string
  createdAt: string
  usos?: number
  usosMaximos?: number
}

export default function MisBonosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [bonos, setBonos] = useState<Bono[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("todos")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchBonos()
  }, [user])

  const fetchBonos = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/bonos?usuarioId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener los bonos")
      }

      const data = await response.json()
      setBonos(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar tus bonos. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredBonos = bonos.filter((bono) => {
    if (activeTab === "todos") return true
    if (activeTab === "gimnasio") return bono.instalacion.toLowerCase().includes("gimnasio")
    if (activeTab === "piscina") return bono.instalacion.toLowerCase().includes("piscina")
    return true
  })

  // Separar bonos activos y expirados
  const now = new Date()
  const bonosActivos = filteredBonos.filter((b) => {
    const fechaFin = new Date(b.fechaFin)
    return fechaFin >= now && b.estado === "activo"
  })
  const bonosExpirados = filteredBonos.filter((b) => {
    const fechaFin = new Date(b.fechaFin)
    return fechaFin < now || b.estado !== "activo"
  })

  // Ordenar bonos por fecha (más recientes primero)
  const sortBonos = (a: Bono, b: Bono) => {
    const dateA = new Date(a.fechaInicio)
    const dateB = new Date(b.fechaInicio)
    return dateB.getTime() - dateA.getTime()
  }

  const bonosActivosOrdenados = [...bonosActivos].sort(sortBonos)
  const bonosExpiradosOrdenados = [...bonosExpirados].sort(sortBonos)

  const getTipoBono = (bono: Bono) => {
    if (bono.tipo === "mensual") return "Mensual"
    if (bono.tipo === "trimestral") return "Trimestral"
    if (bono.tipo === "anual") return "Anual"
    if (bono.tipo === "usos") return `${bono.usosMaximos} Usos`
    return bono.tipo
  }

  const getEstadoBadge = (bono: Bono) => {
    const fechaFin = new Date(bono.fechaFin)

    if (bono.estado !== "activo") {
      return <Badge className="bg-red-500">Expirado</Badge>
    }

    if (fechaFin < now) {
      return <Badge className="bg-red-500">Expirado</Badge>
    }

    // Calcular días restantes
    const diasRestantes = Math.ceil((fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diasRestantes <= 7) {
      return <Badge className="bg-yellow-500">Expira pronto</Badge>
    }

    return <Badge className="bg-green-500">Activo</Badge>
  }

  const calcularPorcentajeUso = (bono: Bono) => {
    if (bono.tipo === "usos" && bono.usosMaximos && bono.usos !== undefined) {
      return Math.min(100, Math.round((bono.usos / bono.usosMaximos) * 100))
    }

    // Para bonos temporales, calcular porcentaje de tiempo transcurrido
    const fechaInicio = new Date(bono.fechaInicio)
    const fechaFin = new Date(bono.fechaFin)
    const duracionTotal = fechaFin.getTime() - fechaInicio.getTime()
    const tiempoTranscurrido = now.getTime() - fechaInicio.getTime()

    return Math.min(100, Math.max(0, Math.round((tiempoTranscurrido / duracionTotal) * 100)))
  }

  const calcularDiasRestantes = (bono: Bono) => {
    const fechaFin = new Date(bono.fechaFin)
    if (fechaFin < now) return 0

    return Math.ceil((fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Mis Bonos</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {bonos.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No tienes bonos</AlertTitle>
              <AlertDescription>
                Aún no has adquirido ningún bono. Puedes comprar bonos en las secciones de gimnasio o piscina.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="gimnasio">Gimnasio</TabsTrigger>
                <TabsTrigger value="piscina">Piscina</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {bonosActivosOrdenados.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No tienes bonos activos</AlertTitle>
                    <AlertDescription>
                      No tienes bonos activos en esta categoría. Puedes adquirir bonos en las secciones
                      correspondientes.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Bonos Activos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bonosActivosOrdenados.map((bono) => (
                        <Card key={bono.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{bono.instalacion}</CardTitle>
                              {getEstadoBadge(bono)}
                            </div>
                            <CardDescription>
                              <Badge variant="outline" className="mr-2">
                                {getTipoBono(bono)}
                              </Badge>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>
                                    Válido: {formatDate(new Date(bono.fechaInicio))} -{" "}
                                    {formatDate(new Date(bono.fechaFin))}
                                  </span>
                                </div>

                                {bono.tipo === "usos" && bono.usosMaximos ? (
                                  <div className="flex items-center">
                                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      Usos: {bono.usos || 0} de {bono.usosMaximos}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{calcularDiasRestantes(bono)} días restantes</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progreso</span>
                                  <span>{calcularPorcentajeUso(bono)}%</span>
                                </div>
                                <Progress value={calcularPorcentajeUso(bono)} className="h-2" />
                              </div>

                              {bono.precio > 0 && (
                                <div className="font-semibold mt-2">Precio pagado: {bono.precio.toFixed(2)}€</div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {bonosExpiradosOrdenados.length > 0 && (
                      <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Bonos Expirados</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {bonosExpiradosOrdenados.map((bono) => (
                            <Card key={bono.id} className="overflow-hidden opacity-70">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-lg">{bono.instalacion}</CardTitle>
                                  <Badge className="bg-red-500">Expirado</Badge>
                                </div>
                                <CardDescription>
                                  <Badge variant="outline" className="mr-2">
                                    {getTipoBono(bono)}
                                  </Badge>
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      Válido: {formatDate(new Date(bono.fechaInicio))} -{" "}
                                      {formatDate(new Date(bono.fechaFin))}
                                    </span>
                                  </div>

                                  {bono.tipo === "usos" && bono.usosMaximos && (
                                    <div className="flex items-center">
                                      <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>
                                        Usos: {bono.usos || 0} de {bono.usosMaximos}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
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

