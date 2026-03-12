import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getReservasByDate } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { esHoraDisponible } from "@/lib/horarios-service"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    const reservaData = await request.json()
    const { instalacion, fecha, horaInicio, horaFin, horas } = reservaData

    // Validar datos
    if (!instalacion || !fecha || !horaInicio || !horas) {
      return NextResponse.json({ message: "Faltan datos obligatorios", data: reservaData }, { status: 400 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Verificar disponibilidad para reservas deportivas
    if (reservaData.tipoReserva === "deportiva") {
      const fechaObj = new Date(fecha)
      const reservasExistentes = await getReservasByDate(fechaObj)

      // Verificar si hay solapamiento
      const disponible = esHoraDisponible(
        fechaObj,
        horaInicio,
        horaFin || `${Number.parseInt(horaInicio) + horas}:00`,
        reservasExistentes,
        reservaData.instalacion, // Pasar la instalación para verificar disponibilidad específica
      )

      if (!disponible) {
        return NextResponse.json(
          {
            message: "El horario seleccionado ya está reservado",
            instalacion: reservaData.instalacion,
          },
          { status: 400 },
        )
      }
    }

    // Crear nueva reserva
    const now = new Date()
    const nuevaReserva = {
      ...reservaData,
      idUsuario: userData.id, // Aseguramos que el ID del usuario sea el del token
      fecha: new Date(fecha), // Convertir a objeto Date
      createdAt: now,
      updatedAt: now,
      estado: reservaData.estado || "confirmada", // Asegurar que tenga un estado
    }

    // Asegurar que horaFin esté definido si no viene en los datos
    if (!nuevaReserva.horaFin && nuevaReserva.horaInicio && nuevaReserva.horas) {
      const horaInicioNum = Number.parseInt(nuevaReserva.horaInicio.split(":")[0])
      nuevaReserva.horaFin = `${horaInicioNum + nuevaReserva.horas}:00`
    }

    console.log("Guardando reserva:", nuevaReserva)
    const result = await db.collection("reservas").insertOne(nuevaReserva)

    // Crear registro de pago si es necesario
    if (reservaData.precio > 0) {
      const pago = {
        reservaId: result.insertedId.toString(),
        usuarioId: userData.id,
        monto: reservaData.precio,
        metodoPago: reservaData.metodoPago || "tarjeta", // Usar método de pago proporcionado o default
        estado: "completado",
        referencia: `PAY-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      }

      await db.collection("pagos").insertOne(pago)
    }

    return NextResponse.json({
      message: "Reserva creada correctamente",
      id: result.insertedId.toString(),
    })
  } catch (error: any) {
    console.error("Error al crear reserva:", error)
    return NextResponse.json(
      {
        message: "Error al procesar la solicitud",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Se hace un casting a "any" para poder acceder a "role"
    const userData = verifyToken(token) as any
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const fechaStr = searchParams.get("fecha")
    const instalacion = searchParams.get("instalacion")
    const usuarioId = searchParams.get("usuarioId")
    const tipoReserva = searchParams.get("tipoReserva")

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Construir filtro
    const filtro: any = {}

    if (fechaStr) {
      const fecha = new Date(fechaStr)
      const startOfDay = new Date(fecha)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(fecha)
      endOfDay.setHours(23, 59, 59, 999)

      filtro.fecha = {
        $gte: startOfDay,
        $lte: endOfDay,
      }
    }

    if (instalacion) {
      filtro.instalacion = instalacion
    }

    if (tipoReserva) {
      filtro.tipoReserva = tipoReserva
    }

    if (usuarioId) {
      // Solo permitir ver reservas propias a menos que sea admin
      if (usuarioId !== userData.id && userData.role !== "admin") {
        return NextResponse.json({ message: "No autorizado para ver reservas de otros usuarios" }, { status: 403 })
      }
      filtro.idUsuario = usuarioId
    }

    // Excluir reservas canceladas por defecto a menos que se especifique
    const incluirCanceladas = searchParams.get("incluirCanceladas") === "true"
    if (!incluirCanceladas) {
      filtro.estado = { $ne: "cancelada" }
    }

    console.log("Filtro de búsqueda:", filtro)

    const reservas = await db.collection("reservas").find(filtro).sort({ fecha: 1, horaInicio: 1 }).toArray()

    // Transformar _id a id en cada reserva
    const reservasConId = reservas.map((reserva: any) => ({
      ...reserva,
      id: reserva._id.toString(),
    }))

    console.log(`Se encontraron ${reservasConId.length} reservas`)
    return NextResponse.json(reservasConId)
  } catch (error: any) {
    console.error("Error al obtener reservas:", error)
    return NextResponse.json(
      {
        message: "Error al procesar la solicitud",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// Añadimos el endpoint para cancelar reservas
export async function DELETE(request: Request) {
  try {
    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    // Obtener ID de la reserva de la URL
    const url = new URL(request.url)
    const path = url.pathname
    const reservaId = path.split("/").pop()

    if (!reservaId) {
      return NextResponse.json({ message: "ID de reserva no proporcionado" }, { status: 400 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Verificar que la reserva existe y pertenece al usuario
    const reserva = await db.collection("reservas").findOne({
      _id: new ObjectId(reservaId),
    })

    if (!reserva) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 })
    }

    if (reserva.idUsuario !== userData.id && userData.role !== "admin") {
      return NextResponse.json({ message: "No autorizado para cancelar esta reserva" }, { status: 403 })
    }

    // Actualizar el estado de la reserva a "cancelada"
    await db
      .collection("reservas")
      .updateOne({ _id: new ObjectId(reservaId) }, { $set: { estado: "cancelada", updatedAt: new Date() } })

    return NextResponse.json({ message: "Reserva cancelada correctamente" })
  } catch (error: any) {
    console.error("Error al cancelar reserva:", error)
    return NextResponse.json(
      {
        message: "Error al procesar la solicitud",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

