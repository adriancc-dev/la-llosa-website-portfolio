import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const userId = context.params.id

    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    // Verificar que el usuario solicita sus propios datos o es admin
    if (userData.id !== userId && userData.role !== "admin") {
      return NextResponse.json({ message: "No autorizado para ver estos datos" }, { status: 403 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Buscar usuario por ID
    const user = await db.collection("usuarios").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Eliminar la contraseña antes de devolver los datos
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      ...userWithoutPassword,
      id: user._id.toString(),
    })
  } catch (error: any) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const userId = context.params.id

    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    // Verificar que el usuario actualiza sus propios datos o es admin
    if (userData.id !== userId && userData.role !== "admin") {
      return NextResponse.json({ message: "No autorizado para actualizar estos datos" }, { status: 403 })
    }

    // Obtener datos del cuerpo
    const updateData = await request.json()

    // Validar datos básicos
    if (!updateData.nombre || !updateData.email) {
      return NextResponse.json({ message: "Nombre y email son requeridos" }, { status: 400 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Verificar si el email ya existe (si se está cambiando)
    if (updateData.email !== userData.email) {
      const existingUser = await db.collection("usuarios").findOne({
        email: updateData.email,
        _id: { $ne: new ObjectId(userId) },
      })

      if (existingUser) {
        return NextResponse.json({ message: "El email ya está en uso por otro usuario" }, { status: 400 })
      }
    }

    // Preparar datos para actualizar
    const dataToUpdate = {
      nombre: updateData.nombre,
      email: updateData.email,
      telefono: updateData.telefono || null,
      dni: updateData.dni || null,
      updatedAt: new Date(),
    }

    // Actualizar usuario
    const result = await db.collection("usuarios").updateOne({ _id: new ObjectId(userId) }, { $set: dataToUpdate })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener usuario actualizado
    const updatedUser = await db.collection("usuarios").findOne({ _id: new ObjectId(userId) })

    if (!updatedUser) {
      return NextResponse.json({ message: "Error al obtener usuario actualizado" }, { status: 500 })
    }

    // Eliminar la contraseña antes de devolver los datos
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      ...userWithoutPassword,
      id: updatedUser._id.toString(),
    })
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

