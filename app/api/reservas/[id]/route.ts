import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const reservaId = params.id

    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const userData = verifyToken(token) as any
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
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
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const reservaId = params.id

    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const userData = verifyToken(token) as any
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Obtener la reserva
    const reserva = await db.collection("reservas").findOne({
      _id: new ObjectId(reservaId),
    })

    if (!reserva) {
      return NextResponse.json({ message: "Reserva no encontrada" }, { status: 404 })
    }

    // Verificar que el usuario tiene permiso para ver esta reserva
    if (reserva.idUsuario !== userData.id && userData.role !== "admin") {
      return NextResponse.json({ message: "No autorizado para ver esta reserva" }, { status: 403 })
    }

    // Transformar _id a id
    const reservaConId = {
      ...reserva,
      id: reserva._id.toString(),
    }

    return NextResponse.json(reservaConId)
  } catch (error: any) {
    console.error("Error al obtener reserva:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

