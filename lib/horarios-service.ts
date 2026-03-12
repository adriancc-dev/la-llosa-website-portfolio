import { isAfter, isBefore, isToday } from "date-fns"
import type { Reserva } from "@/lib/database"

// Función para determinar la temporada (invierno o verano)
export function determinarTemporada(fecha: Date): "invierno" | "verano" {
  const mes = fecha.getMonth() + 1 // getMonth() devuelve 0-11
  // Temporada de verano: junio a septiembre (6-9)
  if (mes >= 6 && mes <= 9) {
    return "verano"
  }
  // Resto del año: temporada de invierno
  return "invierno"
}

// Función para obtener los horarios disponibles según la temporada
export function obtenerHorariosDisponibles(fecha: Date): string[] {
  const temporada = determinarTemporada(fecha)

  if (temporada === "verano") {
    // Horario de verano: 7:00 a 24:00
    return [
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
      "23:00",
      "24:00",
    ]
  } else {
    // Horario de invierno: 8:00 a 22:00
    return [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
    ]
  }
}

// Función para verificar si una hora ya ha pasado
export function esHoraPasada(fecha: Date, hora: string): boolean {
  const ahora = new Date()

  // Solo verificar si es el día actual
  if (!isToday(fecha)) {
    return false
  }

  // Crear fecha con la hora especificada
  const [horaStr, minutosStr] = hora.split(":")
  const fechaHora = new Date(fecha)
  fechaHora.setHours(Number.parseInt(horaStr), Number.parseInt(minutosStr || "0"), 0, 0)

  // Verificar si la hora ya ha pasado
  return isAfter(ahora, fechaHora)
}

// Función para verificar si una hora está disponible
export function esHoraDisponible(
  fecha: Date,
  horaInicio: string,
  horaFin: string,
  reservasExistentes: Reserva[],
  instalacionSeleccionada?: string,
): boolean {
  // Filtrar reservas por instalación si se proporciona
  const reservasFiltradas = instalacionSeleccionada
    ? reservasExistentes.filter((r) => r.instalacion === getNombreInstalacion(instalacionSeleccionada))
    : reservasExistentes

  // Convertir horas a objetos Date para comparación
  const fechaInicio = new Date(fecha)
  const [horaInicioStr, minutosInicioStr] = horaInicio.split(":")
  fechaInicio.setHours(Number.parseInt(horaInicioStr), Number.parseInt(minutosInicioStr || "0"), 0, 0)

  const fechaFin = new Date(fecha)
  const [horaFinStr, minutosFinStr] = horaFin.split(":")
  fechaFin.setHours(Number.parseInt(horaFinStr), Number.parseInt(minutosFinStr || "0"), 0, 0)

  // Verificar si hay solapamiento con alguna reserva existente
  for (const reserva of reservasFiltradas) {
    // Ignorar reservas canceladas
    if (reserva.estado === "cancelada") continue

    // Convertir horas de la reserva a objetos Date
    const reservaInicio = new Date(reserva.fecha)
    const [horaReservaInicioStr, minutosReservaInicioStr] = reserva.horaInicio.split(":")
    reservaInicio.setHours(Number.parseInt(horaReservaInicioStr), Number.parseInt(minutosReservaInicioStr || "0"), 0, 0)

    let reservaFin: Date
    if (reserva.horaFin) {
      reservaFin = new Date(reserva.fecha)
      const [horaReservaFinStr, minutosReservaFinStr] = reserva.horaFin.split(":")
      reservaFin.setHours(Number.parseInt(horaReservaFinStr), Number.parseInt(minutosReservaFinStr || "0"), 0, 0)
    } else {
      // Si no hay hora de fin, calcularla basada en la duración
      reservaFin = new Date(reservaInicio)
      reservaFin.setHours(reservaInicio.getHours() + (reserva.horas || 1))
    }

    // Verificar solapamiento
    // Hay solapamiento si:
    // - La hora de inicio de la nueva reserva está dentro del rango de una reserva existente
    // - La hora de fin de la nueva reserva está dentro del rango de una reserva existente
    // - La nueva reserva engloba completamente a una reserva existente
    if (
      ((isAfter(fechaInicio, reservaInicio) || fechaInicio.getTime() === reservaInicio.getTime()) &&
        isBefore(fechaInicio, reservaFin)) ||
      (isAfter(fechaFin, reservaInicio) &&
        (isBefore(fechaFin, reservaFin) || fechaFin.getTime() === reservaFin.getTime())) ||
      (isBefore(fechaInicio, reservaInicio) && isAfter(fechaFin, reservaFin))
    ) {
      console.log(`Solapamiento detectado con reserva existente: ${reserva.id} - ${reserva.instalacion}`)
      return false
    }
  }

  return true
}

