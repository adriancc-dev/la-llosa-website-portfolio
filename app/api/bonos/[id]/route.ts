import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    // Obtener ID del bono
    const id = params.id
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de bono inválido" }, { status: 400 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()
    const bono = await db.collection("bonos").findOne({ _id: new ObjectId(id) })

    if (!bono) {
      return NextResponse.json({ error: "Bono no encontrado" }, { status: 404 })
    }

    // Transformar _id a id para la respuesta
    return NextResponse.json({
      id: bono._id.toString(),
      ...bono,
      _id: undefined,
    })
  } catch (error) {
    console.error("Error al obtener bono:", error)
    return NextResponse.json({ error: "Error al obtener bono" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    // Obtener ID del bono
    const id = params.id
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de bono inválido" }, { status: 400 })
    }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()

    // Preparar datos para actualizar
    const actualizacion = {
      ...data,
      updatedAt: new Date(),
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()
    const result = await db.collection("bonos").updateOne({ _id: new ObjectId(id) }, { $set: actualizacion })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Bono no encontrado" }, { status: 404 })
    }

    // Obtener el bono actualizado
    const bonoActualizado = await db.collection("bonos").findOne({ _id: new ObjectId(id) })

    if (!bonoActualizado) {
      return NextResponse.json({ error: "Error al obtener el bono actualizado" }, { status: 500 })
    }

    return NextResponse.json({
      id: bonoActualizado._id.toString(),
      ...bonoActualizado,
      _id: undefined,
    })
  } catch (error) {
    console.error("Error al actualizar bono:", error)
    return NextResponse.json({ error: "Error al actualizar bono" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    // Obtener ID del bono
    const id = params.id
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de bono inválido" }, { status: 400 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // En lugar de eliminar, marcar como cancelado
    const result = await db
      .collection("bonos")
      .updateOne({ _id: new ObjectId(id) }, { $set: { estado: "cancelado", updatedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Bono no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Bono cancelado correctamente" })
  } catch (error) {
    console.error("Error al cancelar bono:", error)
    return NextResponse.json({ error: "Error al cancelar bono" }, { status: 500 })
  }
}

