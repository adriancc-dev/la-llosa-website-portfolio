// Este componente ya no es necesario porque el pago se realiza exclusivamente a través de Redsys.
// Puedes eliminar este archivo si lo deseas.

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, Landmark, Wallet } from "lucide-react"

type PaymentModalProps = {
  isOpen: boolean
  onClose: () => void
  amount: number
  onSuccess: (metodoPago: string) => void
  description: string
}

export function PaymentModal({ isOpen, onClose, amount, onSuccess, description }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Si el monto es 0, no necesitamos validar los datos de pago
    if (amount === 0) {
      setIsProcessing(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        toast({
          title: "Reserva confirmada",
          description: "Tu reserva gratuita ha sido confirmada.",
        })
        onSuccess("gratuito")
        onClose()
      } catch (error) {
        toast({
          title: "Error en la reserva",
          description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
      return
    }

    // Validaciones básicas para pagos con tarjeta
    if (paymentMethod === "card") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvc) {
        toast({
          title: "Datos incompletos",
          description: "Por favor, completa todos los campos de la tarjeta",
          variant: "destructive",
        })
        return
      }

      // Validar número de tarjeta (simplificado)
      if (cardNumber.replace(/\s/g, "").length !== 16) {
        toast({
          title: "Número de tarjeta inválido",
          description: "El número de tarjeta debe tener 16 dígitos",
          variant: "destructive",
        })
        return
      }

      // Validar CVC
      if (cardCvc.length !== 3) {
        toast({
          title: "CVC inválido",
          description: "El CVC debe tener 3 dígitos",
          variant: "destructive",
        })
        return
      }

      // Validar fecha de expiración
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
      if (!expiryRegex.test(cardExpiry)) {
        toast({
          title: "Fecha de expiración inválida",
          description: "El formato debe ser MM/YY",
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)

    try {
      // Simulación de procesamiento de pago
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Pago realizado con éxito",
        description: "Tu reserva ha sido confirmada.",
      })

      onSuccess(paymentMethod)
      onClose()
    } catch (error) {
      toast({
        title: "Error en el pago",
        description: "Ha ocurrido un error al procesar el pago. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }

    return value
  }

  // Resetear el formulario cuando se cierra el modal
  const handleClose = () => {
    setCardNumber("")
    setCardName("")
    setCardExpiry("")
    setCardCvc("")
    setPaymentMethod("card")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Realizar pago</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="card" id="payment-card" className="peer sr-only" />
                <Label
                  htmlFor="payment-card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  Tarjeta
                </Label>
              </div>

              <div>
                <RadioGroupItem value="bank" id="payment-bank" className="peer sr-only" />
                <Label
                  htmlFor="payment-bank"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Landmark className="mb-3 h-6 w-6" />
                  Banco
                </Label>
              </div>

              <div>
                <RadioGroupItem value="bizum" id="payment-bizum" className="peer sr-only" />
                <Label
                  htmlFor="payment-bizum"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Wallet className="mb-3 h-6 w-6" />
                  Bizum
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === "card" && amount > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">Número de tarjeta</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-name">Nombre en la tarjeta</Label>
                <Input
                  id="card-name"
                  placeholder="NOMBRE APELLIDOS"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-expiry">Fecha de caducidad</Label>
                  <Input
                    id="card-expiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-cvc">CVC</Label>
                  <Input
                    id="card-cvc"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ""))}
                    maxLength={3}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "bank" && amount > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Realiza una transferencia bancaria a la siguiente cuenta:</p>
              <div className="rounded-md bg-muted p-3">
                <p className="font-mono text-sm">ES12 3456 7890 1234 5678 9012</p>
                <p className="text-xs text-muted-foreground mt-1">Ayuntamiento de La Llosa</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Incluye en el concepto: <span className="font-medium">RESERVA-{Math.floor(Math.random() * 10000)}</span>
              </p>
            </div>
          )}

          {paymentMethod === "bizum" && amount > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Realiza un pago Bizum al siguiente número:</p>
              <div className="rounded-md bg-muted p-3">
                <p className="font-mono text-sm">600 123 456</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Incluye en el concepto: <span className="font-medium">RESERVA-{Math.floor(Math.random() * 10000)}</span>
              </p>
            </div>
          )}

          {amount === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Esta reserva es gratuita. No se realizará ningún cargo.</p>
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">Reserva sin coste</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total a pagar:</span>
              <span className="text-xl font-bold">{amount === 0 ? "Gratis" : `${amount.toFixed(2)} €`}</span>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? "Procesando..." : amount === 0 ? "Confirmar reserva" : "Pagar ahora"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

