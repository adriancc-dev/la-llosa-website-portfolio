"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { preciosGimnasio, CondicionGimnasio, TipoGimnasio } from "@/lib/data"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { redirectToRedsys } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { verificarEstadoPago } from "@/lib/google-sheets"
import { obtenerPrecioCorrecto } from "@/lib/data"

// Interfaz extendida para User con telefono opcional
interface ExtendedUser extends User {
  telefono?: string;
}

export default function ReservasGimnasio() {
  const [condicion, setCondicion] = useState("local")
  const [tipo, setTipo] = useState("diaria")
  const [precio, setPrecio] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [numeroCarnet, setNumeroCarnet] = useState("")
  const [reservaCompletada, setReservaCompletada] = useState(false)
  const [reservaId, setReservaId] = useState<string | null>(null)
  const [estaAlCorriente, setEstaAlCorriente] = useState(false)
  const { toast } = useToast()
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  // Verificar estado de pago cuando cambia el número de carnet
  useEffect(() => {
    const verificarPago = async () => {
      if (numeroCarnet && numeroCarnet.length === 3) {
        try {
          const response = await fetch("/api/verificar-estado-pago", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numeroCarnet })
          })
          if (!response.ok) throw new Error("Error al verificar estado de pago")
          const data = await response.json()
          setEstaAlCorriente(data.estaAlCorriente)
        } catch (error) {
          console.error("Error al verificar estado de pago:", error)
          setEstaAlCorriente(false)
        }
      }
    }
    verificarPago()
  }, [numeroCarnet])

  // Calcular precio basado en selecciones y estado de pago
  useEffect(() => {
    // Usar los valores de tipo y condición directamente
    const esLocal = condicion === "local" || condicion === "jubilado-local";
    const carnetValido = numeroCarnet.length === 3;
    const precioBase = obtenerPrecioCorrecto(
      tipo as TipoGimnasio,
      condicion,
      esLocal,
      estaAlCorriente,
      undefined,
      carnetValido
    );
    setPrecio(precioBase);
  }, [tipo, condicion, estaAlCorriente, numeroCarnet]);

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Debes iniciar sesión para realizar una reserva",
      })
      router.push("/login")
      return
    }
    if (!user) return
    if ((condicion === "local" || condicion === "jubilado-local") && !numeroCarnet) {
      toast({
        title: "Número de Carnet requerido",
        description: "Para usuarios locales, el número de carnet es obligatorio",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("No se encontró token de autenticación")
      const extendedUser = user as ExtendedUser
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
            telefono: extendedUser.telefono || "600123456",
            dni: numeroCarnet,
            instalacion: "Gimnasio Municipal",
            tipoReserva: "gimnasio",
            fecha: new Date(),
            horaInicio: "09:00",
            horaFin: "21:00",
            horas: tipo === "diaria" ? 1 : tipo === "mensual" ? 30 : 90,
            precio,
            esLocal: condicion === "local" || condicion === "jubilado-local",
            conLuz: false,
            estado: "confirmada",
            tipoAbono: tipo,
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
            telefono: extendedUser.telefono || "600123456",
            dni: numeroCarnet,
            instalacion: "Gimnasio Municipal",
            fecha: new Date(),
            horaInicio: "09:00",
            horaFin: "21:00",
            horas: tipo === "diaria" ? 1 : tipo === "mensual" ? 30 : 90,
            precio,
            esLocal: condicion === "local" || condicion === "jubilado-local",
            conLuz: false,
            estado: "confirmada",
            tipoReserva: "gimnasio",
            tipoAbono: tipo,
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
      // Crear reserva en estado pendiente
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
          telefono: extendedUser.telefono || "600123456",
          dni: numeroCarnet,
          instalacion: "Gimnasio Municipal",
          tipoReserva: "gimnasio",
          fecha: new Date(),
          horaInicio: "09:00",
          horaFin: "21:00",
          horas: tipo === "diaria" ? 1 : tipo === "mensual" ? 30 : 90,
          precio,
          esLocal: condicion === "local" || condicion === "jubilado-local",
          conLuz: false,
          estado: "pendiente",
          tipoAbono: tipo,
          metodoPago: "redsys",
        }),
      })
      const reservaData = await reservaResponse.json()
      if (!reservaResponse.ok) throw new Error(reservaData.message || "Error al crear reserva")
      if (!reservaData.id) throw new Error("No se pudo obtener el ID de la reserva")
      // Solicitar formulario Redsys
      const pagoResponse = await fetch("/api/pago-redsys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precio,
          nombre: user.name,
          email: user.email,
          instalacion: "Gimnasio Municipal",
          reservaId: reservaData.id,
        }),
      })
      const formData = await pagoResponse.json()
      if (!pagoResponse.ok || !formData.url) {
        toast({
          title: "Error",
          description: formData.error || "No se pudo generar el formulario de pago. Inténtalo de nuevo.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      // Redirigir al TPV Redsys
      redirectToRedsys(formData)
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
    setCondicion("local")
    setTipo("diaria")
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

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reservas Gimnasio</h1>
          <p className="text-muted-foreground">
            Accede a nuestro gimnasio municipal con diferentes opciones según tus necesidades.
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            Los bonos de gimnasio te permiten acceder a las instalaciones durante todo el período contratado. Podrás ver
            tus bonos activos en la sección "Mis Bonos".
          </AlertDescription>
        </Alert>

        {!reservaCompletada ? (
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Formulario de Reserva</CardTitle>
                <CardDescription>Selecciona tu condición y el tipo de entrada que deseas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selección de Condición */}
                <div className="space-y-2">
                  <Label>Condición</Label>
                  <RadioGroup value={condicion} onValueChange={setCondicion} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="jubilado-local" id="jubilado-local" />
                      <Label htmlFor="jubilado-local">Jubilado Local</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="local" id="local" />
                      <Label htmlFor="local">Local</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no-local" id="no-local" />
                      <Label htmlFor="no-local">No Local</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Campo DNI (obligatorio para usuarios locales) */}
                {(condicion === "local" || condicion === "jubilado-local") && (
                  <div className="space-y-2">
                    <Label htmlFor="numeroCarnet">Número de Carnet (obligatorio para usuarios locales)</Label>
                    <Input
                      id="numeroCarnet"
                      placeholder="123"
                      value={numeroCarnet}
                      onChange={(e) => setNumeroCarnet(e.target.value)}
                      maxLength={3}
                      required
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

                {/* Selección de Tipo */}
                <div className="space-y-2">
                  <Label>Tipo de Entrada</Label>
                  <RadioGroup value={tipo} onValueChange={setTipo} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="diaria" id="diaria" />
                      <Label htmlFor="diaria">Entrada Diaria</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mensual" id="mensual" />
                      <Label htmlFor="mensual">Bono Mensual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="trimestral" id="trimestral" />
                      <Label htmlFor="trimestral">Bono Trimestral</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Resumen de Precio */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">Precio:</span>
                    <span className="text-2xl font-bold" data-testid="precio-final">{precio.toFixed(2)} €</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => router.push("/")}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || ((condicion === "local" || condicion === "jubilado-local") && !numeroCarnet)}
                >
                  {isLoading ? "Procesando..." : "Solicitar Pago"}
                </Button>
              </CardFooter>
            </Card>

            <div>
              <h2 className="text-xl font-semibold mb-4">Tarifas del Gimnasio</h2>
              <motion.div className="grid gap-4" variants={staggerContainer} initial="hidden" animate="visible">
                {/* Tarjeta Entrada Diaria */}
                <motion.div variants={fadeIn}>
                  <Card className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Entrada Diaria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(["jubilado-local", "local", "no-local"] as CondicionGimnasio[]).map((cond) => (
                          <li className="flex justify-between" key={cond}>
                            <span>{cond === "jubilado-local" ? "Jubilados Locales" : cond === "local" ? "Locales" : "No Locales"}</span>
                            <span className="font-semibold">{preciosGimnasio[cond]["diaria"].toFixed(2)} €</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
                {/* Tarjeta Bono Mensual */}
                <motion.div variants={fadeIn}>
                  <Card className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Bono Mensual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(["jubilado-local", "local", "no-local"] as CondicionGimnasio[]).map((cond) => (
                          <li className="flex justify-between" key={cond}>
                            <span>{cond === "jubilado-local" ? "Jubilados Locales" : cond === "local" ? "Locales" : "No Locales"}</span>
                            <span className="font-semibold">{preciosGimnasio[cond]["mensual"].toFixed(2)} €</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
                {/* Tarjeta Bono Trimestral */}
                <motion.div variants={fadeIn}>
                  <Card className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Bono Trimestral</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(["jubilado-local", "local", "no-local"] as CondicionGimnasio[]).map((cond) => (
                          <li className="flex justify-between" key={cond}>
                            <span>{cond === "jubilado-local" ? "Jubilados Locales" : cond === "local" ? "Locales" : "No Locales"}</span>
                            <span className="font-semibold">{preciosGimnasio[cond]["trimestral"].toFixed(2)} €</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </div>
        ) : (
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                    <Info className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">¡Reserva Confirmada!</h2>
                <p className="text-muted-foreground">
                  Tu {tipo === "diaria" ? "entrada" : "bono"} para el gimnasio ha sido{" "}
                  {tipo === "diaria" ? "reservada" : "adquirido"} correctamente.
                </p>

                <div className="bg-muted/30 p-6 rounded-lg max-w-md mx-auto mt-4 text-left">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="font-medium">Tipo:</div>
                      <div className="ml-2">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="font-medium">Precio:</div>
                      <div className="ml-2">{precio.toFixed(2)} €</div>
                    </div>
                    <div className="flex items-center">
                      <div className="font-medium">Condición:</div>
                      <div className="ml-2">
                        {condicion === "jubilado-local"
                          ? "Jubilado Local"
                          : condicion === "local"
                            ? "Local"
                            : "No Local"}
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 max-w-md mx-auto">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription>
                    Hemos enviado un correo electrónico a {user?.email} con los detalles de tu reserva.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Button onClick={resetForm}>Realizar otra reserva</Button>
                  <Button variant="outline" asChild>
                    {tipo === "diaria" ? (
                      <Link href="/mis-reservas">Ver mis reservas</Link>
                    ) : (
                      <Link href="/mis-bonos">Ver mis bonos</Link>
                    )}
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

