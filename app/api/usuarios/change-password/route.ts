import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
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

    // Obtener datos del cuerpo
    const { userId, newPassword } = await request.json()

    // Verificar que el usuario cambia su propia contraseña o es admin
    if (userData.id !== userId && userData.role !== "admin") {
      return NextResponse.json({ message: "No autorizado para cambiar esta contraseña" }, { status: 403 })
    }

    // Validar contraseña
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar la contraseña
    const result = await db.collection("usuarios").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Contraseña actualizada correctamente" })
  } catch (error: any) {
    console.error("Error al cambiar contraseña:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

