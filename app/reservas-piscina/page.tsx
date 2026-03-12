"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { preciosPiscina } from "@/lib/data"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, CheckCircle } from "lucide-react"
import Link from "next/link"
import { verificarEstadoPago } from "@/lib/google-sheets"
import { obtenerPrecioCorrecto } from "@/lib/data"
import { redirectToRedsys } from "@/lib/utils"

// Interfaz extendida para User con telefono opcional
interface ExtendedUser extends User {
  telefono?: string;
}

export default function ReservasPiscina() {
  const [tab, setTab] = useState("individual")
  const [condicionIndividual, setCondicionIndividual] = useState("local-adulto")
  const [condicionBonoMensual, setCondicionBonoMensual] = useState("local-adulto")
  const [condicionBonoTemporada, setCondicionBonoTemporada] = useState("local-adulto")
  const [condicionCurso, setCondicionCurso] = useState("local-adulto")
  const [curso, setCurso] = useState("aquasalud")
  const [precio, setPrecio] = useState(0)
  const [expedicionBono, setExpedicionBono] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
    let condicionActual = condicionIndividual;
    if (tab === "bono-mensual") condicionActual = condicionBonoMensual;
    if (tab === "bono-temporada") condicionActual = condicionBonoTemporada;
    if (tab === "curso") condicionActual = condicionCurso;
    const esLocal = condicionActual.startsWith("local") || condicionActual === "familiar";
    const carnetValido = numeroCarnet.length === 3;

    // Asegurarse de que el tipo de 'tab' es correcto para obtenerPrecioCorrecto
    // Si 'tab' no es uno de los tipos esperados, usar "individual" como fallback
    const tiposValidos = ["individual", "bono-mensual", "bono-temporada", "curso"];
    const tabSeguro = tiposValidos.includes(tab) ? tab as "individual" | "bono-mensual" | "bono-temporada" | "curso" : "individual";

    const precioBase = obtenerPrecioCorrecto(tabSeguro, condicionActual, esLocal, estaAlCorriente, curso, carnetValido);
    const precioFinal = expedicionBono && (tabSeguro === "bono-mensual" || tabSeguro === "bono-temporada") ? precioBase + 2 : precioBase;
    setPrecio(precioFinal);
  }, [tab, condicionIndividual, condicionBonoMensual, condicionBonoTemporada, condicionCurso, curso, expedicionBono, estaAlCorriente, numeroCarnet]);

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
    if ((condicionIndividual.startsWith("local") || condicionIndividual === "familiar") && !numeroCarnet) {
      toast({
        title: "Número de Carnet requerido",
        description: "Para usuarios locales, el número de Carnet es obligatorio",
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
            instalacion: "Piscina Municipal",
            tipoReserva: "piscina",
            fecha: new Date(),
            horaInicio: "10:00",
            horaFin: "20:00",
            horas: tab === "individual" ? 1 : 30,
            precio,
            esLocal: condicionIndividual.startsWith("local") || condicionIndividual === "familiar",
            conLuz: false,
            estado: "confirmada",
            tipoAbono: tab,
            tipoCurso: tab === "curso" ? curso : undefined,
            expedicionBono: expedicionBono,
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
            instalacion: "Piscina Municipal",
            fecha: new Date(),
            horaInicio: "10:00",
            horaFin: "20:00",
            horas: tab === "individual" ? 1 : 30,
            precio,
            esLocal: condicionIndividual.startsWith("local") || condicionIndividual === "familiar",
            conLuz: false,
            estado: "confirmada",
            tipoReserva: "piscina",
            tipoAbono: tab,
            tipoCurso: tab === "curso" ? curso : undefined,
            expedicionBono: expedicionBono,
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
          instalacion: "Piscina Municipal",
          tipoReserva: "piscina",
          fecha: new Date(),
          horaInicio: "10:00",
          horaFin: "20:00",
          horas: tab === "individual" ? 1 : 30,
          precio,
          esLocal: condicionIndividual.startsWith("local") || condicionIndividual === "familiar",
          conLuz: false,
          estado: "pendiente",
          tipoAbono: tab,
          tipoCurso: tab === "curso" ? curso : undefined,
          expedicionBono: expedicionBono,
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
          instalacion: "Piscina Municipal",
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
    setTab("individual")
    setCondicionIndividual("local-adulto")
    setCondicionBonoMensual("local-adulto")
    setCondicionBonoTemporada("local-adulto")
    setCondicionCurso("local-adulto")
    setCurso("aquasalud")
    setExpedicionBono(false)
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

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reservas Piscina</h1>
          <p className="text-muted-foreground">
            Disfruta de nuestra piscina municipal con diferentes opciones según tus necesidades.
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            Los bonos de piscina te permiten acceder a las instalaciones durante todo el período contratado. Podrás ver
            tus bonos activos en la sección "Mis Bonos".
          </AlertDescription>
        </Alert>

        {!reservaCompletada ? (
          <Card>
            <CardHeader>
              <CardTitle>Formulario de Reserva</CardTitle>
              <CardDescription>
                Selecciona el tipo de entrada y tus condiciones para calcular el precio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="individual" value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="individual">Individual</TabsTrigger>
                  <TabsTrigger value="bono-mensual">Bono Mensual</TabsTrigger>
                  <TabsTrigger value="bono-temporada">Bono Temporada</TabsTrigger>
                  <TabsTrigger value="curso">Curso</TabsTrigger>
                </TabsList>

                {/* Contenido para Individual */}
                <TabsContent value="individual" className="space-y-6">
                  <div className="space-y-2">
                    <Label>Condición</Label>
                    <RadioGroup value={condicionIndividual} onValueChange={setCondicionIndividual} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local-menor-3" id="local-menor-3" />
                        <Label htmlFor="local-menor-3">Local (0-3 años)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local-adulto" id="local-adulto" />
                        <Label htmlFor="local-adulto">Local (más de 3 años)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-local-adulto" id="no-local-adulto" />
                        <Label htmlFor="no-local-adulto">No Local (más de 3 años)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campo de Carnet (obligatorio para usuarios locales) */}
                  {(condicionIndividual.startsWith("local") || condicionIndividual === "familiar" || condicionIndividual === "local-jubilado") && (
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
                </TabsContent>

                {/* Contenido para Bono Mensual */}
                <TabsContent value="bono-mensual" className="space-y-6">
                  <div className="space-y-2">
                    <Label>Condición</Label>
                    <RadioGroup value={condicionBonoMensual} onValueChange={setCondicionBonoMensual} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local-adulto" id="bm-local" />
                        <Label htmlFor="bm-local">Local ({preciosPiscina["bono-mensual"]["local-adulto"].toFixed(2)} €)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-local-adulto" id="bm-no-local" />
                        <Label htmlFor="bm-no-local">No Local ({preciosPiscina["bono-mensual"]["no-local-adulto"].toFixed(2)} €)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="familiar" id="bm-familiar" />
                        <Label htmlFor="bm-familiar">Familiar ({preciosPiscina["bono-mensual"].familiar.toFixed(2)} €)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campo de Carnet (obligatorio para usuarios locales) */}
                  {(condicionBonoMensual === "local-adulto" || condicionBonoMensual === "familiar") && (
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

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="expedicion-bono-mensual"
                      checked={expedicionBono}
                      onChange={(e) => setExpedicionBono(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="expedicion-bono-mensual">Expedición de bono (+2€)</Label>
                  </div>
                </TabsContent>

                {/* Contenido para Bono Temporada */}
                <TabsContent value="bono-temporada" className="space-y-6">
                  <div className="space-y-2">
                    <Label>Condición</Label>
                    <RadioGroup value={condicionBonoTemporada} onValueChange={setCondicionBonoTemporada} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local-adulto" id="bt-local" />
                        <Label htmlFor="bt-local">Local ({preciosPiscina["bono-temporada"]["local-adulto"].toFixed(2)} €)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-local-adulto" id="bt-no-local" />
                        <Label htmlFor="bt-no-local">No Local ({preciosPiscina["bono-temporada"]["no-local-adulto"].toFixed(2)} €)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campo de Carnet (obligatorio para usuarios locales) */}
                  {condicionBonoTemporada === "local-adulto" && (
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

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="expedicion-bono-temporada"
                      checked={expedicionBono}
                      onChange={(e) => setExpedicionBono(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="expedicion-bono-temporada">Expedición de bono (+2€)</Label>
                  </div>
                </TabsContent>

                {/* Contenido para Curso */}
                <TabsContent value="curso" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="tipo-curso">Tipo de Curso</Label>
                    <Select value={curso} onValueChange={setCurso}>
                      <SelectTrigger id="tipo-curso">
                        <SelectValue placeholder="Selecciona un curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aquasalud">Aquasalud</SelectItem>
                        <SelectItem value="infantil">Infantil</SelectItem>
                        <SelectItem value="adultos">Adultos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condición</Label>
                    <RadioGroup value={condicionCurso} onValueChange={setCondicionCurso} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local-jubilado" id="curso-jubilado" />
                        <Label htmlFor="curso-jubilado">
                          Jubilado Local ({["aquasalud", "adultos"].includes(curso) ? "Gratis" : `${preciosPiscina.curso[curso as keyof typeof preciosPiscina.curso]["local-jubilado"].toFixed(2)} €`})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local-adulto" id="curso-local" />
                        <Label htmlFor="curso-local">
                          Local ({preciosPiscina.curso[curso as keyof typeof preciosPiscina.curso]["local-adulto"].toFixed(2)} €)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-local-adulto" id="curso-no-local" />
                        <Label htmlFor="curso-no-local">
                          No Local ({preciosPiscina.curso[curso as keyof typeof preciosPiscina.curso]["no-local-adulto"].toFixed(2)} €)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Campo de Carnet (obligatorio para usuarios locales) */}
                  {(condicionCurso === "local-jubilado" || condicionCurso === "local-adulto") && (
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
                </TabsContent>
              </Tabs>

              {/* Resumen de Precio */}
              <div className="pt-6 mt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Precio Total:</span>
                  <span className="text-xl font-bold">
                    {precio === 0 ? "Gratis" : `${precio.toFixed(2)} €`}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || ((condicionIndividual.startsWith("local") || condicionIndividual === "familiar") && !numeroCarnet)}
              >
                {isLoading ? "Procesando..." : "Solicitar Pago"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
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
                  Tu {tab === "individual" ? "entrada" : tab === "curso" ? "curso" : "bono"} para la piscina ha sido{" "}
                  {tab === "individual" ? "reservada" : "adquirido"} correctamente.
                </p>

                <div className="bg-muted/30 p-6 rounded-lg max-w-md mx-auto mt-4 text-left">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="font-medium">Tipo:</div>
                      <div className="ml-2">
                        {tab === "individual"
                          ? "Entrada individual"
                          : tab === "curso"
                            ? `Curso de ${curso}`
                            : tab === "bono-mensual"
                              ? "Bono mensual"
                              : "Bono temporada"}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="font-medium">Precio:</div>
                      <div className="ml-2">{precio === 0 ? "Gratis" : `${precio.toFixed(2)} €`}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="font-medium">Condición:</div>
                      <div className="ml-2">
                        {condicionCurso === "local-jubilado"
                          ? "Jubilado Local"
                          : condicionCurso === "local-adulto"
                            ? "Local (adulto)"
                            : condicionCurso === "local-menor-3"
                              ? "Local (menor de 3 años)"
                              : condicionCurso === "familiar"
                                ? "Familiar"
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
                    {tab === "individual" ? (
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

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Información de Tarifas</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Entrada Individual</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Local (0-3 años)</span>
                      <span className="font-medium">Gratis</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Local (más de 3 años)</span>
                      <span className="font-medium">1,50 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>No Local (más de 3 años)</span>
                      <span className="font-medium">3,00 €</span>
                    </li>
                  </ul>

                  <h3 className="font-semibold mt-4 mb-2">Bono Mensual</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Local</span>
                      <span className="font-medium">25,00 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>No Local</span>
                      <span className="font-medium">50,00 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Familiar</span>
                      <span className="font-medium">75,00 €</span>
                    </li>
                  </ul>

                  <h3 className="font-semibold mt-4 mb-2">Bono Temporada</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Local</span>
                      <span className="font-medium">60,00 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>No Local</span>
                      <span className="font-medium">100,00 €</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cursos</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Aquasalud (Jubilado Local)</span>
                      <span className="font-medium">Gratis</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Aquasalud (Local)</span>
                      <span className="font-medium">35,00 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Aquasalud (No Local)</span>
                      <span className="font-medium">40,00 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Infantil</span>
                      <span className="font-medium">40,00 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Adultos (Jubilado Local)</span>
                      <span className="font-medium">Gratis</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Adultos (Local)</span>
                      <span className="font-medium">35,00 €</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Adultos (No Local)</span>
                      <span className="font-medium">40,00 €</span>
                    </li>
                  </ul>
                  <div className="mt-4 text-sm">
                    <span className="font-medium">Nota:</span> Expedición de bono: 2,00 €
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

