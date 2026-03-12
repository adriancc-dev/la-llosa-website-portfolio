"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { es } from "date-fns/locale"
import { getReservasByDate } from "@/lib/mongodb"
import type { Reserva } from "@/lib/database"
import { format, isBefore, startOfDay } from "date-fns"
import { obtenerHorariosDisponibles, esHoraPasada } from "@/lib/horarios-service"
import { Skeleton } from "@/components/ui/skeleton"

type ReservasCalendarProps = {
  onDateSelect: (date: Date | undefined) => void
  selectedDate: Date | undefined
  instalacionFilter?: string
}

export function ReservasCalendar({ onDateSelect, selectedDate, instalacionFilter }: ReservasCalendarProps) {
  const [reservasDelDia, setReservasDelDia] = useState<Reserva[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([])

  // Fecha actual para bloquear días pasados
  const currentDate = new Date(2025, 2, 17) // 17 de marzo de 2025

  useEffect(() => {
    const loadReservas = async () => {
      if (!selectedDate) return

      setIsLoading(true)
      try {
        const reservas = await getReservasByDate(selectedDate)
        // Filtrar por instalación si se proporciona un filtro
        const filteredReservas = instalacionFilter
          ? reservas.filter((r) => r.instalacion === instalacionFilter)
          : reservas

        setReservasDelDia(filteredReservas)

        // Obtener horas disponibles según la temporada
        const horariosTemporada = obtenerHorariosDisponibles(selectedDate)
        setHorasDisponibles(horariosTemporada)
      } catch (error) {
        console.error("Error al cargar reservas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReservas()
  }, [selectedDate, instalacionFilter])

  // Función para deshabilitar fechas pasadas
  const disabledDays = (date: Date) => {
    // Deshabilitar días anteriores a la fecha actual
    return isBefore(date, startOfDay(currentDate))
  }

  // Función para verificar si una hora está en el pasado
  const isHoraPasada = (hora: string) => {
    if (!selectedDate) return false
    return esHoraPasada(selectedDate, hora)
  }

  // Función para verificar si una hora está ocupada para la instalación específica
  const isHoraOcupada = (hora: string) => {
    if (!selectedDate || !instalacionFilter) return false

    const horaIndex = horasDisponibles.indexOf(hora)
    if (horaIndex === -1) return false

    const horaFin = horasDisponibles[horaIndex + 1] || "24:00"

    return reservasDelDia.some((r) => {
      // Solo considerar reservas para la instalación específica
      if (r.instalacion !== instalacionFilter) return false

      const rInicio = Number.parseInt(r.horaInicio.split(":")[0], 10)
      const rFin = r.horaFin ? Number.parseInt(r.horaFin.split(":")[0], 10) : rInicio + r.horas
      const inicio = Number.parseInt(hora.split(":")[0], 10)
      const fin = Number.parseInt(horaFin.split(":")[0], 10)

      return (
        (inicio >= rInicio && inicio < rFin) || (fin > rInicio && fin <= rFin) || (inicio <= rInicio && fin >= rFin)
      )
    })
  }

  // Función para verificar si una fecha es hoy (comparando con currentDate)
  const isCurrentDay = (date: Date) => {
    return (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    )
  }

  // Función para personalizar el día en el calendario
  const dayClassName = (date: Date) => {
    if (isCurrentDay(date)) {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
    }
    return ""
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Calendario de Reservas</CardTitle>
          <CardDescription>Selecciona una fecha para ver disponibilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            locale={es}
            disabled={disabledDays}
            className="rounded-md border"
            modifiersClassNames={{
              today: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
            }}
            modifiers={{
              today: (date) => isCurrentDay(date),
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>
            Disponibilidad {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : ""}
          </CardTitle>
          <CardDescription>
            {selectedDate
              ? instalacionFilter
                ? `Horarios para ${instalacionFilter}`
                : "Horarios disponibles y ocupados"
              : "Selecciona una fecha en el calendario"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : selectedDate ? (
            <div className="space-y-2">
              {horasDisponibles.map((hora) => {
                const isPasada = isHoraPasada(hora)
                const isOcupada = isHoraOcupada(hora)

                return (
                  <div
                    key={hora}
                    className={`p-3 rounded-md flex justify-between items-center ${
                      isOcupada
                        ? "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                        : isPasada
                          ? "bg-gray-100 dark:bg-gray-800/50 opacity-60"
                          : "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                    }`}
                  >
                    <span className="font-medium">{hora}</span>
                    <span className="text-sm">
                      {isOcupada
                        ? `Ocupado${
                            instalacionFilter
                              ? ""
                              : ` (${
                                  reservasDelDia.find((r) => {
                                    const rInicio = Number.parseInt(r.horaInicio.split(":")[0], 10)
                                    const rFin = r.horaFin
                                      ? Number.parseInt(r.horaFin.split(":")[0], 10)
                                      : rInicio + r.horas
                                    const inicio = Number.parseInt(hora.split(":")[0], 10)
                                    return inicio >= rInicio && inicio < rFin
                                  })?.instalacion || "Reservado"
                                })`
                          }`
                        : isPasada
                          ? "Hora pasada"
                          : "Disponible"}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecciona una fecha para ver la disponibilidad
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

