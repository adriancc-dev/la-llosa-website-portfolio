import { NextResponse } from "next/server"
import { sendReservaNotification } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const reservaData = await request.json()

    // Validar datos mínimos necesarios
    if (!reservaData.nombre || !reservaData.email || !reservaData.instalacion || !reservaData.fecha) {
      return NextResponse.json({ message: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Enviar notificación
    await sendReservaNotification({
      nombre: reservaData.nombre,
      email: reservaData.email,
      telefono: reservaData.telefono,
      dni: reservaData.dni,
      instalacion: reservaData.instalacion,
      fecha: new Date(reservaData.fecha),
      horaInicio: reservaData.horaInicio || "00:00",
      horaFin: reservaData.horaFin || "00:00",
      horas: reservaData.horas || 1,
      precio: reservaData.precio || 0,
      esLocal: reservaData.esLocal || false,
      conLuz: reservaData.conLuz,
      estado: reservaData.estado || "confirmada",
    })

    return NextResponse.json({ message: "Notificación enviada correctamente" })
  } catch (error: any) {
    console.error("Error al enviar notificación:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

