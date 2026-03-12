"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { createContactEmailContent } from "@/lib/email"

export default function ContactoPage() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [asunto, setAsunto] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre || !email || !telefono || !asunto || !mensaje) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor, completa todos los campos del formulario",
        variant: "destructive",
      })
      return
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, introduce un email válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Crear contenido del email
      const emailContent = createContactEmailContent({
        nombre,
        email,
        telefono,
        asunto,
        mensaje,
      })

      // Enviar email al correo de la aplicación
      await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: `Contacto Web: ${asunto}`,
          text: emailContent.text,
          html: emailContent.html,
        }),
      })

      toast({
        title: "Mensaje enviado",
        description: "Hemos recibido tu mensaje. Nos pondremos en contacto contigo lo antes posible.",
      })

      // Resetear formulario
      setNombre("")
      setEmail("")
      setTelefono("")
      setAsunto("")
      setMensaje("")
    } catch (error) {
      toast({
        title: "Error al enviar el mensaje",
        description: "Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.",
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

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div className="max-w-6xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Contacto</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ponte en contacto con el Ayuntamiento de La Llosa para cualquier consulta, sugerencia o información
            adicional.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulario de Contacto */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input
                    id="nombre"
                    placeholder="Tu nombre completo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="600 000 000"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asunto">Asunto *</Label>
                  <Select value={asunto} onValueChange={setAsunto} required>
                    <SelectTrigger id="asunto">
                      <SelectValue placeholder="Selecciona un asunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Información">Información</SelectItem>
                      <SelectItem value="Deportes">Deportes</SelectItem>
                      <SelectItem value="Reserva">Reserva</SelectItem>
                      <SelectItem value="Incidencia">Incidencia</SelectItem>
                      <SelectItem value="Sugerencia">Sugerencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje *</Label>
                  <Textarea
                    id="mensaje"
                    placeholder="Escribe tu mensaje aquí..."
                    rows={5}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando mensaje..." : "Enviar mensaje"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  Los campos marcados con * son obligatorios
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Información de Contacto</h2>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-muted-foreground">Plaça España, 14, 12591 La Llosa, Castellón</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-muted-foreground">962 61 05 42</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Correo electrónico</p>
                    <p className="text-muted-foreground">ayuntamiento.lallosa@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Horario</p>
                    <p className="text-muted-foreground">Lunes a Viernes: 08:00 - 15:00</p>
                    <p className="text-muted-foreground">Sábados y Domingos: Cerrado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mapa */}
            <div className="h-80 rounded-lg overflow-hidden border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3066.2765383449403!2d-0.2636808!3d39.7700499!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd60193d0f25c8a5%3A0x40d6cb3c7e693e0!2sPla%C3%A7a%20Espanya%2C%2014%2C%2012591%20La%20Llosa%2C%20Castell%C3%B3n!5e0!3m2!1ses!2ses!4v1616000000000!5m2!1ses!2ses"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de La Llosa"
              ></iframe>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