// Función para obtener el estado de cada hora (disponible, pasada, reservada)
export function obtenerEstadoHoras(
  fecha: Date,
  reservasExistentes: Reserva[],
  instalacionSeleccionada?: string,
): { hora: string; disponible: boolean; pasada: boolean; reservada: boolean; instalacionOcupada?: string }[] {
  const horariosDisponibles = obtenerHorariosDisponibles(fecha)

  // Filtrar reservas por instalación si se proporciona
  const reservasFiltradas = instalacionSeleccionada
    ? reservasExistentes.filter((r) => r.instalacion === getNombreInstalacion(instalacionSeleccionada))
    : reservasExistentes

  return horariosDisponibles.map((hora) => {
    // Verificar si la hora ya ha pasado
    const pasada = esHoraPasada(fecha, hora)

    // Verificar si la hora está reservada
    let reservada = false
    let instalacionOcupada: string | undefined = undefined

    // Hora fin es la siguiente hora en el array
    const horaIndex = horariosDisponibles.indexOf(hora)
    const horaFin = horariosDisponibles[horaIndex + 1] || "24:00"

    // Verificar cada reserva
    for (const reserva of reservasFiltradas) {
      // Ignorar reservas canceladas
      if (reserva.estado === "cancelada") continue

      // Convertir horas de la reserva a objetos Date para comparación
      const reservaInicio = new Date(reserva.fecha)
      const [horaReservaInicioStr, minutosReservaInicioStr] = reserva.horaInicio.split(":")
      reservaInicio.setHours(
        Number.parseInt(horaReservaInicioStr),
        Number.parseInt(minutosReservaInicioStr || "0"),
        0,
        0,
      )

      let reservaFin: Date
      if (reserva.horaFin) {
        reservaFin = new Date(reserva.fecha)
        const [horaReservaFinStr, minutosReservaFinStr] = reserva.horaFin.split(":")
        reservaFin.setHours(Number.parseInt(horaReservaFinStr), Number.parseInt(minutosReservaFinStr || "0"), 0, 0)
      } else {
        // Si no hay hora de fin, calcularla basada en la duración
        reservaFin = new Date(reservaInicio)
        reservaFin.setHours(reservaInicio.getHours() + (reserva.horas || 1))
      }

      // Convertir la hora actual a objeto Date para comparación
      const horaActual = new Date(fecha)
      const [horaActualStr, minutosActualStr] = hora.split(":")
      horaActual.setHours(Number.parseInt(horaActualStr), Number.parseInt(minutosActualStr || "0"), 0, 0)

      const horaActualFin = new Date(fecha)
      const [horaActualFinStr, minutosActualFinStr] = horaFin.split(":")
      horaActualFin.setHours(Number.parseInt(horaActualFinStr), Number.parseInt(minutosActualFinStr || "0"), 0, 0)

      // Verificar si la hora actual está dentro del rango de la reserva
      if (
        (isAfter(horaActual, reservaInicio) || horaActual.getTime() === reservaInicio.getTime()) &&
        isBefore(horaActual, reservaFin)
      ) {
        reservada = true
        instalacionOcupada = reserva.instalacion
        break
      }
    }

    return {
      hora,
      disponible: !pasada && !reservada,
      pasada,
      reservada,
      instalacionOcupada,
    }
  })
}

// Función para obtener el nombre completo de la instalación
export function getNombreInstalacion(tipoInstalacion: string): string {
  switch (tipoInstalacion) {
    case "padel":
      return "Pista de Pádel"
    case "futbol":
      return "Campo de Fútbol"
    case "futbol-sala":
      return "Pista de Fútbol Sala"
    case "fronton":
      return "Frontón"
    case "gimnasio":
      return "Gimnasio Municipal"
    case "piscina":
      return "Piscina Municipal"
    default:
      return tipoInstalacion
  }
}

