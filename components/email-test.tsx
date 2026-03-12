"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function EmailTest() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor, introduce un correo electrónico válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: "Correo de prueba - Ayuntamiento de La Llosa",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #22c55e;">¡Correo de prueba!</h1>
              <p>Este es un correo de prueba del sistema de notificaciones del Ayuntamiento de La Llosa.</p>
              <p>Si has recibido este correo, significa que el sistema de notificaciones está funcionando correctamente.</p>
            </div>
          `,
          text: "Este es un correo de prueba del sistema de notificaciones del Ayuntamiento de La Llosa.",
        }),
      })

      if (!response.ok) {
        throw new Error("Error al enviar el correo de prueba")
      }

      toast({
        title: "Correo enviado",
        description: `Se ha enviado un correo de prueba a ${email}`,
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de prueba",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Prueba de correo electrónico</CardTitle>
        <CardDescription>Envía un correo de prueba para verificar la configuración</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              placeholder="tu@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSendTestEmail} disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar correo de prueba"}
        </Button>
      </CardFooter>
    </Card>
  )
}

